import { useEffect, useState } from 'react'
import api from '../services/api'

export default function Subjects() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [credits, setCredits] = useState(3)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    api.get('/academic/subjects')
      .then(res => setList(res.data.subjects))
      .catch(err => setError(err?.response?.data?.error || 'Failed to load'))
      .finally(()=> setLoading(false))
  }

  useEffect(load, [])

  const onCreate = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await api.post('/academic/subjects', { name, code, credits: Number(credits) })
      setName(''); setCode(''); setCredits(3)
      load()
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to create subject')
    }
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="card md:col-span-2">
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold">Subjects</div>
          <button className="btn btn-outline" onClick={load}>Refresh</button>
        </div>
        {loading ? 'Loading...' : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500">
                  <th className="p-2">Name</th>
                  <th className="p-2">Code</th>
                  <th className="p-2">Credits</th>
                </tr>
              </thead>
              <tbody>
                {list.map(s => (
                  <tr key={s.id} className="border-t">
                    <td className="p-2">{s.name}</td>
                    <td className="p-2">{s.code}</td>
                    <td className="p-2">{s.credits}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="card">
        <div className="font-semibold mb-2">Create Subject</div>
        <form onSubmit={onCreate} className="space-y-2">
          <div>
            <div className="label">Name</div>
            <input className="input" value={name} onChange={e=>setName(e.target.value)} required />
          </div>
          <div>
            <div className="label">Code</div>
            <input className="input" value={code} onChange={e=>setCode(e.target.value)} required />
          </div>
          <div>
            <div className="label">Credits</div>
            <input className="input" type="number" value={credits} onChange={e=>setCredits(e.target.value)} min={1} max={10} />
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <button className="btn btn-primary w-full">Create</button>
        </form>
      </div>
    </div>
  )
}
