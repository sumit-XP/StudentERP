import { useEffect, useState } from 'react'
import { Bell, CheckCheck, RefreshCcw, AlertCircle } from 'lucide-react'
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, getUnreadCount } from '../services/communication'

export default function Notifications() {
  const [list, setList] = useState([])
  const [unread, setUnread] = useState(0)
  const [filters, setFilters] = useState({ isRead: '', notificationType: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const r = await getNotifications({
        isRead: filters.isRead || undefined,
        notificationType: filters.notificationType || undefined,
      })
      setList(Array.isArray(r.data.notifications) ? r.data.notifications : [])

      const u = await getUnreadCount()
      setUnread(Number(u.data.unreadCount || 0))
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load notifications')
      setList([])
      setUnread(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const markOne = async (id) => {
    await markNotificationAsRead(id)
    await load()
  }

  const markAll = async () => {
    await markAllNotificationsAsRead()
    await load()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-950">Notifications</h1>
          <p className="text-sm text-gray-500">Track announcements, messages, and system alerts.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold">
            <Bell className="h-4 w-4 text-blue-600" />
            {unread} unread
          </span>
          <button className="btn btn-outline" onClick={load} disabled={loading}>
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </button>
          <button className="btn btn-primary" onClick={markAll} disabled={!unread}>
            <CheckCheck className="h-4 w-4" />
            Mark All Read
          </button>
        </div>
      </div>

      <div className="card">
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          <select className="input" value={filters.isRead} onChange={(e) => setFilters((s) => ({ ...s, isRead: e.target.value }))}>
            <option value="">All statuses</option>
            <option value="true">Read</option>
            <option value="false">Unread</option>
          </select>
          <select className="input" value={filters.notificationType} onChange={(e) => setFilters((s) => ({ ...s, notificationType: e.target.value }))}>
            <option value="">All types</option>
            <option value="announcement">Announcement</option>
            <option value="message">Message</option>
            <option value="attendance">Attendance</option>
            <option value="fees">Fees</option>
          </select>
          <button className="btn btn-primary md:w-fit" onClick={load}>Apply Filters</button>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((item) => <div key={item} className="skeleton h-16" />)}
          </div>
        ) : list.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
            <Bell className="mx-auto mb-3 h-10 w-10 text-gray-400" />
            <div className="font-semibold text-gray-900">No notifications to show</div>
            <p className="mt-1 text-sm text-gray-500">New announcements and messages will appear here automatically.</p>
          </div>
        ) : (
          <div className="divide-y overflow-hidden rounded-lg border border-gray-200">
            {list.map((n) => (
              <div key={n.id} className={`flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between ${n.is_read ? 'bg-white' : 'bg-blue-50/60'}`}>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-gray-950">{n.title}</h2>
                    <span className="badge bg-gray-100 text-gray-700">{n.notification_type || 'notification'}</span>
                    {!n.is_read && <span className="badge bg-blue-100 text-blue-700">Unread</span>}
                  </div>
                  <p className="mt-1 whitespace-pre-line text-sm text-gray-700">{n.message}</p>
                  {n.created_at && <div className="mt-2 text-xs text-gray-500">{new Date(n.created_at).toLocaleString()}</div>}
                </div>
                {!n.is_read && (
                  <button className="btn btn-outline shrink-0" onClick={() => markOne(n.id)}>
                    Mark Read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
