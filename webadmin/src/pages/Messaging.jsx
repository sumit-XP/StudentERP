import { useEffect, useMemo, useState } from 'react'
import { getConversations, getMessages, getMessageRecipients, sendMessage } from '../services/communication'

export default function Messaging() {
  const [conversations, setConversations] = useState([])
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [recipientQuery, setRecipientQuery] = useState('')
  const [recipients, setRecipients] = useState([])
  const [recipientsLoading, setRecipientsLoading] = useState(false)

  const activeUserId = selected?.other_user_id

  const loadConversations = async () => {
    setLoading(true)
    setError('')
    try {
      const r = await getConversations()
      setConversations(Array.isArray(r.data.conversations) ? r.data.conversations : [])
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load conversations')
      setConversations([])
    } finally {
      setLoading(false)
    }
  }

  const openConversation = async (conv) => {
    setSelected(conv)
    setMessagesLoading(true)
    setError('')
    try {
      const r = await getMessages({ otherUserId: conv.other_user_id })
      setMessages(Array.isArray(r.data.messages) ? r.data.messages : [])
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load messages')
      setMessages([])
    } finally {
      setMessagesLoading(false)
    }
  }

  const searchRecipients = async () => {
    if (!recipientQuery.trim()) {
      setRecipients([])
      return
    }
    setRecipientsLoading(true)
    setError('')
    try {
      const r = await getMessageRecipients({ search: recipientQuery.trim(), limit: 8 })
      setRecipients(Array.isArray(r.data.users) ? r.data.users : [])
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not search users.')
      setRecipients([])
    } finally {
      setRecipientsLoading(false)
    }
  }

  const selectRecipient = async (user) => {
    const conv = {
      other_user_id: user.id,
      other_user_name: user.name || user.email,
      last_message: '',
      unread_count: 0,
    }
    setSelected(conv)
    setRecipients([])
    setRecipientQuery('')
    await openConversation(conv)
  }

  const onSend = async (e) => {
    e.preventDefault()
    if (!selected || !text.trim()) return
    setSending(true)
    setError('')
    try {
      await sendMessage({ receiverId: selected.other_user_id, messageText: text.trim() })
      setText('')
      await openConversation(selected)
      await loadConversations()
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  useEffect(() => {
    loadConversations()
  }, [])

  const selectedName = useMemo(() => selected?.other_user_name || 'Conversation', [selected])

  return (
    <div className="flex-1 overflow-hidden flex flex-col md:flex-row absolute inset-0 -m-4 sm:-m-6 lg:-m-8 bg-surface text-on-surface font-body-md">
      {/* Left Panel: Conversations List */}
      <section className="w-full md:w-1/3 min-w-[320px] md:max-w-[400px] h-1/2 md:h-full bg-surface-container-lowest border-b md:border-b-0 md:border-r border-outline-variant flex flex-col overflow-hidden z-10">
        <div className="p-6 pb-4 border-b border-outline-variant space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-headline-md text-[24px] text-on-surface font-bold">Messages</h2>
            <button onClick={loadConversations} disabled={loading} className="w-10 h-10 flex items-center justify-center rounded-full text-primary hover:bg-primary-fixed transition-colors disabled:opacity-50" title="Refresh">
              <span className="material-symbols-outlined text-[20px]">refresh</span>
            </button>
          </div>
          
          <div className="flex flex-col gap-2">
            <div className="flex items-center bg-surface-container-low rounded-xl px-4 py-2.5 gap-2 border border-outline-variant focus-within:border-primary transition-colors">
              <span className="material-symbols-outlined text-outline text-[20px]">search</span>
              <input 
                className="bg-transparent border-none focus:ring-0 w-full text-body-sm text-on-surface placeholder:text-outline/70 p-0" 
                placeholder="Search new recipient..." 
                value={recipientQuery}
                onChange={(e) => setRecipientQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    searchRecipients()
                  }
                }}
              />
              <button 
                className="text-primary hover:text-primary-container text-sm font-medium ml-2 shrink-0" 
                onClick={searchRecipients}
                disabled={recipientsLoading}
              >
                Find
              </button>
            </div>
            
            {recipients.length > 0 && (
              <div className="mt-2 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg max-h-48 overflow-y-auto">
                {recipients.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    className="flex w-full items-center justify-between border-b border-outline-variant/30 px-4 py-3 text-left last:border-b-0 hover:bg-surface-container transition-colors"
                    onClick={() => selectRecipient(user)}
                  >
                    <div>
                      <span className="block text-[14px] font-semibold text-on-surface">{user.name || user.email}</span>
                      <span className="block text-[12px] text-on-surface-variant/70 mt-0.5">{user.email}</span>
                    </div>
                    <span className="bg-secondary-container text-on-secondary-container text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md">{user.role_name || user.role}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto bg-surface-container-lowest space-y-0.5 p-2">
          {error && (
            <div className="m-2 flex items-start gap-2 rounded-xl border border-error/20 bg-error-container/30 p-3 text-sm text-error">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}

          {loading ? (
             <div className="p-4 space-y-4 animate-pulse">
               {[1,2,3,4].map(i => (
                 <div key={i} className="flex gap-3 items-center">
                   <div className="w-12 h-12 rounded-full bg-surface-container-high shrink-0"></div>
                   <div className="flex-1 space-y-2">
                     <div className="h-4 bg-surface-container-high rounded-full w-2/3"></div>
                     <div className="h-3 bg-surface-container-high rounded-full w-4/5"></div>
                   </div>
                 </div>
               ))}
             </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 opacity-60">
              <span className="material-symbols-outlined text-[48px] text-outline mb-2">forum</span>
              <p className="font-body-md text-on-surface-variant">No conversations yet.<br/>Start a new one to get going.</p>
            </div>
          ) : (
            conversations.map((c) => (
              <button
                key={c.other_user_id}
                type="button"
                className={`flex w-full items-center gap-4 p-3 rounded-xl text-left transition-all duration-200 ${activeUserId === c.other_user_id ? 'bg-primary-container/10 border border-primary/20 shadow-sm' : 'hover:bg-surface-container-low border border-transparent'}`}
                onClick={() => openConversation(c)}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[16px] shrink-0">
                  {c.is_group ? <span className="material-symbols-outlined text-[20px]">groups</span> : (c.other_user_name || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold text-on-surface text-[15px] truncate">{c.other_user_name || 'User'}</div>
                    {!!Number(c.unread_count) && (
                      <span className="bg-primary text-on-primary text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 shadow-sm shadow-primary/20">
                        {c.unread_count}
                      </span>
                    )}
                  </div>
                  <div className={`mt-0.5 text-[13px] truncate ${Number(c.unread_count) ? 'text-on-surface font-medium' : 'text-on-surface-variant/70'}`}>
                    {c.last_message || 'No message preview'}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </section>

      {/* Right Panel: Message Content View */}
      <section className="flex-1 bg-surface flex flex-col overflow-hidden relative h-1/2 md:h-full">
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center relative z-10 p-6">
            <div className="max-w-md w-full flex flex-col items-center text-center space-y-6">
              <div className="w-24 h-24 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed shadow-md shadow-primary/5">
                <span className="material-symbols-outlined text-[42px]">mark_chat_unread</span>
              </div>
              <div>
                <h3 className="font-headline-md text-[24px] text-on-surface font-semibold mb-2">Your Messages</h3>
                <p className="font-body-md text-on-surface-variant/80">Select a conversation from the sidebar or search for a user to start a new one.</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <header className="h-[72px] shrink-0 bg-surface-container-lowest border-b border-outline-variant px-6 flex items-center justify-between z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[18px]">
                  {selected.is_group ? <span className="material-symbols-outlined text-[24px]">groups</span> : (selectedName || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-headline-sm text-[18px] text-on-surface font-semibold leading-tight">{selectedName}</h3>
                  <p className="text-[12px] text-on-surface-variant/70 flex items-center gap-1 mt-0.5">
                    {selected.is_group ? 'Group conversation' : <><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Private conversation</>}
                  </p>
                </div>
              </div>
            </header>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
              {messagesLoading ? (
                <div className="flex flex-col gap-6 animate-pulse">
                  {[1, 2, 3].map(item => (
                    <div key={item} className={`flex ${item % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                      <div className={`w-64 h-16 rounded-2xl ${item % 2 === 0 ? 'bg-primary/20 rounded-tr-sm' : 'bg-surface-container-high rounded-tl-sm'}`}></div>
                    </div>
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div className="flex h-full items-center justify-center text-center opacity-60 flex-col">
                   <span className="material-symbols-outlined text-[32px] mb-3 text-outline">waving_hand</span>
                   <div className="font-semibold text-on-surface text-[16px]">No messages yet</div>
                   <p className="text-sm text-on-surface-variant mt-1">Send a message to begin.</p>
                </div>
              ) : (
                messages.map((m) => {
                  const isMine = m.is_mine;
                  return (
                    <div key={m.id} className={`flex ${!isMine ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[75%] px-5 py-3 shadow-sm ${!isMine ? 'bg-surface-container-lowest text-on-surface rounded-2xl rounded-tl-sm border border-outline-variant/20' : 'bg-primary text-on-primary rounded-2xl rounded-tr-sm shadow-primary/20'}`}>
                        {!isMine && selected.is_group && <div className="mb-1 text-[11px] font-semibold text-primary uppercase tracking-wider">{m.sender_name || 'User'}</div>}
                        <div className="whitespace-pre-line text-[15px] leading-relaxed">{m.message_text}</div>
                        {m.created_at && (
                          <div className={`mt-2 text-[10px] text-right font-medium ${!isMine ? 'text-on-surface-variant/50' : 'text-on-primary/70'}`}>
                            {new Date(m.created_at).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Chat Footer */}
            <div className="p-4 bg-surface-container-lowest border-t border-outline-variant">
              <form onSubmit={onSend} className="max-w-4xl mx-auto flex items-end gap-3">
                <button type="button" className="p-3 rounded-full text-on-surface-variant hover:bg-surface-container transition-colors shrink-0">
                  <span className="material-symbols-outlined text-[24px]">add_circle</span>
                </button>
                <div className="flex-1 bg-surface-container-low rounded-3xl border border-outline-variant focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all flex items-end min-h-[52px] px-4 py-1.5">
                  <textarea 
                    className="w-full bg-transparent border-none focus:ring-0 text-[15px] text-on-surface placeholder:text-outline resize-none max-h-32 py-2"
                    placeholder="Type a message..."
                    rows={1}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        onSend(e);
                      }
                    }}
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={sending || !text.trim()} 
                  className="p-3.5 rounded-full bg-primary text-on-primary hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 transition-all shrink-0 disabled:opacity-50 disabled:hover:shadow-none flex items-center justify-center"
                >
                  {sending ? (
                    <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                  ) : (
                    <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                  )}
                </button>
              </form>
            </div>
          </>
        )}
      </section>
    </div>
  )
}
