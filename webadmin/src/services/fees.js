import api from './api'

// ── Fee Structure ─────────────────────────────────────────────
export const getFeeStructure = (params) => api.get('/fees/structure', { params })
export const createFeeStructure = (payload) => api.post('/fees/structure', payload)
export const deleteFeeStructure = (id) => api.delete(`/fees/structure/${id}`)

// ── Invoices ──────────────────────────────────────────────────
export const generateInvoices = (payload) => api.post('/fees/invoices/generate', payload)
export const listInvoices = (params) => api.get('/fees/invoices', { params })
export const getInvoiceById = (id) => api.get(`/fees/invoices/${id}`)

// ── Payments ──────────────────────────────────────────────────
export const recordPayment = (payload) => api.post('/fees/payments', payload)
export const receiptPdfUrl = (paymentId) => `${api.defaults.baseURL}/fees/receipts/${paymentId}.pdf`

// ── Razorpay ──────────────────────────────────────────────────
export const createRazorpayOrder = (payload) => api.post('/fees/razorpay/create-order', payload)
export const verifyRazorpayPayment = (payload) => api.post('/fees/razorpay/verify', payload)

// ── Reports ───────────────────────────────────────────────────
export const collectionReport = (params) => api.get('/fees/reports/collections', { params })
export const duesReport = (params) => api.get('/fees/reports/dues', { params })
export const defaultersReport = (params) => api.get('/fees/reports/defaulters', { params })

// ── Security Deposits ─────────────────────────────────────────
export const listDeposits = (params) => api.get('/fees/deposits', { params })
export const createDeposit = (payload) => api.post('/fees/deposits', payload)
export const refundDeposit = (id, payload) => api.put(`/fees/deposits/${id}/refund`, payload)

// ── Student Ledger ────────────────────────────────────────────
export const getStudentLedger = (studentId) => api.get(`/fees/ledger/${studentId}`)

// ── My Invoices (student/parent) ──────────────────────────────
export const getMyInvoices = () => api.get('/fees/my-invoices')
