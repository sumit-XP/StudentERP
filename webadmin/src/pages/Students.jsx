import { useEffect, useMemo, useState } from 'react'
import FileUpload from '../components/FileUpload'
import CSVUpload from '../components/CSVUpload'
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
  createStudent,
} from '../services/academic'
import { registerUser, listUsers, getRole } from '../services/auth'

const TAB_CONFIGS = [
  { key: 'view', label: 'View Students' },
  { key: 'create', label: 'Create Student', adminOnly: true },
  { key: 'bulk', label: 'Bulk Import', adminOnly: true },
  { key: 'promote', label: 'Promote Student', adminOnly: true },
]

const REQUIRED_FIELD_ERRORS = {
  name: 'Full name is required.',
  dateOfBirth: 'Date of birth is required.',
  studentId: 'Student ID is required.',
  email: 'Email is required.',
  phone: 'Phone number is required.',
  classId: 'Class selection is required.',
}

const getInitialTouchedFields = () => ({
  name: false,
  dateOfBirth: false,
  studentId: false,
  email: false,
  phone: false,
  classId: false,
})

export default function Students() {
  const [classes, setClasses] = useState([])
  const [students, setStudents] = useState([])
  const [query, setQuery] = useState({ classId: '', search: '' })
  const [selected, setSelected] = useState(null)
  const [guardians, setGuardians] = useState([])
  const [documents, setDocuments] = useState([])
  const [promotions, setPromotions] = useState([])

  const [docType, setDocType] = useState('birth_cert')

  const DEFAULT_STUDENT_PASSWORD = 'Welcome@123'
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: DEFAULT_STUDENT_PASSWORD,
    phone: '',
    address: '',
    dateOfBirth: '',
    studentId: '',
    classId: '',
    admissionDate: '',
    guardianName: '',
    guardianRelation: '',
    guardianPhone: '',
    guardianEmail: '',
    studentPhoto: null,
    studentIdProof: null,
    guardianPhoto: null,
    guardianIdProof: null,
  })
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState('')
  const [createSuccess, setCreateSuccess] = useState('')
  const [uploadingFiles, setUploadingFiles] = useState(false)

  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkError, setBulkError] = useState('')
  const [bulkSuccess, setBulkSuccess] = useState('')

  const role = useMemo(() => getRole(), [])
  const availableTabs = useMemo(
    () => TAB_CONFIGS.filter((tab) => !tab.adminOnly || role === 'admin'),
    [role]
  )
  const [currentTab, setCurrentTab] = useState(availableTabs[0]?.key || 'view')
  const [touchedFields, setTouchedFields] = useState(getInitialTouchedFields())

  useEffect(() => {
    if (!availableTabs.find((tab) => tab.key === currentTab)) {
      setCurrentTab(availableTabs[0]?.key || 'view')
    }
  }, [availableTabs, currentTab])

  const handleFieldBlur = (field) => {
    setTouchedFields((prev) => ({ ...prev, [field]: true }))
  }

  const markAllRequiredTouched = () => {
    setTouchedFields((prev) => {
      const updated = { ...prev }
      Object.keys(REQUIRED_FIELD_ERRORS).forEach((field) => {
        updated[field] = true
      })
      return updated
    })
  }

  const renderFieldError = (field) => (
    touchedFields[field] && !createForm[field] ? (
      <div className="text-[11px] text-red-600">{REQUIRED_FIELD_ERRORS[field]}</div>
    ) : null
  )

  const renderStudentList = () => (
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
        <button type="button" className="btn btn-primary" onClick={onSearch}>Search</button>
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
  )

  const renderPreviewPanel = () => (
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

          {/* Documents Section (Temporarily Redundant)
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
            <div className="mb-2">
              <div className="label">Document Type</div>
              <select className="input" value={docType} onChange={e => setDocType(e.target.value)}>
                <option value="birth_cert">Birth Certificate</option>
                <option value="id_proof">ID Proof</option>
                <option value="photo">Photo</option>
                <option value="other">Other</option>
              </select>
            </div>
            <FileUpload label="Add Document" field="resourceFile" onUploaded={onDocUploaded} uploadFn={uploadFn} />
          </div>
          */}

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
  )

  const [newGuardian, setNewGuardian] = useState({ name: '', relation: '', phone: '', email: '', isPrimary: false })
  const [promoForm, setPromoForm] = useState({ action: 'promoted', toClassId: '', effectiveDate: '', remarks: '' })

  useEffect(() => {
    getClasses().then(r=>setClasses(r.data.classes || []))
    loadStudents()
    generateStudentId()
  }, [])

  // Auto-generate student ID when name, guardian name, or birth date changes
  useEffect(() => {
    const { name, guardianName, dateOfBirth } = createForm
    if (name && guardianName && dateOfBirth) {
      const birthYear = new Date(dateOfBirth).getFullYear().toString()
      generateStudentId(name, guardianName, birthYear)
    } else {
      generateStudentId()
    }
  }, [createForm.name, createForm.guardianName, createForm.dateOfBirth])

  const generateStudentId = (studentName = '', guardianName = '', birthYear = '') => {
    if (!studentName || !guardianName || !birthYear) {
      // If we don't have all required info, generate a placeholder
      setCreateForm(prev => ({ ...prev, studentId: 'Will be generated automatically' }))
      return
    }
    
    const namePrefix = studentName.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase()
    const fatherPrefix = guardianName.replace(/[^a-zA-Z]/g, '').substring(0, 2).toUpperCase()
    const year = birthYear
    
    const studentId = `${namePrefix}${fatherPrefix}${year}`
    setCreateForm(prev => ({ ...prev, studentId }))
  }

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
    await addStudentDocument(selected.id, { fileUrl, docType })
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

  const onCreateStudent = async (e) => {
    e.preventDefault()
    setCreateError('')
    setCreateSuccess('')
    setCreateLoading(true)
    try {
      const { name, email, password, phone, address, dateOfBirth, studentId, classId, admissionDate, guardianName, guardianRelation, guardianPhone, guardianEmail, studentPhoto, studentIdProof, guardianPhoto, guardianIdProof } = createForm

      if (!name || !email || !studentId || !classId || !dateOfBirth || !phone) {
        setCreateError('Name, Date of Birth, Email, Phone, Student ID and Class are required')
        markAllRequiredTouched()
        setCreateLoading(false)
        return
      }

      setUploadingFiles(true)
      let studentPhotoUrl = null
      let studentIdProofUrl = null
      let guardianPhotoUrl = null
      let guardianIdProofUrl = null

      try {
        if (studentPhoto) {
          const formData = new FormData()
          formData.append('resourceFile', studentPhoto)
          const res = await uploadResourceFile(formData)
          studentPhotoUrl = res.data.fileUrl
        }
        if (studentIdProof) {
          const formData = new FormData()
          formData.append('resourceFile', studentIdProof)
          const res = await uploadResourceFile(formData)
          studentIdProofUrl = res.data.fileUrl
        }
        if (guardianPhoto) {
          const formData = new FormData()
          formData.append('resourceFile', guardianPhoto)
          const res = await uploadResourceFile(formData)
          guardianPhotoUrl = res.data.fileUrl
        }
        if (guardianIdProof) {
          const formData = new FormData()
          formData.append('resourceFile', guardianIdProof)
          const res = await uploadResourceFile(formData)
          guardianIdProofUrl = res.data.fileUrl
        }
      } catch (uploadErr) {
        setCreateError('Failed to upload files: ' + (uploadErr?.response?.data?.error || uploadErr.message))
        setUploadingFiles(false)
        setCreateLoading(false)
        return
      }
      setUploadingFiles(false)

      const finalPassword = password || DEFAULT_STUDENT_PASSWORD

      try {
        await registerUser({
          email,
          password: finalPassword,
          name,
          role: 'student',
          phone: phone || undefined,
          address: address || undefined,
          dateOfBirth: dateOfBirth || undefined,
        })
      } catch (_) {
        // ignore duplicate; we'll still try to find the user
      }

      const usersRes = await listUsers({ role: 'student', search: email })
      const u = (usersRes.data.users || []).find((usr) => usr.email === email)
      if (!u) {
        setCreateError('Student user created, but user id not found. Please check Users list.')
        setCreateLoading(false)
        return
      }

      const studentsInClass = await getStudents({ classId: Number(classId) })
      const existingRolls = (studentsInClass.data.students || []).map(s => s.roll_number).filter(r => r != null)
      const nextRoll = existingRolls.length > 0 ? Math.max(...existingRolls) + 1 : 1

      const createRes = await createStudent({
        userId: u.id,
        studentId,
        classId: Number(classId),
        admissionDate: admissionDate || new Date().toISOString().slice(0, 10),
        rollNumber: nextRoll,
        parentId: null,
        emergencyContact: phone || null,
        bloodGroup: null,
      })

      const createdStudent = createRes?.data?.student || createRes?.data || null
      const studentDbId = createdStudent?.id

      if (studentDbId) {
        if (studentPhotoUrl) {
          await addStudentDocument(studentDbId, { fileUrl: studentPhotoUrl, docType: 'photo' })
        }
        if (studentIdProofUrl) {
          await addStudentDocument(studentDbId, { fileUrl: studentIdProofUrl, docType: 'id_proof' })
        }

        if (guardianName || guardianPhone || guardianEmail) {
          await addStudentGuardian(studentDbId, {
            name: guardianName || 'Guardian',
            relation: guardianRelation || null,
            phone: guardianPhone || null,
            email: guardianEmail || null,
            isPrimary: true,
          })
        }
      }

      setCreateForm({
        name: '',
        email: '',
        password: DEFAULT_STUDENT_PASSWORD,
        phone: '',
        address: '',
        dateOfBirth: '',
        studentId: '',
        classId: '',
        admissionDate: '',
        guardianName: '',
        guardianRelation: '',
        guardianPhone: '',
        guardianEmail: '',
        studentPhoto: null,
        studentIdProof: null,
        guardianPhoto: null,
        guardianIdProof: null,
      })
      generateStudentId()
      setTouchedFields(getInitialTouchedFields())
      setCreateSuccess('Student created successfully. You can now add guardians and upload documents from the list below.')
      await loadStudents()
    } catch (err) {
      setCreateError(err?.response?.data?.error || err.message || 'Failed to create student')
    } finally {
      setCreateLoading(false)
    }
  }

  const parseCSV = (csvText) => {
    const lines = csvText.split('\n').filter(line => line.trim())
    if (lines.length < 2) throw new Error('CSV must have at least a header row and one data row')
    
    const headers = lines[0].split(',').map(h => h.trim())
    const rows = []
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      if (values.length !== headers.length) continue
      
      const row = {}
      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })
      rows.push(row)
    }
    
    return rows
  }

  const onCSVUpload = async (file) => {
    setBulkLoading(true)
    setBulkError('')
    setBulkSuccess('')
    
    try {
      const csvText = await file.text()
      const students = parseCSV(csvText)
      
      if (students.length === 0) {
        throw new Error('No valid student records found in CSV')
      }

      let successCount = 0
      let errorCount = 0
      const errors = []

      for (const [index, student] of students.entries()) {
        try {
          const { name, email, phone, address, dateOfBirth, classId, guardianName, guardianRelation, guardianPhone, guardianEmail } = student
          
          if (!name || !email || !phone || !classId) {
            throw new Error(`Row ${index + 2}: Missing required fields (name, email, phone, classId)`)
          }

          const namePrefix = name.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase()
          const fatherPrefix = (guardianName || 'XXX').replace(/[^a-zA-Z]/g, '').substring(0, 2).toUpperCase()
          const birthYear = dateOfBirth ? new Date(dateOfBirth).getFullYear().toString() : new Date().getFullYear().toString()
          const studentId = `${namePrefix}${fatherPrefix}${birthYear}`

          try {
            await registerUser({
              email,
              password: DEFAULT_STUDENT_PASSWORD,
              name,
              role: 'student',
              phone: phone || undefined,
              address: address || undefined,
              dateOfBirth: dateOfBirth || undefined,
            })
          } catch (_) {
            // ignore duplicate; we'll still try to find the user
          }

          const usersRes = await listUsers({ role: 'student', search: email })
          const u = (usersRes.data.users || []).find((usr) => usr.email === email)
          if (!u) {
            throw new Error(`User creation failed for ${email}`)
          }

          const studentsInClass = await getStudents({ classId: Number(classId) })
          const existingRolls = (studentsInClass.data.students || []).map(s => s.roll_number).filter(r => r != null)
          const nextRoll = existingRolls.length > 0 ? Math.max(...existingRolls) + 1 : 1

          const createRes = await createStudent({
            userId: u.id,
            studentId,
            classId: Number(classId),
            admissionDate: new Date().toISOString().slice(0, 10),
            rollNumber: nextRoll,
            parentId: null,
            emergencyContact: phone || null,
            bloodGroup: null,
          })

          const createdStudent = createRes?.data?.student || createRes?.data || null
          const studentDbId = createdStudent?.id

          if (studentDbId && (guardianName || guardianPhone || guardianEmail)) {
            await addStudentGuardian(studentDbId, {
              name: guardianName || 'Guardian',
              relation: guardianRelation || null,
              phone: guardianPhone || null,
              email: guardianEmail || null,
              isPrimary: true,
            })
          }

          successCount++
        } catch (err) {
          errorCount++
          errors.push(`Row ${index + 2}: ${err.message}`)
        }
      }

      if (successCount > 0) {
        setBulkSuccess(`Successfully imported ${successCount} students. ${errorCount > 0 ? `${errorCount} failed.` : ''}`)
        await loadStudents()
      }
      
      if (errors.length > 0) {
        setBulkError(`Import completed with errors:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? `\n...and ${errors.length - 5} more errors` : ''}`)
      }
    } catch (err) {
      setBulkError(err.message || 'Failed to process CSV file')
    } finally {
      setBulkLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex flex-wrap gap-2">
          {availableTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`btn ${currentTab === tab.key ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setCurrentTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {currentTab === 'create' && (
        <div className="card">
          <div className="font-semibold mb-2">Create Student</div>
          <div className="text-xs text-gray-500 mb-3">
            Enter core student details here. After creation, you can manage multiple parent/guardian contacts and upload birth certificates, ID proofs, and photos from the student details panel below.
          </div>
          {createError && <div className="text-sm text-red-600 mb-2">{createError}</div>}
          {createSuccess && <div className="text-sm text-green-600 mb-2">{createSuccess}</div>}
          <form onSubmit={onCreateStudent} className="space-y-6">
            {/* Student Details Section */}
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-200">👤 Student Details</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <input
                    className="input"
                    placeholder="Full Name *"
                    value={createForm.name}
                    onChange={e => setCreateForm(s => ({ ...s, name: e.target.value }))}
                    onBlur={() => handleFieldBlur('name')}
                    required
                  />
                  {renderFieldError('name')}
                </div>
                <div className="space-y-1">
                  <input
                    className="input"
                    type="date"
                    placeholder="Date of Birth *"
                    value={createForm.dateOfBirth}
                    onChange={e => setCreateForm(s => ({ ...s, dateOfBirth: e.target.value }))}
                    onBlur={() => handleFieldBlur('dateOfBirth')}
                    required
                  />
                  {renderFieldError('dateOfBirth')}
                </div>
                <div className="space-y-1">
                  <input
                    className="input bg-gray-100"
                    placeholder="Student ID (auto-generated) *"
                    value={createForm.studentId}
                    readOnly
                    required
                  />
                  <div className="text-[10px] text-gray-500">Format: Name + Father + Year</div>
                </div>
                <div className="space-y-1">
                  <input
                    className="input"
                    type="email"
                    placeholder="Email *"
                    value={createForm.email}
                    onChange={e => setCreateForm(s => ({ ...s, email: e.target.value }))}
                    onBlur={() => handleFieldBlur('email')}
                    required
                  />
                  {renderFieldError('email')}
                </div>
                <div className="space-y-1">
                  <input
                    className="input"
                    type="tel"
                    placeholder="Phone *"
                    value={createForm.phone}
                    onChange={e => setCreateForm(s => ({ ...s, phone: e.target.value }))}
                    onBlur={() => handleFieldBlur('phone')}
                    required
                  />
                  {renderFieldError('phone')}
                </div>
                <div className="space-y-1">
                  <input
                    className="input"
                    placeholder="Address"
                    value={createForm.address}
                    onChange={e => setCreateForm(s => ({ ...s, address: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Parent Details Section */}
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-200">👨‍👩‍👧‍👦 Parent/Guardian Details</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <input
                    className="input"
                    placeholder="Guardian Name (Father/Mother)"
                    value={createForm.guardianName}
                    onChange={e => setCreateForm(s => ({ ...s, guardianName: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <select
                    className="input"
                    value={createForm.guardianRelation}
                    onChange={e => setCreateForm(s => ({ ...s, guardianRelation: e.target.value }))}
                  >
                    <option value="">Select Relation</option>
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <input
                    className="input"
                    type="tel"
                    placeholder="Guardian Phone"
                    value={createForm.guardianPhone}
                    onChange={e => setCreateForm(s => ({ ...s, guardianPhone: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <input
                    className="input"
                    type="email"
                    placeholder="Guardian Email"
                    value={createForm.guardianEmail}
                    onChange={e => setCreateForm(s => ({ ...s, guardianEmail: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Academic Details Section */}
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-200">🎓 Academic Details</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <select
                    className="input"
                    value={createForm.classId}
                    onChange={e => setCreateForm(s => ({ ...s, classId: e.target.value }))}
                    onBlur={() => handleFieldBlur('classId')}
                    required
                  >
                    <option value="">Select Class *</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name} {c.section}</option>
                    ))}
                  </select>
                  {renderFieldError('classId')}
                </div>
                <div className="space-y-1">
                  <input
                    className="input"
                    type="date"
                    placeholder="Admission Date (optional)"
                    value={createForm.admissionDate}
                    onChange={e => setCreateForm(s => ({ ...s, admissionDate: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Documents Section (Temporarily Redundant)
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-200">📄 Document Uploads (Optional)</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="label">Student Photo</div>
                  <input
                    type="file"
                    accept="image/*"
                    className="input"
                    onChange={e => setCreateForm(s => ({ ...s, studentPhoto: e.target.files[0] }))}
                  />
                </div>
                <div className="space-y-1">
                  <div className="label">Student ID Proof</div>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="input"
                    onChange={e => setCreateForm(s => ({ ...s, studentIdProof: e.target.files[0] }))}
                  />
                </div>
                <div className="space-y-1">
                  <div className="label">Guardian Photo</div>
                  <input
                    type="file"
                    accept="image/*"
                    className="input"
                    onChange={e => setCreateForm(s => ({ ...s, guardianPhoto: e.target.files[0] }))}
                  />
                </div>
                <div className="space-y-1">
                  <div className="label">Guardian ID Proof</div>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="input"
                    onChange={e => setCreateForm(s => ({ ...s, guardianIdProof: e.target.files[0] }))}
                  />
                </div>
              </div>
            </div>
            */}

            {/* Login Details Section */}
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-200">🔐 Login Details</div>
              <div className="space-y-1">
                <div className="label">Login Password</div>
                <input
                  className="input bg-gray-100"
                  type="text"
                  value={createForm.password}
                  readOnly
                />
                <div className="text-[10px] text-gray-500">Default password: {DEFAULT_STUDENT_PASSWORD}. Students can change this after first login.</div>
              </div>
            </div>

            {/* Form Footer */}
            <div className="space-y-3">
              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                <div className="font-medium mb-1">📋 Form Guidelines:</div>
                <ul className="list-disc list-inside space-y-1">
                  <li>Fields marked * are mandatory</li>
                  <li>Student ID format: First 3 letters of name + First 2 letters of guardian name + Birth year</li>
                  <li>Roll number will be assigned automatically based on class enrollment</li>
                </ul>
              </div>
              <button className="btn btn-primary w-full" disabled={createLoading || uploadingFiles}>
                {uploadingFiles ? 'Uploading files...' : createLoading ? 'Creating...' : 'Create Student'}
              </button>
            </div>
          </form>
        </div>
      )}

      {currentTab === 'view' && (
        <div className="grid md:grid-cols-3 gap-6">
          {renderStudentList()}
          {renderPreviewPanel()}
        </div>
      )}

      {currentTab === 'bulk' && (
        <div className="card">
          <CSVUpload 
            type="students"
            onUpload={onCSVUpload}
            isLoading={bulkLoading}
            error={bulkError}
            success={bulkSuccess}
          />
        </div>
      )}

      {currentTab === 'promote' && (
        <div className="grid md:grid-cols-3 gap-6">
          {renderStudentList()}
          <div className="card">
            {!selected ? (
              <div className="text-sm text-gray-500">Select a student to promote/demote.</div>
            ) : (
              <div className="space-y-4">
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
                </div>
                <div>
                  <div className="text-sm font-medium">History</div>
                  <ul className="text-sm list-disc ml-5">
                    {promotions.map(p => (
                      <li key={p.id}>{p.action} • {p.from_class_name || '-'} → {p.to_class_name || '-'} • {new Date(p.effective_date).toLocaleDateString()}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
