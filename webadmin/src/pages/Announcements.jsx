import { useEffect, useState } from 'react'
import api from '../services/api'

export default function Announcements() {
  const [list, setList] = useState([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [target, setTarget] = useState('all')
  const [error, setError] = useState('')

  const load = () => api.get('/communication/announcements').then(r=>setList(r.data.announcements || [])).catch(()=>{})
  useEffect(load, [])

  const create = async (e) => {
    e.preventDefault(); setError('')
    try {
      await api.post('/communication/announcements', { title, content, targetAudience: target })
      setTitle(''); setContent(''); setTarget('all')
      load()
    } catch (err) { setError(err?.response?.data?.error || 'Failed to create') }
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="card md:col-span-2">
        <div className="font-semibold mb-2">Announcements</div>
        <div className="space-y-2">
          {list.map(a => (
            <div key={a.id} className="p-3 border rounded-lg bg-white">
              <div className="font-semibold">{a.title}</div>
              <div className="text-sm text-gray-600">{a.content}</div>
              <div className="text-xs text-gray-400 mt-1">Audience: {a.target_audience}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <div className="font-semibold mb-2">Create Announcement</div>
        <form onSubmit={create} className="space-y-2">
          <div>
            <div className="label">Title</div>
            <input className="input" value={title} onChange={e=>setTitle(e.target.value)} required />
          </div>
          <div>
            <div className="label">Content</div>
            <textarea className="input" rows="4" value={content} onChange={e=>setContent(e.target.value)} required />
          </div>
          <div>
            <div className="label">Audience</div>
            <select className="input" value={target} onChange={e=>setTarget(e.target.value)}>
              <option value="all">All</option>
              <option value="students">Students</option>
              <option value="teachers">Teachers</option>
              <option value="parents">Parents</option>
            </select>
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <button className="btn btn-primary w-full">Create</button>
        </form>
      </div>
    </div>
  )
}
