import { useEffect, useState } from 'react'
import FileUpload from '../components/FileUpload'
import {
  getClasses,
  getStudents,
  getStudentGuardians,
  addStudentGuardian,
  deleteStudentGuardian,
  getStudentDocuments,
  addStudentDocument,
  deleteStudentDocument,
  getStudentPromotions,
  promoteStudent,
  uploadResourceFile,
} from '../services/academic'

export default function Students() {
  const [classes, setClasses] = useState([])
  const [students, setStudents] = useState([])
  const [query, setQuery] = useState({ classId: '', search: '' })
  const [selected, setSelected] = useState(null)
  const [guardians, setGuardians] = useState([])
  const [documents, setDocuments] = useState([])
  const [promotions, setPromotions] = useState([])

  const [newGuardian, setNewGuardian] = useState({ name: '', relation: '', phone: '', email: '', isPrimary: false })
  const [promoForm, setPromoForm] = useState({ action: 'promoted', toClassId: '', effectiveDate: '', remarks: '' })

  useEffect(() => {
    getClasses().then(r=>setClasses(r.data.classes || []))
    loadStudents()
  }, [])

  const loadStudents = async () => {
    const res = await getStudents({ classId: query.classId || undefined, search: query.search || undefined })
    setStudents(res.data.students || [])
  }

  const onSearch = async (e) => { e.preventDefault(); await loadStudents() }

  const onSelect = async (s) => {
    setSelected(s)
    const [g, d, p] = await Promise.all([
      getStudentGuardians(s.id),
      getStudentDocuments(s.id),
      getStudentPromotions(s.id),
    ])
    setGuardians(g.data.guardians || [])
    setDocuments(d.data.documents || [])
    setPromotions(p.data.promotions || [])
  }

  const addGuardian = async (e) => {
    e.preventDefault()
    if (!selected) return
    await addStudentGuardian(selected.id, newGuardian)
    setNewGuardian({ name: '', relation: '', phone: '', email: '', isPrimary: false })
    const g = await getStudentGuardians(selected.id)
    setGuardians(g.data.guardians || [])
  }

  const removeGuardian = async (gid) => {
    if (!selected) return
    await deleteStudentGuardian(selected.id, gid)
    setGuardians((await getStudentGuardians(selected.id)).data.guardians || [])
  }

  const uploadFn = (form) => uploadResourceFile(form)
  const onDocUploaded = async (res) => {
    if (!selected) return
    const fileUrl = res.data.fileUrl
    await addStudentDocument(selected.id, { fileUrl, docType: 'other' })
    setDocuments((await getStudentDocuments(selected.id)).data.documents || [])
  }

  const removeDocument = async (docId) => {
    if (!selected) return
    await deleteStudentDocument(selected.id, docId)
    setDocuments((await getStudentDocuments(selected.id)).data.documents || [])
  }

  const submitPromotion = async (e) => {
    e.preventDefault()
    if (!selected) return
    await promoteStudent(selected.id, {
      action: promoForm.action,
      toClassId: Number(promoForm.toClassId),
      effectiveDate: promoForm.effectiveDate || null,
      remarks: promoForm.remarks || null,
    })
    setPromotions((await getStudentPromotions(selected.id)).data.promotions || [])
    setPromoForm({ action: 'promoted', toClassId: '', effectiveDate: '', remarks: '' })
    await loadStudents()
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="card md:col-span-2">
        <div className="flex items-end gap-3 mb-3">
          <div className="flex-1">
            <div className="label">Class</div>
            <select className="input" value={query.classId} onChange={e=>setQuery(s=>({...s,classId:e.target.value}))}>
              <option value="">All</option>
              {classes.map(c=> <option key={c.id} value={c.id}>{c.name} {c.section}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <div className="label">Search</div>
            <input className="input" placeholder="Name or Student ID" value={query.search} onChange={e=>setQuery(s=>({...s,search:e.target.value}))} />
          </div>
          <button className="btn btn-primary" onClick={onSearch}>Search</button>
        </div>
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500"><th className="p-2">Student</th><th className="p-2">Student ID</th><th className="p-2">Class</th><th className="p-2">Roll</th><th className="p-2">Actions</th></tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s.id} className={`border-t ${selected?.id===s.id?'bg-blue-50':''}`}>
                  <td className="p-2">{s.name}</td>
                  <td className="p-2">{s.student_id}</td>
                  <td className="p-2">{s.class_name} {s.section}</td>
                  <td className="p-2">{s.roll_number || '-'}</td>
                  <td className="p-2">
                    <button className="btn btn-outline" onClick={()=>onSelect(s)}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        {!selected ? (
          <div className="text-sm text-gray-500">Select a student to view details</div>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="font-semibold">Profile</div>
              <div className="text-sm">{selected.name} • {selected.student_id}</div>
              <div className="text-xs text-gray-500">Class: {selected.class_name} {selected.section} • Roll: {selected.roll_number || '-'}</div>
            </div>

            <div>
              <div className="font-semibold mb-2">Guardians</div>
              <ul className="text-sm list-disc ml-5 mb-2">
                {guardians.map(g => (
                  <li key={g.id} className="flex items-center gap-2">
                    <span>{g.name} ({g.relation || 'N/A'}) {g.phone ? '• '+g.phone : ''} {g.is_primary ? '• Primary' : ''}</span>
                    <button className="btn btn-xs btn-outline" onClick={()=>removeGuardian(g.id)}>Remove</button>
                  </li>
                ))}
              </ul>
              <form className="grid grid-cols-1 md:grid-cols-5 gap-2" onSubmit={addGuardian}>
                <input className="input" placeholder="Name" value={newGuardian.name} onChange={e=>setNewGuardian(s=>({...s,name:e.target.value}))} required />
                <input className="input" placeholder="Relation" value={newGuardian.relation} onChange={e=>setNewGuardian(s=>({...s,relation:e.target.value}))} />
                <input className="input" placeholder="Phone" value={newGuardian.phone} onChange={e=>setNewGuardian(s=>({...s,phone:e.target.value}))} />
                <input className="input" placeholder="Email" value={newGuardian.email} onChange={e=>setNewGuardian(s=>({...s,email:e.target.value}))} />
                <div className="flex items-center gap-2">
                  <label className="text-sm"><input type="checkbox" className="mr-1" checked={newGuardian.isPrimary} onChange={e=>setNewGuardian(s=>({...s,isPrimary:e.target.checked}))} />Primary</label>
                </div>
                <button className="btn btn-secondary md:col-span-5">Add Guardian</button>
              </form>
            </div>

            <div>
              <div className="font-semibold mb-2">Documents</div>
              <ul className="text-sm list-disc ml-5 mb-2">
                {documents.map(d => (
                  <li key={d.id} className="flex items-center gap-2">
                    <a className="text-blue-600 underline" href={d.file_url} target="_blank" rel="noreferrer">{d.doc_type || 'document'} ({new Date(d.uploaded_at).toLocaleString()})</a>
                    <button className="btn btn-xs btn-outline" onClick={()=>removeDocument(d.id)}>Delete</button>
                  </li>
                ))}
              </ul>
              <FileUpload label="Add Document" field="resourceFile" onUploaded={onDocUploaded} uploadFn={uploadFn} />
            </div>

            <div>
              <div className="font-semibold mb-2">Promotion/Demotion</div>
              <form className="grid grid-cols-1 md:grid-cols-5 gap-2" onSubmit={submitPromotion}>
                <select className="input" value={promoForm.action} onChange={e=>setPromoForm(s=>({...s,action:e.target.value}))}>
                  <option value="promoted">Promote</option>
                  <option value="demoted">Demote</option>
                </select>
                <select className="input" value={promoForm.toClassId} onChange={e=>setPromoForm(s=>({...s,toClassId:e.target.value}))} required>
                  <option value="">To Class</option>
                  {classes.map(c=> <option key={c.id} value={c.id}>{c.name} {c.section}</option>)}
                </select>
                <input type="date" className="input" value={promoForm.effectiveDate} onChange={e=>setPromoForm(s=>({...s,effectiveDate:e.target.value}))} />
                <input className="input" placeholder="Remarks" value={promoForm.remarks} onChange={e=>setPromoForm(s=>({...s,remarks:e.target.value}))} />
                <button className="btn btn-primary">Apply</button>
              </form>
              <div className="mt-2">
                <div className="text-sm font-medium">History</div>
                <ul className="text-sm list-disc ml-5">
                  {promotions.map(p => (
                    <li key={p.id}>{p.action} • {p.from_class_name || '-'} → {p.to_class_name || '-'} • {new Date(p.effective_date).toLocaleDateString()}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
