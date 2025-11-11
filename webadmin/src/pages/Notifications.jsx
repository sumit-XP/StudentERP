import { useEffect, useState } from 'react'
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, getUnreadCount } from '../services/communication'

export default function Notifications() {
  const [list, setList] = useState([])
  const [unread, setUnread] = useState(0)
  const [filters, setFilters] = useState({ isRead: '', notificationType: '' })

  const load = async () => {
    const r = await getNotifications({ isRead: filters.isRead || undefined, notificationType: filters.notificationType || undefined })
    setList(r.data.notifications || [])
    const u = await getUnreadCount()
    setUnread(u.data.unreadCount || 0)
  }

  useEffect(() => { load() }, [])

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
      <div className="flex items-center justify-between">
        <div className="text-2xl font-semibold">Notifications</div>
        <div className="flex items-center gap-3">
          <span className="text-sm">Unread: <span className="badge bg-gray-200">{unread}</span></span>
          <button className="btn btn-outline" onClick={markAll}>Mark All Read</button>
        </div>
      </div>

      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
          <select className="input" value={filters.isRead} onChange={e=>setFilters(s=>({...s,isRead:e.target.value}))}>
            <option value="">All</option>
            <option value="true">Read</option>
            <option value="false">Unread</option>
          </select>
          <input className="input" placeholder="Type (announcement, message, etc)" value={filters.notificationType} onChange={e=>setFilters(s=>({...s,notificationType:e.target.value}))} />
          <button className="btn btn-primary" onClick={load}>Apply</button>
        </div>
        <div className="divide-y">
          {list.map(n => (
            <div key={n.id} className="py-3 flex items-start justify-between">
              <div>
                <div className="font-medium">{n.title}</div>
                <div className="text-sm text-gray-700 whitespace-pre-line">{n.message}</div>
                <div className="text-xs text-gray-500">{new Date(n.created_at).toLocaleString()} • {n.notification_type}</div>
              </div>
              {!n.is_read && <button className="btn btn-outline" onClick={()=>markOne(n.id)}>Mark Read</button>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
