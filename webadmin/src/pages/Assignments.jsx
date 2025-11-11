import { useEffect, useState } from 'react'
import api from '../services/api'
import FileUpload from '../components/FileUpload'

export default function Assignments() {
  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [list, setList] = useState([])
  const [title, setTitle] = useState('')
  const [classId, setClassId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/academic/classes').then(r=>setClasses(r.data.classes))
    api.get('/academic/subjects').then(r=>setSubjects(r.data.subjects))
    load()
  }, [])

  const load = () => {
    api.get('/assignments').then(r=>setList(r.data.assignments))
  }

  const onUploaded = (res) => setFileUrl(res.data.fileUrl)
  const uploadFn = (form) => api.post('/upload/assignment-file', form, { headers: { 'Content-Type': 'multipart/form-data' } })

  const create = async (e) => {
    e.preventDefault(); setError('')
    try {
      await api.post('/assignments', { title, classId: Number(classId), subjectId: Number(subjectId), dueDate, fileUrl })
      setTitle(''); setClassId(''); setSubjectId(''); setDueDate(''); setFileUrl('')
      load()
    } catch (err) { setError(err?.response?.data?.error || 'Failed to create') }
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="card md:col-span-2">
        <div className="font-semibold mb-2">Assignments</div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500">
                <th className="p-2">Title</th>
                <th className="p-2">Class</th>
                <th className="p-2">Subject</th>
                <th className="p-2">Due</th>
              </tr>
            </thead>
            <tbody>
              {list.map(a => (
                <tr key={a.id} className="border-t">
                  <td className="p-2">{a.title}</td>
                  <td className="p-2">{a.class_name} {a.section}</td>
                  <td className="p-2">{a.subject_name}</td>
                  <td className="p-2">{a.due_date ? new Date(a.due_date).toLocaleString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="card">
        <div className="font-semibold mb-2">Create Assignment</div>
        <form onSubmit={create} className="space-y-2">
          <div>
            <div className="label">Title</div>
            <input className="input" value={title} onChange={e=>setTitle(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="label">Class</div>
              <select className="input" value={classId} onChange={e=>setClassId(e.target.value)} required>
                <option value="">Select</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name} {c.section}</option>)}
              </select>
            </div>
            <div>
              <div className="label">Subject</div>
              <select className="input" value={subjectId} onChange={e=>setSubjectId(e.target.value)} required>
                <option value="">Select</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <div className="label">Due Date</div>
            <input className="input" type="datetime-local" value={dueDate} onChange={e=>setDueDate(e.target.value)} />
          </div>
          <FileUpload label="Assignment File" field="assignmentFile" onUploaded={onUploaded} uploadFn={uploadFn} />
          {fileUrl && <div className="text-xs text-teal-700 break-all">Uploaded: {fileUrl}</div>}
          {error && <div className="text-sm text-red-600">{error}</div>}
          <button className="btn btn-primary w-full">Create</button>
        </form>
      </div>
    </div>
  )
}
