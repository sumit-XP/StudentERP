import api from './api'

// Messages
export const getConversations = () => api.get('/communication/conversations')
export const getMessages = (params) => api.get('/communication/messages', { params })
export const sendMessage = (payload) => api.post('/communication/messages', payload)
export const getMessageRecipients = (params) => api.get('/communication/recipients', { params })

// Notifications
export const getNotifications = (params) => api.get('/communication/notifications', { params })
export const markNotificationAsRead = (id) => api.put(`/communication/notifications/${id}/read`)
export const markAllNotificationsAsRead = () => api.put('/communication/notifications/mark-all-read')
export const getUnreadCount = () => api.get('/communication/notifications/unread-count')
