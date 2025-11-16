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

      {role === 'teacher' && (
        <div className="card">
          <div className="font-semibold mb-1">Quick Actions</div>
          <div className="text-sm text-gray-600">Use the sidebar to mark attendance or manage assignments.</div>
        </div>
      )}
    </div>
  )
}
