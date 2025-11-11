import api from './api'

export const getFeeStructure = (params) => api.get('/fees/structure', { params })
export const createFeeStructure = (payload) => api.post('/fees/structure', payload)

export const generateInvoices = (payload) => api.post('/fees/invoices/generate', payload)
export const listInvoices = (params) => api.get('/fees/invoices', { params })
export const getInvoiceById = (id) => api.get(`/fees/invoices/${id}`)
export const recordPayment = (payload) => api.post('/fees/payments', payload)

export const createRazorpayOrder = (payload) => api.post('/fees/razorpay/create-order', payload)
export const verifyRazorpayPayment = (payload) => api.post('/fees/razorpay/verify', payload)

export const collectionReport = (params) => api.get('/fees/reports/collections', { params })
export const duesReport = (params) => api.get('/fees/reports/dues', { params })
export const defaultersReport = (params) => api.get('/fees/reports/defaulters', { params })

export const listDeposits = (params) => api.get('/fees/deposits', { params })
export const createDeposit = (payload) => api.post('/fees/deposits', payload)
export const refundDeposit = (id, payload) => api.put(`/fees/deposits/${id}/refund`, payload)
