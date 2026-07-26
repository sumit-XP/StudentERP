import { useEffect, useState } from 'react'
import api from '../services/api'

const audienceOptions = [
  { value: 'all', label: 'All users' },
  { value: 'students', label: 'Students Only' },
  { value: 'teachers', label: 'Teachers & Staff' },
  { value: 'parents', label: 'Parents Only' },
]

export default function Announcements() {
  const [list, setList] = useState([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [target, setTarget] = useState('all')
  const [type, setType] = useState('General')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const r = await api.get('/communication/announcements')
      setList(Array.isArray(r.data.announcements) ? r.data.announcements : [])
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load announcements')
      setList([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const create = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)
    try {
      await api.post('/communication/announcements', {
        title: title.trim(),
        content: content.trim(),
        targetAudience: target,
        announcementType: type,
      })
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        setTitle('')
        setContent('')
        setTarget('all')
        setType('General')
      }, 2000)
      await load()
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to create announcement')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-8 flex gap-8 flex-col lg:flex-row flex-1 bg-background font-body-md text-on-surface min-h-[calc(100vh-80px)]">
      {/* Announcements List Section */}
      <div className="flex-1">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-headline-lg text-[28px] text-on-surface tracking-tight">Announcements</h2>
            <p className="font-body-md text-on-surface-variant mt-2 text-[15px]">Manage and publish updates across the school community.</p>
          </div>
          <button onClick={load} disabled={loading} className="flex items-center gap-2 px-5 py-2.5 bg-surface-container-lowest rounded-xl hover:bg-surface-container-low transition-all text-on-surface font-label-md shadow-sm border border-outline-variant/20 disabled:opacity-50">
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-error/20 bg-error-container/30 p-4 text-sm text-error">
            <span className="material-symbols-outlined mt-0.5 text-[20px]">error</span>
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/10 animate-pulse">
                <div className="h-5 bg-surface-container-low rounded-full w-1/3 mb-4" />
                <div className="h-4 bg-surface-container-low rounded-full w-5/6 mb-2" />
                <div className="h-4 bg-surface-container-low rounded-full w-4/6" />
              </div>
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-3xl h-[480px] flex flex-col items-center justify-center p-8 relative shadow-sm border border-outline-variant/10">
            <div className="relative z-10 text-center max-w-md">
              <div className="w-20 h-20 bg-primary/5 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-primary text-[32px]">campaign</span>
              </div>
              <h3 className="font-headline-sm text-on-surface mb-2">No announcements yet</h3>
              <p className="font-body-md text-on-surface-variant/80 mb-8 leading-relaxed text-[15px]">
                Your announcement board is empty. Start communicating with students, teachers, and parents by creating your first notice.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {list.map((a) => (
              <article key={a.id} className="bg-surface-container-lowest rounded-3xl p-6 shadow-sm border border-outline-variant/10 hover:shadow-md transition-shadow">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <h2 className="font-headline-sm text-[18px] text-on-surface">{a.title}</h2>
                    <p className="mt-2 whitespace-pre-line text-[15px] font-body-md text-on-surface-variant/90 leading-relaxed">{a.content}</p>
                  </div>
                  <span className="shrink-0 inline-flex items-center px-3 py-1 rounded-full bg-primary-container/10 text-primary font-label-sm text-[12px] uppercase tracking-wider">
                    {a.target_audience === 'all' ? 'All Users' : a.target_audience}
                  </span>
                </div>
                <div className="mt-6 flex flex-wrap items-center gap-4 text-[13px] font-label-md text-on-surface-variant/60">
                  <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">label</span>{a.announcement_type || 'General'}</span>
                  {a.created_by_name && <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">person</span>By {a.created_by_name}</span>}
                  {a.created_at && <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">schedule</span>{new Date(a.created_at).toLocaleString()}</span>}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Create Panel */}
      <div className="w-full lg:w-[420px] shrink-0">
        <div className="bg-surface-container-lowest rounded-3xl p-8 sticky top-24 shadow-sm border border-outline-variant/10">
          <div className="mb-8">
            <h3 className="font-headline-sm text-[20px] text-on-surface">Create Announcement</h3>
            <p className="font-body-sm text-on-surface-variant mt-1.5 text-[14px]">Keep the message short, direct, and actionable.</p>
          </div>
          <form onSubmit={create} className="space-y-6">
            <div className="space-y-2">
              <label className="font-label-md text-[13px] text-on-surface-variant/80 block font-medium">Title</label>
              <input 
                className="w-full bg-surface-container-low/50 border-transparent rounded-xl p-3.5 focus:bg-surface-container-lowest focus:border-primary/30 focus:ring-4 focus:ring-primary/10 transition-all text-body-md placeholder:text-on-surface-variant/40" 
                placeholder="e.g., Annual Sports Meet 2024" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                required 
              />
            </div>
            
            <div className="space-y-2">
              <label className="font-label-md text-[13px] text-on-surface-variant/80 block font-medium">Content</label>
              <textarea 
                className="w-full bg-surface-container-low/50 border-transparent rounded-xl p-3.5 focus:bg-surface-container-lowest focus:border-primary/30 focus:ring-4 focus:ring-primary/10 transition-all text-body-md resize-none placeholder:text-on-surface-variant/40" 
                placeholder="Describe the details of your announcement here..." 
                rows="5"
                value={content} 
                onChange={(e) => setContent(e.target.value)} 
                required
              ></textarea>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
              <div className="space-y-2">
                <label className="font-label-md text-[13px] text-on-surface-variant/80 block font-medium">Type</label>
                <div className="relative">
                  <select 
                    className="w-full bg-surface-container-low/50 border-transparent rounded-xl p-3.5 pr-10 focus:bg-surface-container-lowest focus:border-primary/30 focus:ring-4 focus:ring-primary/10 transition-all appearance-none text-body-md"
                    value={type} 
                    onChange={(e) => setType(e.target.value)}
                  >
                    <option value="General">General</option>
                    <option value="Academic">Academic</option>
                    <option value="Emergency">Emergency</option>
                    <option value="Event">Event</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant/60 text-[20px]">expand_more</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-label-md text-[13px] text-on-surface-variant/80 block font-medium">Audience</label>
                <div className="relative">
                  <select 
                    className="w-full bg-surface-container-low/50 border-transparent rounded-xl p-3.5 pr-10 focus:bg-surface-container-lowest focus:border-primary/30 focus:ring-4 focus:ring-primary/10 transition-all appearance-none text-body-md"
                    value={target} 
                    onChange={(e) => setTarget(e.target.value)}
                  >
                    {audienceOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant/60 text-[20px]">people</span>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button 
                type="submit" 
                disabled={saving || !title.trim() || !content.trim()}
                className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-label-md font-medium transition-all shadow-md text-[15px] text-white disabled:opacity-70 ${success ? 'bg-green-600 shadow-green-600/20' : 'bg-primary hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 shadow-primary/20'}`}
              >
                {saving ? (
                  <><span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span> Processing...</>
                ) : success ? (
                  <><span className="material-symbols-outlined text-[20px]">check_circle</span> Published Successfully</>
                ) : (
                  <><span className="material-symbols-outlined text-[20px]">send</span> Publish Announcement</>
                )}
              </button>
            </div>
          </form>

          {/* Quick Preview Card */}
          <div className="mt-10 pt-8 border-t border-outline-variant/10">
            <span className="font-label-sm text-[10px] uppercase text-on-surface-variant/40 font-semibold tracking-widest block mb-4">Live Preview</span>
            <div className={`bg-surface-container-lowest rounded-xl p-4 flex items-start gap-4 border border-outline-variant/10 transition-all ${title || content ? 'opacity-100' : 'opacity-50'}`}>
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined">campaign</span>
              </div>
              <div className="space-y-1.5 w-full pt-0.5">
                {title ? (
                  <h4 className="font-headline-sm text-[14px] text-on-surface leading-snug truncate">{title}</h4>
                ) : (
                  <div className="h-3 bg-surface-container-low rounded-full w-2/3 mb-2"></div>
                )}
                {content ? (
                  <p className="font-body-sm text-[12px] text-on-surface-variant line-clamp-2">{content}</p>
                ) : (
                  <>
                    <div className="h-2 bg-surface-container-low rounded-full w-full mb-1.5"></div>
                    <div className="h-2 bg-surface-container-low rounded-full w-4/5"></div>
                  </>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
