import { useEffect, useState } from 'react'
import api from '../services/api'

export default function Classes() {
  const [list, setList] = useState([])
  const [years, setYears] = useState([])
  const [teachers, setTeachers] = useState([])
  const [name, setName] = useState('')
  const [gradeLevel, setGradeLevel] = useState('')
  const [section, setSection] = useState('')
  const [academicYearId, setAcademicYearId] = useState('')
  const [classTeacherId, setClassTeacherId] = useState('')
  const [error, setError] = useState('')

  const [editingClassId, setEditingClassId] = useState(null)
  const [editTeacherId, setEditTeacherId] = useState('')

  const [selectedClassId, setSelectedClassId] = useState('')
  const [subjects, setSubjects] = useState([])
  const [subjectName, setSubjectName] = useState('')
  const [subjectError, setSubjectError] = useState('')

  const load = async () => {
    try {
      const [cRes, yRes, tRes] = await Promise.all([
        api.get('/academic/classes'),
        api.get('/academic/academic-years'),
        api.get('/academic/teachers?limit=1000').catch(()=>({data:{teachers:[]}}))
      ])
      setList(cRes.data.classes)
      setYears(yRes.data.academicYears)
      setTeachers(tRes.data?.teachers || [])
      if (!academicYearId && yRes.data.academicYears?.[0]) setAcademicYearId(yRes.data.academicYears[0].id)
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load')
    }
  }

  useEffect(()=>{ load() },[])

  const onCreate = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await api.post('/academic/classes', {
        name, gradeLevel: Number(gradeLevel), section, academicYearId: Number(academicYearId), classTeacherId: classTeacherId ? Number(classTeacherId) : null
      })
      setName(''); setGradeLevel(''); setSection(''); setClassTeacherId('')
      load()
    } catch (err) { setError(err?.response?.data?.error || 'Failed to create class') }
  }

  const saveEdit = async (id) => {
    try {
      await api.put(`/academic/classes/${id}`, {
        classTeacherId: editTeacherId ? Number(editTeacherId) : null
      })
      setEditingClassId(null)
      load()
    } catch (err) {
      alert(err?.response?.data?.error || 'Failed to update class')
    }
  }

  const loadSubjects = async (classId) => {
    if (!classId) return setSubjects([])
    try {
      const res = await api.get(`/academic/subjects?classId=${classId}`)
      setSubjects(res.data.subjects)
    } catch (err) {
      setSubjectError(err?.response?.data?.error || 'Failed to load subjects')
    }
  }

  useEffect(() => {
    loadSubjects(selectedClassId)
  }, [selectedClassId])

  const onCreateSubject = async (e) => {
    e.preventDefault()
    setSubjectError('')
    if (!selectedClassId) return setSubjectError('Select a class first')
    try {
      await api.post('/academic/subjects', {
        name: subjectName, classId: Number(selectedClassId)
      })
      setSubjectName('')
      loadSubjects(selectedClassId)
    } catch (err) { setSubjectError(err?.response?.data?.error || 'Failed to create subject') }
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold">Classes</div>
          <button className="btn btn-outline" onClick={load}>Refresh</button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500">
                <th className="p-2">Name</th>
                <th className="p-2">Grade</th>
                <th className="p-2">Section</th>
                <th className="p-2">Class Teacher</th>
                <th className="p-2">Students</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map(c => (
                <tr key={c.id} className="border-t">
                  <td className="p-2">{c.name}</td>
                  <td className="p-2">{c.grade_level}</td>
                  <td className="p-2">{c.section}</td>
                  <td className="p-2">
                    {editingClassId === c.id ? (
                      <select className="input text-sm py-1" value={editTeacherId} onChange={e=>setEditTeacherId(e.target.value)}>
                        <option value="">-- None --</option>
                        {teachers.map(t => <option key={t.id} value={t.user_id}>{t.name}</option>)}
                      </select>
                    ) : (
                      c.class_teacher_name || '-'
                    )}
                  </td>
                  <td className="p-2">{c.student_count}</td>
                  <td className="p-2 text-sm">
                    {editingClassId === c.id ? (
                      <div className="flex gap-2">
                        <button className="text-green-600 hover:underline" onClick={()=>saveEdit(c.id)}>Save</button>
                        <button className="text-gray-500 hover:underline" onClick={()=>setEditingClassId(null)}>Cancel</button>
                      </div>
                    ) : (
                      <button className="text-blue-600 hover:underline" onClick={()=>{
                        setEditingClassId(c.id);
                        setEditTeacherId(c.class_teacher_id || '');
                      }}>Edit</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="font-semibold mb-2">Create Class</div>
        <form onSubmit={onCreate} className="grid md:grid-cols-4 gap-3">
          <div>
            <div className="label">Name</div>
            <input className="input" value={name} onChange={e=>setName(e.target.value)} required />
          </div>
          <div>
            <div className="label">Grade Level</div>
            <input className="input" type="number" value={gradeLevel} onChange={e=>setGradeLevel(e.target.value)} required />
          </div>
          <div>
            <div className="label">Section</div>
            <input className="input" value={section} onChange={e=>setSection(e.target.value)} />
          </div>
          <div>
            <div className="label">Academic Year</div>
            <select className="input" value={academicYearId} onChange={e=>setAcademicYearId(e.target.value)} required>
              {years.length === 0 && <option value="" disabled>No academic years (Create in Dashboard)</option>}
              {years.length > 0 && !academicYearId && <option value="" disabled>Select year</option>}
              {years.map(y => <option key={y.id} value={y.id}>{y.year_name}</option>)}
            </select>
          </div>
          <div>
            <div className="label">Class Teacher (Optional)</div>
            <select className="input" value={classTeacherId} onChange={e=>setClassTeacherId(e.target.value)}>
              <option value="">-- None --</option>
              {teachers.map(t => <option key={t.id} value={t.user_id}>{t.name}</option>)}
            </select>
          </div>
          {error && <div className="text-sm text-red-600 md:col-span-4">{error}</div>}
          <div className="md:col-span-4">
            <button className="btn btn-primary">Create</button>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="font-semibold mb-2">Class Subjects</div>
        <div className="mb-4">
          <div className="label">Select Class to Manage Subjects</div>
          <select className="input max-w-sm" value={selectedClassId} onChange={e=>setSelectedClassId(e.target.value)}>
            <option value="">-- Select Class --</option>
            {list.map(c => <option key={c.id} value={c.id}>{c.name} (Grade {c.grade_level})</option>)}
          </select>
        </div>

        {selectedClassId && (
          <div className="space-y-4">
            <div className="border p-4 rounded-md">
              <div className="font-medium mb-2">Subjects List</div>
              {subjects.length === 0 ? <div className="text-gray-500 text-sm">No subjects created for this class yet.</div> : (
                <ul className="list-disc pl-5 space-y-1">
                  {subjects.map(s => <li key={s.id}>{s.name}</li>)}
                </ul>
              )}
            </div>

            <form onSubmit={onCreateSubject} className="flex gap-2 items-end">
              <div>
                <div className="label">New Subject Name</div>
                <input className="input" value={subjectName} onChange={e=>setSubjectName(e.target.value)} required placeholder="e.g. Mathematics" />
              </div>
              <button className="btn btn-primary">Add Subject</button>
            </form>
            {subjectError && <div className="text-sm text-red-600">{subjectError}</div>}
          </div>
        )}
      </div>
    </div>
  )
}
