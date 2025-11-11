import { useEffect, useState } from 'react'
import { getConversations, getMessages, sendMessage } from '../services/communication'

export default function Messaging() {
  const [conversations, setConversations] = useState([])
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)

  const loadConversations = async () => {
    const r = await getConversations()
    setConversations(r.data.conversations || [])
  }
  const openConversation = async (conv) => {
    setSelected(conv)
    const r = await getMessages({ otherUserId: conv.other_user_id })
    setMessages(r.data.messages || [])
  }
  const onSend = async (e) => {
    e.preventDefault()
    if (!selected || !text.trim()) return
    setLoading(true)
    try {
      await sendMessage({ receiverId: selected.other_user_id, messageText: text })
      setText('')
      await openConversation(selected)
      await loadConversations()
    } finally { setLoading(false) }
  }

  useEffect(() => { loadConversations() }, [])

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold">Conversations</div>
          <button className="btn btn-outline btn-sm" onClick={loadConversations}>Refresh</button>
        </div>
        <div className="divide-y">
          {conversations.map(c => (
            <div key={c.other_user_id} className={`p-3 cursor-pointer ${selected?.other_user_id===c.other_user_id ? 'bg-blue-50' : 'hover:bg-gray-50'}`} onClick={()=>openConversation(c)}>
              <div className="font-medium">{c.other_user_name}</div>
              <div className="text-xs text-gray-500 truncate">{c.last_message}</div>
              {!!c.unread_count && <div className="text-xs text-teal-700">Unread: {c.unread_count}</div>}
            </div>
          ))}
        </div>
      </div>
      <div className="card md:col-span-2">
        {!selected ? (
          <div className="text-sm text-gray-500">Select a conversation to view messages</div>
        ) : (
          <div className="flex flex-col h-[70vh]">
            <div className="font-semibold mb-2">Chat with {selected.other_user_name}</div>
            <div className="flex-1 overflow-auto border rounded p-3 bg-white">
              {messages.map(m => (
                <div key={m.id} className={`mb-2 ${m.sender_name===selected.other_user_name ? '' : 'text-right'}`}>
                  <div className="inline-block px-3 py-2 rounded bg-slate-100 text-sm">
                    <div className="text-xs text-gray-500">{m.sender_name}</div>
                    <div>{m.message_text}</div>
                  </div>
                </div>
              ))}
            </div>
            <form className="mt-3 flex gap-2" onSubmit={onSend}>
              <input className="input flex-1" placeholder="Type a message" value={text} onChange={e=>setText(e.target.value)} />
              <button className="btn btn-primary" disabled={loading}>{loading?'Sending...':'Send'}</button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
