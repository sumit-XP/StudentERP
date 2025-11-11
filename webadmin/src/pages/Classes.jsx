import { useEffect, useState } from 'react'
import api from '../services/api'

export default function Classes() {
  const [list, setList] = useState([])
  const [years, setYears] = useState([])
  const [name, setName] = useState('')
  const [gradeLevel, setGradeLevel] = useState('')
  const [section, setSection] = useState('')
  const [academicYearId, setAcademicYearId] = useState('')
  const [error, setError] = useState('')

  const load = async () => {
    try {
      const [cRes, yRes] = await Promise.all([
        api.get('/academic/classes'),
        api.get('/academic/academic-years')
      ])
      setList(cRes.data.classes)
      setYears(yRes.data.academicYears)
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
        name, gradeLevel: Number(gradeLevel), section, academicYearId: Number(academicYearId)
      })
      setName(''); setGradeLevel(''); setSection('')
      load()
    } catch (err) { setError(err?.response?.data?.error || 'Failed to create class') }
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
                <th className="p-2">Students</th>
              </tr>
            </thead>
            <tbody>
              {list.map(c => (
                <tr key={c.id} className="border-t">
                  <td className="p-2">{c.name}</td>
                  <td className="p-2">{c.grade_level}</td>
                  <td className="p-2">{c.section}</td>
                  <td className="p-2">{c.student_count}</td>
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
            <select className="input" value={academicYearId} onChange={e=>setAcademicYearId(e.target.value)}>
              {years.map(y => <option key={y.id} value={y.id}>{y.year_name}</option>)}
            </select>
          </div>
          {error && <div className="text-sm text-red-600 md:col-span-4">{error}</div>}
          <div className="md:col-span-4">
            <button className="btn btn-primary">Create</button>
          </div>
        </form>
      </div>
    </div>
  )
}
