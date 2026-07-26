import { useEffect, useState } from 'react'
import api from '../services/api'
import { getUser } from '../services/auth'

export default function Attendance() {
  const user = getUser()
  const isTeacher = user?.role === 'teacher'
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'

  const [classes, setClasses] = useState([])
  const [students, setStudents] = useState([])
  const [classId, setClassId] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0,10))
  const [statuses, setStatuses] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [alreadyMarked, setAlreadyMarked] = useState(false)
  const [isNonWorkingDay, setIsNonWorkingDay] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    api.get('/academic/classes').then(r => {
      let clsList = r.data.classes || []
      if (isTeacher) {
        clsList = clsList.filter(c => c.class_teacher_id === user.id)
      }
      setClasses(clsList)
      if (clsList.length === 1) {
        setClassId(clsList[0].id)
      }
    })
  }, [isTeacher, user?.id])

  useEffect(() => {
    if (!classId) {
      setStudents([])
      return
    }
    
    // Load students
    api.get(`/academic/students?classId=${classId}&limit=200`).then(r => {
      const studs = r.data.students || []
      setStudents(studs)
      
      // Default to present
      const initialStatuses = {}
      studs.forEach(s => {
        initialStatuses[s.id] = 'present'
      })
      setStatuses(initialStatuses)
      
      // Check if attendance already marked
      checkAlreadyMarked(classId, date)
    })
  }, [classId, date])

  const checkAlreadyMarked = async (cid, d) => {
    setMessage('') // Clear message when checking a new date/class
    try {
      setAlreadyMarked(false)
      setIsNonWorkingDay(false)
      const res = await api.get(`/attendance/class?classId=${cid}&date=${d}`)
      
      if (res.data?.isNonWorkingDay) {
        setIsNonWorkingDay(true)
        setMessage('This date is marked as a non-working day for this class.')
      } else if (res.data?.attendance?.length > 0) {
        setAlreadyMarked(true)
        setMessage('Attendance has already been marked for this class on this date.')
        // Populate existing statuses
        const existing = {}
        res.data.attendance.forEach(a => {
          existing[a.student_id] = a.status
        })
        setStatuses(prev => ({ ...prev, ...existing }))
      } else {
        setMessage('')
      }
    } catch (e) {
      console.error(e)
    }
  }

  const toggleStatus = (sid) => {
    if (alreadyMarked || isAdmin) return
    setStatuses(prev => ({
      ...prev,
      [sid]: prev[sid] === 'present' ? 'absent' : 'present'
    }))
  }

  const submit = async () => {
    setMessage('')
    const attendanceData = students.map(s => ({
      studentId: s.id,
      classId: Number(classId),
      date,
      status: statuses[s.id] || 'present'
    }))
    
    if (attendanceData.length === 0) {
      setMessage('No students to mark attendance for.')
      return
    }

    setIsSubmitting(true)
    try {
      await api.post('/attendance/mark', { attendanceData })
      setMessage('Attendance saved successfully.')
      setAlreadyMarked(true)
    } catch (err) {
      const errMsg = err?.response?.data?.error || 'Failed to save attendance.'
      setMessage(errMsg)
      if (errMsg.toLowerCase().includes('already marked')) {
        setAlreadyMarked(true)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const markAsNonWorkingDay = async () => {
    if (!classId || !date) return
    setIsSubmitting(true)
    setMessage('')
    try {
      await api.post('/attendance/non-working-day', { classId, date })
      setMessage('Marked as non-working day successfully.')
      setIsNonWorkingDay(true)
      setAlreadyMarked(false) // If they marked it non-working, we clear regular attendance
    } catch (err) {
      setMessage(err?.response?.data?.error || 'Failed to mark as non-working day.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col gap-6 w-full pb-10">
      {isAdmin && (
        <div className="bg-orange-50 text-orange-800 p-4 rounded-lg text-sm border border-orange-200 shadow-sm flex items-center gap-2">
          <span className="material-symbols-outlined">info</span>
          <span><strong>Admin View:</strong> You can view attendance records but cannot submit new attendance.</span>
        </div>
      )}
      
      <section className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col sm:flex-row gap-6 flex-1 max-w-2xl">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-semibold text-on-surface-variant">Class</label>
              <div className="relative">
                <select className="w-full h-10 pl-4 pr-10 appearance-none bg-surface-container-lowest border border-outline-variant rounded-lg text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer transition-all" value={classId} onChange={e=>setClassId(e.target.value)}>
                  <option value="">Select Class</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name} {c.section}</option>)}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_more</span>
              </div>
              {isTeacher && classes.length === 0 && (
                <div className="text-xs text-error mt-1">You are not assigned as a class teacher.</div>
              )}
            </div>
            
            <div className="flex-1 space-y-2">
              <label className="text-sm font-semibold text-on-surface-variant">Date</label>
              <div className="relative">
                <input className="w-full h-10 pl-4 pr-10 bg-surface-container-lowest border border-outline-variant rounded-lg text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer transition-all" type="date" value={date} onChange={e=>setDate(e.target.value)} />
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-center gap-3 shrink-0">
            {(!isAdmin && classId && !isNonWorkingDay) && (
              <button onClick={markAsNonWorkingDay} disabled={isSubmitting} className="h-10 px-6 rounded-lg border border-outline-variant text-on-surface text-sm font-semibold hover:bg-surface-container-low transition-colors shadow-sm w-full md:w-auto">
                Not a Working Day
              </button>
            )}
            
            {message && (
              <div className={`px-4 py-2 rounded-md text-sm font-medium w-full text-center ${message.includes('successfully') ? 'bg-green-50 text-green-800' : 'bg-blue-50 text-blue-800'}`}>
                {message}
              </div>
            )}
          </div>
        </div>
      </section>

      {classId && (
        <section className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden shadow-sm flex flex-col flex-1">
          <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-bright">
            <h2 className="text-xl font-semibold text-on-surface">Students</h2>
            <span className="text-xs font-medium text-on-surface-variant">Uncheck box to mark absent</span>
          </div>
          
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-lowest">
                  <th className="py-4 px-6 text-sm font-semibold text-on-surface-variant w-24">Present</th>
                  <th className="py-4 px-6 text-sm font-semibold text-on-surface-variant w-32">Roll</th>
                  <th className="py-4 px-6 text-sm font-semibold text-on-surface-variant">Name</th>
                  <th className="py-4 px-6 text-sm font-semibold text-on-surface-variant w-48">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant">
                {students.length === 0 ? (
                  <tr><td colSpan="4" className="p-8 text-center text-on-surface-variant">No students found</td></tr>
                ) : students.map(st => (
                  <tr key={st.id} className="hover:bg-surface-container-low transition-colors duration-150 cursor-pointer" onClick={() => toggleStatus(st.id)}>
                    <td className="py-4 px-6">
                      <label className="flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="w-5 h-5 rounded border-outline-variant text-primary-container focus:ring-primary cursor-pointer"
                          checked={statuses[st.id] === 'present'}
                          onChange={() => {}} // handled by row click
                          disabled={alreadyMarked || isAdmin}
                        />
                      </label>
                    </td>
                    <td className="py-4 px-6 text-base text-on-surface">{st.roll_number || '-'}</td>
                    <td className="py-4 px-6 text-base text-on-surface font-medium">{st.name}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statuses[st.id] === 'present' ? 'bg-secondary-fixed text-on-secondary-fixed-variant' : 'bg-error-container text-on-error-container'}`}>
                        {statuses[st.id] === 'present' ? 'Present' : 'Absent'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-6 border-t border-outline-variant flex justify-end bg-surface-bright">
            {(!isAdmin && classId && !alreadyMarked && !isNonWorkingDay) ? (
              <button className="h-10 px-8 rounded-lg bg-primary-container text-on-primary-container text-sm font-semibold hover:bg-primary transition-colors shadow-sm disabled:opacity-50" onClick={submit} disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Attendance'}
              </button>
            ) : (
              <button className="h-10 px-8 rounded-lg bg-surface-variant text-on-surface-variant text-sm font-semibold cursor-not-allowed shadow-sm" disabled>
                {alreadyMarked ? 'Already Submitted' : isNonWorkingDay ? 'Non-Working Day' : 'Save Attendance'}
              </button>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
