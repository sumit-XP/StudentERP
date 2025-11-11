import { useEffect, useState } from 'react'
import api from '../services/api'

export default function Attendance() {
  const [classes, setClasses] = useState([])
  const [students, setStudents] = useState([])
  const [subjects, setSubjects] = useState([])
  const [classId, setClassId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0,10))
  const [statuses, setStatuses] = useState({})
  const [message, setMessage] = useState('')

  useEffect(() => {
    api.get('/academic/classes').then(r=>setClasses(r.data.classes))
    api.get('/academic/subjects').then(r=>setSubjects(r.data.subjects))
  }, [])

  useEffect(() => {
    if (!classId) return
    api.get(`/academic/students?classId=${classId}&limit=200`).then(r=> setStudents(r.data.students))
  }, [classId])

  const updateStatus = (sid, status) => setStatuses(prev => ({...prev, [sid]: status}))

  const submit = async () => {
    setMessage('')
    const attendanceData = students.map(s => ({
      studentId: s.id,
      classId: Number(classId),
      subjectId: subjectId ? Number(subjectId) : null,
      date,
      status: statuses[s.id] || 'present'
    }))
    try {
      await api.post('/attendance/mark', { attendanceData })
      setMessage('Attendance saved')
    } catch (err) {
      setMessage(err?.response?.data?.error || 'Failed to save')
    }
  }

  return (
    <div className="space-y-4">
      <div className="card grid md:grid-cols-4 gap-3">
        <div>
          <div className="label">Class</div>
          <select className="input" value={classId} onChange={e=>setClassId(e.target.value)}>
            <option value="">Select</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name} {c.section}</option>)}
          </select>
        </div>
        <div>
          <div className="label">Subject</div>
          <select className="input" value={subjectId} onChange={e=>setSubjectId(e.target.value)}>
            <option value="">(Optional)</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <div className="label">Date</div>
          <input type="date" className="input" value={date} onChange={e=>setDate(e.target.value)} />
        </div>
        <div className="flex items-end">
          <button className="btn btn-primary w-full" onClick={submit}>Save Attendance</button>
        </div>
      </div>

      <div className="card">
        <div className="font-semibold mb-2">Students</div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500">
                <th className="p-2">Roll</th>
                <th className="p-2">Name</th>
                <th className="p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map(st => (
                <tr key={st.id} className="border-t">
                  <td className="p-2">{st.roll_number || '-'}</td>
                  <td className="p-2">{st.name}</td>
                  <td className="p-2">
                    <select className="input" value={statuses[st.id] || 'present'} onChange={e=>updateStatus(st.id, e.target.value)}>
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                      <option value="late">Late</option>
                      <option value="excused">Excused</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {message && <div className="text-sm text-blue-700">{message}</div>}
    </div>
  )
}
