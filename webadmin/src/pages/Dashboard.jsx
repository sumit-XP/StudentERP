import { useEffect, useState } from 'react'
import api from '../services/api'
import { getRole } from '../services/auth'
import { registerUser, listUsers } from '../services/auth'
import { getClasses, getClassDetails, getStudents, createStudent, createAcademicYear, createClass, createTeacher, bulkPromote, batchCreateStudents } from '../services/academic'
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
  const [aName, setAName] = useState('')
  const [aEmail, setAEmail] = useState('')
  const [aPassword, setAPassword] = useState('')
  const [aPhone, setAPhone] = useState('')

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
    const l = () => letters[Math.floor(Math.random() * letters.length)]
    const d = () => digits[Math.floor(Math.random() * digits.length)]
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

  async function onCreateAdmin(e) {
    e.preventDefault()
    await registerUser({ email: aEmail, password: aPassword, name: aName, role: 'admin', phone: aPhone })
    setAName(''); setAEmail(''); setAPassword(''); setAPhone('')
    alert('School admin created')
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
      try { await createTeacher({ userId: tu.id, employeeId: empId }) } catch { }
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

    await createStudent({ userId: u.id, studentId, classId: Number(selectedClassId), admissionDate: admissionDate || new Date().toISOString().slice(0, 10), rollNumber: finalRollNumber })
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

    // Sort students alphabetically by name for consistent roll number assignment (handled by backend as well, but we can pre-assign roll numbers here if needed)
    const sortedStudents = [...pendingStudents].sort((a, b) => a.name.localeCompare(b.name))

    // Get current max roll number for the class
    let nextRollNumber = await getNextRollNumber(selectedBatchClassId)
    
    // Prepare payload
    const studentsPayload = sortedStudents.map(s => {
      const finalRollNumber = s.rollNumber ? Number(s.rollNumber) : nextRollNumber++
      return {
        email: s.email,
        password: DEFAULT_STUDENT_PASSWORD,
        name: s.name,
        phone: s.phone,
        studentId: s.studentId,
        admissionDate: new Date().toISOString().slice(0, 10),
        rollNumber: finalRollNumber
      }
    });

    try {
      const res = await batchCreateStudents({
        classId: Number(selectedBatchClassId),
        students: studentsPayload
      });
      
      const { success, fails } = res.data;
      setPendingStudents([])
      fetchOverview()
      alert(`Batch finished. Created: ${success}, Failed: ${fails.length}${fails.length ? '\n' + fails.map(f => `${f.email}: ${f.reason}`).join('\n') : ''}`)
    } catch (e) {
      alert('Batch creation failed: ' + (e?.response?.data?.error || e.message));
    } finally {
      setIsCreatingBatch(false)
    }
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
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Overview</h2>
        <p className="text-gray-600">Track your school's performance and manage operations</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {data.totalUsers !== undefined && (
          <div className="stat-card stat-card-blue group">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="text-white/80 text-sm font-medium mb-2">Total Users</div>
                <div className="text-4xl font-bold text-white mb-1">{data.totalUsers}</div>
                <div className="text-white/60 text-xs">Your school</div>
              </div>
              <div className="stat-icon group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>
        )}

        {data.totalStudents !== undefined && (
          <div className="stat-card stat-card-teal group">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="text-white/80 text-sm font-medium mb-2">Total Students</div>
                <div className="text-4xl font-bold text-white mb-1">{data.totalStudents}</div>
                <div className="text-white/60 text-xs">Currently enrolled</div>
              </div>
              <div className="stat-icon group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                </svg>
              </div>
            </div>
          </div>
        )}

        {data.totalTeachers !== undefined && (
          <div className="stat-card stat-card-purple group">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="text-white/80 text-sm font-medium mb-2">Teachers</div>
                <div className="text-4xl font-bold text-white mb-1">{data.totalTeachers}</div>
                <div className="text-white/60 text-xs">Teaching staff</div>
              </div>
              <div className="stat-icon group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>
        )}

        {data.totalClasses !== undefined && (
          <div className="stat-card stat-card-pink group">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="text-white/80 text-sm font-medium mb-2">Classes</div>
                <div className="text-4xl font-bold text-white mb-1">{data.totalClasses}</div>
                <div className="text-white/60 text-xs">Active classes</div>
              </div>
              <div className="stat-icon group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Class Distribution Table */}
      {data.classDistribution && (
        <div className="card">
          <div className="section-header">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>Class Distribution</span>
          </div>
          <div className="overflow-x-auto">
            <table className="table-modern">
              <thead>
                <tr>
                  <th>Class Name</th>
                  <th>Section</th>
                  <th>Students</th>
                </tr>
              </thead>
              <tbody>
                {data.classDistribution.map((c, idx) => (
                  <tr key={idx}>
                    <td className="font-semibold text-gray-900">{c.name}</td>
                    <td>
                      <span className="badge bg-blue-100 text-blue-700">{c.section}</span>
                    </td>
                    <td>
                      <span className="font-medium text-gray-900">{c.student_count}</span>
                      <span className="text-gray-500 text-xs ml-1">students</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Attendance Chart */}
      {data.weeklyAttendance && (
        <div className="card">
          <div className="section-header">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>Attendance Overview (Last Week)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
              <div className="text-sm font-semibold text-blue-900 mb-2">Total Records</div>
              <div className="text-3xl font-bold text-blue-600">{data.weeklyAttendance.total_records || 0}</div>
            </div>
            <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl p-6 border border-teal-100">
              <div className="text-sm font-semibold text-teal-900 mb-2">Present</div>
              <div className="text-3xl font-bold text-teal-600">{data.weeklyAttendance.present_count || 0}</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={[{ name: 'Total', val: Number(data.weeklyAttendance.total_records || 0) }, { name: 'Present', val: Number(data.weeklyAttendance.present_count || 0) }]}>
              <defs>
                <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.75rem',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Area type="monotone" dataKey="val" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {role === 'admin' && (
        <>
          <div className="card">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-gray-950">Create Academic Year</h2>
              <p className="text-sm text-gray-500">Set up an academic year before creating classes or students.</p>
            </div>
            <form className="grid gap-3 md:grid-cols-5" onSubmit={onCreateAcademicYear}>
              <input className="input" placeholder="e.g. 2024-2025" value={yearName} onChange={(e) => setYearName(e.target.value)} required />
              <input className="input" type="date" title="Start Date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
              <input className="input" type="date" title="End Date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isCurrent" checked={isCurrent} onChange={(e) => setIsCurrent(e.target.checked)} className="rounded border-gray-300" />
                <label htmlFor="isCurrent" className="text-sm font-medium text-gray-700">Set as Current</label>
              </div>
              <button className="btn btn-primary">Create Year</button>
            </form>
          </div>

          <div className="card mt-6">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-gray-950">Create Another School Admin</h2>
              <p className="text-sm text-gray-500">This admin will be linked to your current school ID and cannot access other schools.</p>
            </div>
            <form className="grid gap-3 md:grid-cols-5" onSubmit={onCreateAdmin}>
              <input className="input" placeholder="Full name" value={aName} onChange={(e) => setAName(e.target.value)} required />
              <input className="input" type="email" placeholder="Email" value={aEmail} onChange={(e) => setAEmail(e.target.value)} required />
              <input className="input" placeholder="Temporary password" value={aPassword} onChange={(e) => setAPassword(e.target.value)} required />
              <input className="input" placeholder="Phone" value={aPhone} onChange={(e) => setAPhone(e.target.value)} />
              <button className="btn btn-primary">Create Admin</button>
            </form>
          </div>
        </>
      )}


    </div>
  )
}
