import { useEffect, useState } from 'react'
import api from '../services/api'
import { getRole } from '../services/auth'
import { registerUser, listUsers } from '../services/auth'
import { getClasses, getClassDetails, createStudent, createAcademicYear, createClass, createTeacher, bulkPromote } from '../services/academic'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [classes, setClasses] = useState([])

  // Academic Year form state
  const [yearName, setYearName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isCurrent, setIsCurrent] = useState(true)

  // Class form state
  const [className, setClassName] = useState('')
  const [gradeLevel, setGradeLevel] = useState('')
  const [section, setSection] = useState('')
  const [classTeacherId, setClassTeacherId] = useState('')
  const [academicYearId, setAcademicYearId] = useState('')

  // Teacher form state
  const [tName, setTName] = useState('')
  const [tEmail, setTEmail] = useState('')
  const [tPassword, setTPassword] = useState('')
  const [tPhone, setTPhone] = useState('')
  const [employeeId, setEmployeeId] = useState('')

  // Student form state
  const [sName, setSName] = useState('')
  const [sEmail, setSEmail] = useState('')
  const [sPassword, setSPassword] = useState('')
  const [sPhone, setSPhone] = useState('')
  const [studentId, setStudentId] = useState('')
  const [selectedClassId, setSelectedClassId] = useState('')
  const [rollNumber, setRollNumber] = useState('')
  const [admissionDate, setAdmissionDate] = useState('')

  // Batch add students state
  const [selectedBatchClassId, setSelectedBatchClassId] = useState('')
  const [bsName, setBsName] = useState('')
  const [bsEmail, setBsEmail] = useState('')
  const [bsPhone, setBsPhone] = useState('')
  const [bsRoll, setBsRoll] = useState('')
  const [pendingStudents, setPendingStudents] = useState([]) // {name,email,phone,rollNumber,studentId}
  const [isCreatingBatch, setIsCreatingBatch] = useState(false)

  // Promotions state
  const [fromClassId, setFromClassId] = useState('')
  const [toClassId, setToClassId] = useState('')
  const [fromClassStudents, setFromClassStudents] = useState([])
  const [promoteActions, setPromoteActions] = useState({}) // { [studentId]: 'promote'|'stay'|'tc' }

  const DEFAULT_STUDENT_PASSWORD = 'Welcome@123'

  function genStudentId() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const digits = '0123456789'
    const l = () => letters[Math.floor(Math.random()*letters.length)]
    const d = () => digits[Math.floor(Math.random()*digits.length)]
    return `${l()}${l()}${l()}${d()}${d()}`
  }

  function fetchOverview() {
    api.get('/analytics/dashboard')
      .then(res => setData(res.data.overview))
      .catch(err => setError(err?.response?.data?.error || 'Failed to load dashboard'))
  }

  useEffect(() => { fetchOverview() }, [])

  useEffect(() => {
    // preload classes for student form
    getClasses().then(res => setClasses(res.data.classes || res.data.data || res.data))
      .catch(() => setClasses([]))
  }, [])

  async function onCreateAcademicYear(e) {
    e.preventDefault()
    await createAcademicYear({ yearName, startDate, endDate, isCurrent })
    setYearName(''); setStartDate(''); setEndDate(''); setIsCurrent(true)
    alert('Academic year created')
    fetchOverview()
  }

  async function onCreateTeacher(e) {
    e.preventDefault()
    try {
      await registerUser({ email: tEmail, password: tPassword, name: tName, role: 'teacher', phone: tPhone })
    } catch (_) {
      // ignore duplicate; we'll try to find the user
    }
    // find user id (new or existing)
    const usersRes = await listUsers({ role: 'teacher', search: tEmail })
    const tu = (usersRes.data.users || []).find(u => u.email === tEmail)
    if (tu) {
      const empId = employeeId || `EMP-${Date.now()}`
      try { await createTeacher({ userId: tu.id, employeeId: empId }) } catch {}
    }
    setTName(''); setTEmail(''); setTPassword(''); setTPhone(''); setEmployeeId('')
    alert('Teacher created')
    fetchOverview()
  }

  async function onCreateStudent(e) {
    e.preventDefault()
    try {
      await registerUser({ email: sEmail, password: sPassword, name: sName, role: 'student', phone: sPhone })
    } catch (_) {
      // ignore duplicate
    }
    const usersRes = await listUsers({ role: 'student', search: sEmail })
    const u = (usersRes.data.users || []).find(u => u.email === sEmail)
    if (!u) { alert('Student user created, but user id not found. Open Users list and retry linking.'); return }
    
    // Auto-assign roll number if not provided
    let finalRollNumber = rollNumber ? Number(rollNumber) : null
    if (!finalRollNumber && selectedClassId) {
      finalRollNumber = await getNextRollNumber(selectedClassId)
    }
    
    await createStudent({ userId: u.id, studentId, classId: Number(selectedClassId), admissionDate: admissionDate || new Date().toISOString().slice(0,10), rollNumber: finalRollNumber })
    setSName(''); setSEmail(''); setSPassword(''); setSPhone(''); setStudentId(''); setSelectedClassId(''); setRollNumber(''); setAdmissionDate('')
    alert('Student created and linked to class')
    fetchOverview()
  }

  // Helper to get next roll number for a class
  async function getNextRollNumber(classId) {
    try {
      const res = await getStudents({ classId })
      const students = res.data.students || []
      const rollNumbers = students.map(s => s.roll_number).filter(r => r != null).sort((a, b) => a - b)
      
      // Find the next available roll number starting from 1
      let nextRoll = 1
      for (const roll of rollNumbers) {
        if (roll === nextRoll) {
          nextRoll++
        } else {
          break
        }
      }
      return nextRoll
    } catch {
      return 1 // Default to 1 if error
    }
  }

  // Batch add helpers
  function onAddPendingStudent(e) {
    e.preventDefault()
    if (!bsName || !bsEmail) return
    // ensure no duplicate emails in list
    if (pendingStudents.some(s => s.email.toLowerCase() === bsEmail.toLowerCase())) return
    let sid = genStudentId()
    // avoid local duplicates of studentId
    while (pendingStudents.some(s => s.studentId === sid)) sid = genStudentId()
    const item = { name: bsName, email: bsEmail, phone: bsPhone || '', rollNumber: bsRoll || '', studentId: sid }
    setPendingStudents(prev => [...prev, item])
    setBsName(''); setBsEmail(''); setBsPhone(''); setBsRoll('')
  }

  function onRemovePending(idx) {
    setPendingStudents(prev => prev.filter((_, i) => i !== idx))
  }

  async function onBatchCreateStudents() {
    if (!selectedBatchClassId || pendingStudents.length === 0) return
    setIsCreatingBatch(true)
    
    // Sort students alphabetically by name for consistent roll number assignment
    const sortedStudents = [...pendingStudents].sort((a, b) => a.name.localeCompare(b.name))
    
    // Get current max roll number for the class
    let nextRollNumber = await getNextRollNumber(selectedBatchClassId)
    
    let success = 0; const fails = []
    for (const s of sortedStudents) {
      try {
        try { await registerUser({ email: s.email, password: DEFAULT_STUDENT_PASSWORD, name: s.name, role: 'student', phone: s.phone }) } catch (_) {}
        const usersRes = await listUsers({ role: 'student', search: s.email })
        const u = (usersRes.data.users || []).find(u => u.email === s.email)
        if (!u) throw new Error('User lookup failed')
        
        // Use provided roll number or auto-assign
        const finalRollNumber = s.rollNumber ? Number(s.rollNumber) : nextRollNumber++
        
        // attempt with retries for studentId collisions
        let sid = s.studentId
        let created = false
        for (let i=0; i<3 && !created; i++) {
          try {
            await createStudent({ userId: u.id, studentId: sid, classId: Number(selectedBatchClassId), admissionDate: new Date().toISOString().slice(0,10), rollNumber: finalRollNumber })
            created = true
          } catch (err) {
            const msg = err?.response?.data?.error || ''
            if (msg.toLowerCase().includes('student id already exists')) {
              sid = genStudentId()
              continue
            }
            throw err
          }
        }
        if (!created) throw new Error('Could not create student after retries')
        success++
      } catch (e) {
        fails.push({ email: s.email, reason: e?.response?.data?.error || e.message })
      }
    }
    setIsCreatingBatch(false)
    setPendingStudents([])
    fetchOverview()
    alert(`Batch finished. Created: ${success}, Failed: ${fails.length}${fails.length? '\n' + fails.map(f=>`${f.email}: ${f.reason}`).join('\n'):''}`)
  }

  // Promotions
  useEffect(() => {
    async function load() {
      if (!fromClassId) { setFromClassStudents([]); return }
      try {
        const res = await getClassDetails(fromClassId)
        setFromClassStudents(res.data.students || [])
        // default all to 'promote'
        const map = {}
        for (const s of (res.data.students || [])) map[s.id] = 'promote'
        setPromoteActions(map)
      } catch { setFromClassStudents([]) }
    }
    load()
  }, [fromClassId])

  function setActionFor(studId, val) { setPromoteActions(prev => ({ ...prev, [studId]: val })) }

  async function onApplyPromotion() {
    if (!fromClassId) return
    const items = fromClassStudents.map(s => ({ studentId: s.id, action: promoteActions[s.id] || 'promote' }))
    const payload = { toClassId: toClassId ? Number(toClassId) : null, items }
    await bulkPromote(fromClassId, payload)
    alert('Class update completed')
    fetchOverview()
  }

  if (error) return <div className="card text-red-600">{error}</div>
  if (!data) return <div className="card">Loading dashboard...</div>

  const role = getRole()

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {data.totalUsers !== undefined && (
          <div className="card">
            <div className="text-sm text-gray-500">Total Users</div>
            <div className="text-2xl font-bold">{data.totalUsers}</div>
          </div>
        )}
        {data.totalStudents !== undefined && (
          <div className="card">
            <div className="text-sm text-gray-500">Students</div>
            <div className="text-2xl font-bold">{data.totalStudents}</div>
          </div>
        )}
        {data.totalTeachers !== undefined && (
          <div className="card">
            <div className="text-sm text-gray-500">Teachers</div>
            <div className="text-2xl font-bold">{data.totalTeachers}</div>
          </div>
        )}
        {data.totalClasses !== undefined && (
          <div className="card">
            <div className="text-sm text-gray-500">Classes</div>
            <div className="text-2xl font-bold">{data.totalClasses}</div>
          </div>
        )}
      </div>

      {data.classDistribution && (
        <div className="card">
          <div className="font-semibold mb-2">Class Distribution</div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500">
                  <th className="p-2">Class</th>
                  <th className="p-2">Section</th>
                  <th className="p-2">Students</th>
                </tr>
              </thead>
              <tbody>
                {data.classDistribution.map((c, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="p-2">{c.name}</td>
                    <td className="p-2">{c.section}</td>
                    <td className="p-2">{c.student_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {data.weeklyAttendance && (
        <div className="card">
          <div className="font-semibold mb-2">Attendance (Last 7 days)</div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={[{name:'Total', val: Number(data.weeklyAttendance.total_records||0)}, {name:'Present', val: Number(data.weeklyAttendance.present_count||0)}]}>
              <defs>
                <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" />
              <YAxis />
              <CartesianGrid strokeDasharray="3 3" />
              <Tooltip />
              <Area type="monotone" dataKey="val" stroke="#2563eb" fillOpacity={1} fill="url(#colorVal)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {role === 'admin' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card">
            <div className="font-semibold mb-2">Quick Create: Academic Year</div>
            <form onSubmit={onCreateAcademicYear} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input className="input" placeholder="Year Name (e.g. 2025-26)" value={yearName} onChange={e=>setYearName(e.target.value)} required />
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isCurrent} onChange={e=>setIsCurrent(e.target.checked)} /> Set as current</label>
              <input className="input" type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} required />
              <input className="input" type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} required />
              <div className="md:col-span-2"><button className="btn btn-primary w-full">Create Year</button></div>
            </form>
          </div>

          <div className="card">
            <div className="font-semibold mb-2">Quick Create: Teacher</div>
            <form onSubmit={onCreateTeacher} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input className="input" placeholder="Name" value={tName} onChange={e=>setTName(e.target.value)} required />
              <input className="input" type="email" placeholder="Email" value={tEmail} onChange={e=>setTEmail(e.target.value)} required />
              <input className="input" type="password" placeholder="Password" value={tPassword} onChange={e=>setTPassword(e.target.value)} required />
              <input className="input" placeholder="Phone" value={tPhone} onChange={e=>setTPhone(e.target.value)} />
              <input className="input" placeholder="Employee ID (optional)" value={employeeId} onChange={e=>setEmployeeId(e.target.value)} />
              <div className="md:col-span-2"><button className="btn btn-primary w-full">Create Teacher</button></div>
            </form>
          </div>

          <div className="card">
            <div className="font-semibold mb-2">Quick Create: Student</div>
            <form onSubmit={onCreateStudent} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input className="input" placeholder="Name" value={sName} onChange={e=>setSName(e.target.value)} required />
              <input className="input" type="email" placeholder="Email" value={sEmail} onChange={e=>setSEmail(e.target.value)} required />
              <input className="input" type="password" placeholder="Password" value={sPassword} onChange={e=>setSPassword(e.target.value)} required />
              <input className="input" placeholder="Phone" value={sPhone} onChange={e=>setSPhone(e.target.value)} />
              <input className="input" placeholder="Student ID (e.g. STU-0001)" value={studentId} onChange={e=>setStudentId(e.target.value)} required />
              <select className="input" value={selectedClassId} onChange={e=>setSelectedClassId(e.target.value)} required>
                <option value="">Select Class</option>
                {classes?.data?.map?.(()=>null)}
                {(Array.isArray(classes) ? classes : classes?.data || []).map((c) => (
                  <option key={c.id} value={c.id}>{c.name} {c.section ? `(${c.section})` : ''}</option>
                ))}
              </select>
              <input className="input" type="number" placeholder="Roll Number" value={rollNumber} onChange={e=>setRollNumber(e.target.value)} />
              <input className="input" type="date" placeholder="Admission Date" value={admissionDate} onChange={e=>setAdmissionDate(e.target.value)} />
              <div className="md:col-span-2"><button className="btn btn-primary w-full">Create Student</button></div>
            </form>
          </div>

          <div className="card">
            <div className="font-semibold mb-2">Batch Add Students (per class)</div>
            <div className="text-xs text-gray-600 mb-2">Default password: <span className="font-mono">Welcome@123</span>. Student ID auto-generated (AAA99). Roll numbers auto-assigned alphabetically.</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <select className="input" value={selectedBatchClassId} onChange={e=>setSelectedBatchClassId(e.target.value)}>
                <option value="">Select Class</option>
                {(Array.isArray(classes) ? classes : classes?.data || []).map((c) => (
                  <option key={c.id} value={c.id}>{c.name} {c.section ? `(${c.section})` : ''}</option>
                ))}
              </select>
              <div className="md:col-span-2" />
              <input className="input" placeholder="Student Name" value={bsName} onChange={e=>setBsName(e.target.value)} />
              <input className="input" type="email" placeholder="Email" value={bsEmail} onChange={e=>setBsEmail(e.target.value)} />
              <input className="input" placeholder="Phone" value={bsPhone} onChange={e=>setBsPhone(e.target.value)} />
              <input className="input" type="number" placeholder="Roll Number (optional - auto-assigned)" value={bsRoll} onChange={e=>setBsRoll(e.target.value)} />
              <div className="md:col-span-3"><button type="button" onClick={onAddPendingStudent} className="btn btn-secondary w-full" disabled={!bsName || !bsEmail || !selectedBatchClassId}>Add to List</button></div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-gray-500">
                    <th className="p-2 text-left">Name</th>
                    <th className="p-2 text-left">Email</th>
                    <th className="p-2 text-left">Phone</th>
                    <th className="p-2 text-left">Roll</th>
                    <th className="p-2 text-left">Student ID (auto)</th>
                    <th className="p-2" />
                  </tr>
                </thead>
                <tbody>
                  {pendingStudents.map((s, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="p-2">{s.name}</td>
                      <td className="p-2">{s.email}</td>
                      <td className="p-2">{s.phone}</td>
                      <td className="p-2">{s.rollNumber}</td>
                      <td className="p-2">{s.studentId}</td>
                      <td className="p-2 text-right"><button className="btn btn-danger btn-sm" onClick={()=>onRemovePending(idx)}>Remove</button></td>
                    </tr>
                  ))}
                  {pendingStudents.length === 0 && (
                    <tr><td className="p-3 text-gray-500" colSpan={6}>No students in list</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex gap-3">
              <button className="btn btn-primary flex-1" disabled={!selectedBatchClassId || pendingStudents.length===0 || isCreatingBatch} onClick={onBatchCreateStudents}>
                {isCreatingBatch ? 'Creating...' : 'Create Students'}
              </button>
            </div>
          </div>

          <div className="card">
            <div className="font-semibold mb-2">Bulk Class Update (Promote / Stay / TC)</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <select className="input" value={fromClassId} onChange={e=>setFromClassId(e.target.value)}>
                <option value="">From Class</option>
                {(Array.isArray(classes) ? classes : classes?.data || []).map((c) => (
                  <option key={c.id} value={c.id}>{c.name} {c.section ? `(${c.section})` : ''}</option>
                ))}
              </select>
              <select className="input" value={toClassId} onChange={e=>setToClassId(e.target.value)}>
                <option value="">To Class (for Promote)</option>
                {(Array.isArray(classes) ? classes : classes?.data || []).map((c) => (
                  <option key={c.id} value={c.id}>{c.name} {c.section ? `(${c.section})` : ''}</option>
                ))}
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-gray-500">
                    <th className="p-2 text-left">Name</th>
                    <th className="p-2 text-left">Student ID</th>
                    <th className="p-2 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {fromClassStudents.map((s) => (
                    <tr key={s.id} className="border-t">
                      <td className="p-2">{s.name}</td>
                      <td className="p-2">{s.student_id}</td>
                      <td className="p-2">
                        <select className="input" value={promoteActions[s.id] || 'promote'} onChange={e=>setActionFor(s.id, e.target.value)}>
                          <option value="promote">Promote</option>
                          <option value="stay">Stay</option>
                          <option value="tc">TC</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                  {fromClassStudents.length === 0 && (
                    <tr><td className="p-3 text-gray-500" colSpan={3}>Select a "From Class" to load students</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-3">
              <button className="btn btn-primary w-full" disabled={!fromClassId} onClick={onApplyPromotion}>Apply Update</button>
            </div>
          </div>
        </div>
      )}

      {role === 'teacher' && (
        <div className="card">
          <div className="font-semibold mb-1">Quick Actions</div>
          <div className="text-sm text-gray-600">Use the sidebar to mark attendance or manage assignments.</div>
        </div>
      )}
    </div>
  )
}
