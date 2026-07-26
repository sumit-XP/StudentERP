import { useEffect, useState } from 'react'
import api from '../services/api'
import FileUpload from '../components/FileUpload'

export default function Assignments() {
  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [list, setList] = useState([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
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
      await api.post('/assignments', { title, description, classId: Number(classId), subjectId: Number(subjectId), dueDate, fileUrl })
      setTitle(''); setDescription(''); setClassId(''); setSubjectId(''); setDueDate(''); setFileUrl('')
      load()
    } catch (err) { setError(err?.response?.data?.error || 'Failed to create') }
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-on-surface tracking-tight">Assignments Management</h2>
      </div>

      <div className="flex flex-col gap-6">
        {/* Create Assignment Form */}
        <div className="w-full">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-xl font-semibold text-on-surface mb-4 border-b border-outline-variant pb-4">Create Assignment</h3>
            <form onSubmit={create} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1 md:col-span-2">
                  <label className="text-sm font-semibold text-on-surface">Title</label>
                  <input className="w-full h-10 px-3 bg-surface border border-outline-variant rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="Enter assignment title" value={title} onChange={e=>setTitle(e.target.value)} required />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-on-surface">Class</label>
                  <div className="relative">
                    <select className="w-full h-10 pl-3 pr-8 bg-surface border border-outline-variant rounded-lg text-sm appearance-none focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" value={classId} onChange={e=>setClassId(e.target.value)} required>
                      <option value="" disabled>Select</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name} {c.section}</option>)}
                    </select>
                    <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-on-surface">Subject</label>
                  <div className="relative">
                    <select className="w-full h-10 pl-3 pr-8 bg-surface border border-outline-variant rounded-lg text-sm appearance-none focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" value={subjectId} onChange={e=>setSubjectId(e.target.value)} required>
                      <option value="" disabled>Select</option>
                      {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-on-surface">Due Date</label>
                  <div className="relative">
                    <input className="w-full h-10 px-3 pr-10 bg-surface border border-outline-variant rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-on-surface-variant" type="datetime-local" value={dueDate} onChange={e=>setDueDate(e.target.value)} required />
                  </div>
                </div>
                <div className="flex flex-col gap-1 md:col-span-2">
                  <label className="text-sm font-semibold text-on-surface">Instructions / Description</label>
                  <textarea 
                    className="w-full p-3 bg-surface border border-outline-variant rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all min-h-[100px]" 
                    placeholder="Enter assignment instructions or text..." 
                    value={description} 
                    onChange={e=>setDescription(e.target.value)} 
                  />
                </div>
                <div className="flex flex-col gap-1 md:col-span-2">
                  <label className="text-sm font-semibold text-on-surface">Assignment File (Optional)</label>
                  <div className="w-full">
                    <FileUpload label="" field="assignmentFile" onUploaded={onUploaded} uploadFn={uploadFn} />
                  </div>
                </div>
              </div>
              
              {fileUrl && <div className="text-xs text-teal-700 break-all bg-teal-50 p-2 rounded-md mt-2">Uploaded: {fileUrl}</div>}
              {error && <div className="text-sm text-error bg-error-container p-2 rounded-md mt-2">{error}</div>}
              
              <div className="pt-6 mt-2 border-t border-outline-variant flex justify-end">
                <button type="submit" className="w-full md:w-auto px-8 bg-primary-container hover:bg-primary text-on-primary-container hover:text-white h-10 rounded-lg text-sm font-semibold transition-colors shadow-sm flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">add_task</span>
                  Create Assignment
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Existing Assignments List */}
        <div className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-on-surface">Existing Assignments</h3>
            <div className="flex gap-2">
              <button className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors border border-outline-variant">
                <span className="material-symbols-outlined text-[20px]">filter_list</span>
              </button>
              <button className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors border border-outline-variant">
                <span className="material-symbols-outlined text-[20px]">sort</span>
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto rounded-lg border border-outline-variant">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low text-on-surface-variant">
                  <th className="py-3 px-4 text-sm font-semibold">Title</th>
                  <th className="py-3 px-4 text-sm font-semibold">Class</th>
                  <th className="py-3 px-4 text-sm font-semibold">Subject</th>
                  <th className="py-3 px-4 text-sm font-semibold">Due Date</th>
                  <th className="py-3 px-4 text-sm font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center">
                      <div className="flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-surface-container-low rounded-full flex items-center justify-center mb-4">
                          <span className="material-symbols-outlined text-outline text-[32px]">assignment</span>
                        </div>
                        <h4 className="text-lg font-semibold text-on-surface mb-2">No assignments yet</h4>
                        <p className="text-sm text-on-surface-variant">Create a new assignment to get started.</p>
                      </div>
                    </td>
                  </tr>
                ) : list.map(a => (
                  <tr key={a.id} className="border-b border-surface-variant hover:bg-surface-container-low transition-colors group">
                    <td className="py-4 px-4 text-base font-medium text-on-surface">{a.title}</td>
                    <td className="py-4 px-4 text-sm text-on-surface-variant">{a.class_name} {a.section}</td>
                    <td className="py-4 px-4 text-sm text-on-surface-variant">{a.subject_name}</td>
                    <td className="py-4 px-4 text-sm text-on-surface-variant">
                      <span className="bg-surface-variant px-2 py-1 rounded-md text-xs">{a.due_date ? new Date(a.due_date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '-'}</span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button className="text-primary hover:text-on-primary-fixed-variant opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
