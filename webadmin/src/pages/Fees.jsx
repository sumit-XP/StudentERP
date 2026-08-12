import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  getFeeStructure,
  createFeeStructure,
  deleteFeeStructure,
  generateInvoices,
  listInvoices,
  getInvoiceById,
  recordPayment,
  receiptPdfUrl,
  createRazorpayOrder,
  verifyRazorpayPayment,
  collectionReport,
  duesReport,
  defaultersReport,
  getStudentLedger,
} from '../services/fees'

// ── Helpers ───────────────────────────────────────────────────
const safe = (n) => Number(n) || 0
const fmt = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const fmtAmount = (n) => `₹${safe(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const statusColor = (s) => ({
  paid:    'bg-emerald-100 text-emerald-800 border-emerald-200',
  partial: 'bg-amber-100 text-amber-800 border-amber-200',
  unpaid:  'bg-red-100 text-red-800 border-red-200',
}[s] || 'bg-gray-100 text-gray-700 border-gray-200')

const FEE_TYPES = ['Monthly Tuition Fee', 'Transport Fee', 'Lab Charges', 'Sports Fee', 'Library Fee', 'Admission Fee', 'Exam Fee', 'Late Fine', 'Miscellaneous']
const PAY_METHODS = [
  { value: 'cash',     label: '💵 Cash' },
  { value: 'cheque',   label: '📝 Cheque' },
  { value: 'dd',       label: '🏦 Demand Draft' },
  { value: 'bank',     label: '🔀 Bank Transfer' },
  { value: 'upi',      label: '📱 UPI' },
]

// ── Razorpay loader ───────────────────────────────────────────
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true)
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload = () => resolve(true)
    s.onerror = () => resolve(false)
    document.body.appendChild(s)
  })
}

// ── Toast ─────────────────────────────────────────────────────
function Toast({ toasts }) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
      {toasts.map(t => (
        <div key={t.id} className={`px-4 py-3 rounded-xl shadow-lg text-sm font-semibold animate-fade-in
          ${t.type === 'success' ? 'bg-emerald-600 text-white' : t.type === 'error' ? 'bg-red-600 text-white' : 'bg-gray-800 text-white'}`}>
          {t.msg}
        </div>
      ))}
    </div>
  )
}

// ── Tab Button ────────────────────────────────────────────────
function Tab({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap
        ${active ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
    >
      {children}
    </button>
  )
}

// ── Print Receipt ─────────────────────────────────────────────
function PrintReceiptModal({ invoice, items, payment, onClose }) {
  const printRef = useRef()

  const handlePrint = () => {
    const content = printRef.current.innerHTML
    const win = window.open('', '_blank', 'width=800,height=700')
    win.document.write(`
      <html><head><title>Fee Receipt</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #111; }
        .header { text-align: center; margin-bottom: 24px; }
        .header h1 { font-size: 22px; margin: 0 0 4px; }
        .header p { font-size: 12px; color: #666; margin: 0; }
        .divider { border-top: 2px solid #333; margin: 16px 0; }
        .divider-thin { border-top: 1px solid #ccc; margin: 12px 0; }
        .row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
        .label { font-weight: 600; color: #444; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th { background: #f5f5f5; padding: 8px; text-align: left; font-size: 12px; text-transform: uppercase; }
        td { padding: 8px; font-size: 13px; border-bottom: 1px solid #eee; }
        .total-row td { font-weight: 700; font-size: 14px; background: #f9f9f9; }
        .badge-paid { background: #d1fae5; color: #065f46; padding: 2px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; }
        .footer { text-align: center; margin-top: 32px; font-size: 11px; color: #999; }
        @media print { button { display: none; } }
      </style>
      </head><body onload="window.print()">
      ${content}
      </body></html>
    `)
    win.document.close()
  }

  const totalBilled = safe(invoice?.total_amount) + safe(invoice?.late_fee)
  const amtPaid = safe(payment?.amount_paid)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Fee Receipt Preview</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl">✕</button>
        </div>

        {/* Print-ready content */}
        <div ref={printRef} className="p-6">
          <div className="header">
            <h1>FEE RECEIPT</h1>
            <p>School ERP Management System</p>
          </div>
          <div className="divider" />
          <div className="grid grid-cols-2 gap-2 text-sm mb-4">
            {[
              ['Receipt No', payment?.receipt_number || '—'],
              ['Invoice No', invoice?.invoice_number || '—'],
              ['Student', `${invoice?.student_name || ''} (${invoice?.student_number || ''})`],
              ['Class', invoice?.class_name ? `${invoice.class_name} ${invoice.section || ''}` : '—'],
              ['Payment Date', payment?.payment_date ? String(payment.payment_date).slice(0,10) : fmt(new Date())],
              ['Payment Method', (payment?.payment_method || '').toUpperCase() || '—'],
            ].map(([l, v]) => (
              <div key={l} className="row">
                <span className="label text-gray-500">{l}:</span>
                <span className="font-medium text-gray-900">{v}</span>
              </div>
            ))}
          </div>
          <div className="divider-thin" />
          <table>
            <thead>
              <tr><th>Fee Type</th><th style={{ textAlign: 'right' }}>Amount</th></tr>
            </thead>
            <tbody>
              {(items || []).map((it, i) => (
                <tr key={i}>
                  <td>{it.fee_type}</td>
                  <td style={{ textAlign: 'right' }}>{fmtAmount(it.amount)}</td>
                </tr>
              ))}
              <tr className="total-row">
                <td>Total Billed</td>
                <td style={{ textAlign: 'right' }}>{fmtAmount(totalBilled)}</td>
              </tr>
              <tr className="total-row" style={{ color: '#059669' }}>
                <td>Amount Paid</td>
                <td style={{ textAlign: 'right' }}>{fmtAmount(amtPaid)}</td>
              </tr>
            </tbody>
          </table>
          <div className="divider-thin" />
          <div className="footer">
            This is a computer-generated receipt and does not require a signature.<br />
            Generated on {fmt(new Date())}
          </div>
        </div>

        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="btn btn-outline flex-1">Close</button>
          <button onClick={handlePrint} className="btn btn-primary flex-1">🖨 Print / Save PDF</button>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
//  MAIN FEES PAGE
// ════════════════════════════════════════════════════════════
export default function Fees() {
  const [tab, setTab] = useState('structure')
  const [toasts, setToasts] = useState([])
  const toastId = useRef(0)

  const toast = useCallback((msg, type = 'success') => {
    const id = ++toastId.current
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }, [])

  // ── Fee Structure State ────────────────────────────────────
  const [structure, setStructure]         = useState([])
  const [structureLoading, setStructureLoading] = useState(false)
  const [newStruct, setNewStruct]         = useState({ classId: '', feeType: FEE_TYPES[0], amount: '', dueDate: '', academicYearId: '' })

  // ── Invoice State ──────────────────────────────────────────
  const [classes, setClasses]             = useState([])
  const [invoices, setInvoices]           = useState([])
  const [invLoading, setInvLoading]       = useState(false)
  const [invSearch, setInvSearch]         = useState('')
  const [invStatus, setInvStatus]         = useState('all')
  const [invClassId, setInvClassId]       = useState('')
  const [classStudents, setClassStudents] = useState([])
  const [genForm, setGenForm]             = useState({ classId: '', studentId: '', academicYearId: '', dueDate: '' })
  const [genLoading, setGenLoading]       = useState(false)

  // ── Invoice Detail / Payment State ────────────────────────
  const [selectedInv, setSelectedInv]     = useState(null)
  const [invDetail, setInvDetail]         = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [payForm, setPayForm]             = useState({ amountPaid: '', paymentMethod: 'cash', transactionId: '', remarks: '', collectedBy: '' })
  const [payLoading, setPayLoading]       = useState(false)
  const [rzLoading, setRzLoading]         = useState(false)

  // ── Print Receipt State ────────────────────────────────────
  const [printData, setPrintData]         = useState(null)

  // ── Reports State ─────────────────────────────────────────
  const [dateRange, setDateRange]         = useState({ startDate: '', endDate: '' })
  const [reports, setReports]             = useState(null)
  const [reportLoading, setReportLoading] = useState(false)

  // ── Student Ledger State ───────────────────────────────────
  const [ledgerStudentId, setLedgerStudentId] = useState('')
  const [ledger, setLedger]               = useState(null)
  const [ledgerLoading, setLedgerLoading] = useState(false)

  const canUseRazor = useMemo(() => !!import.meta.env.VITE_RAZORPAY_KEY_ID, [])

  // ── Data Loaders ───────────────────────────────────────────
  const loadStructure = useCallback(async () => {
    setStructureLoading(true)
    try {
      const res = await getFeeStructure({})
      setStructure(res.data?.feeStructure || [])
    } catch { toast('Failed to load fee structure', 'error') }
    finally { setStructureLoading(false) }
  }, [toast])

  const loadClasses = useCallback(async () => {
    try {
      const { default: api } = await import('../services/api')
      const r = await api.get('/academic/classes')
      setClasses(r.data?.classes || r.data || [])
    } catch {}
  }, [])

  const loadInvoices = useCallback(async () => {
    setInvLoading(true)
    try {
      const res = await listInvoices({
        classId: invClassId || undefined,
        status: invStatus !== 'all' ? invStatus : undefined,
        search: invSearch || undefined
      })
      setInvoices(res.data?.invoices || [])
    } catch { toast('Failed to load invoices', 'error') }
    finally { setInvLoading(false) }
  }, [invClassId, invStatus, invSearch, toast])

  // Fetch students for selected class in generate form
  useEffect(() => {
    if (!genForm.classId) {
      setClassStudents([])
      return
    }
    (async () => {
      try {
        const { default: api } = await import('../services/api')
        const r = await api.get(`/academic/students?classId=${genForm.classId}&limit=500`)
        setClassStudents(r.data?.students || [])
      } catch {
        setClassStudents([])
      }
    })()
  }, [genForm.classId])

  useEffect(() => { loadStructure(); loadClasses() }, [loadStructure, loadClasses])
  useEffect(() => { if (tab === 'invoices') loadInvoices() }, [tab, loadInvoices])

  // ── Handlers ───────────────────────────────────────────────
  const onCreateStructure = async (e) => {
    e.preventDefault()
    if (!newStruct.classId || !newStruct.feeType || !newStruct.amount) {
      return toast('Please fill in Class, Fee Type and Amount', 'error')
    }
    try {
      await createFeeStructure({
        classId: Number(newStruct.classId),
        feeType: newStruct.feeType,
        amount: Number(newStruct.amount),
        dueDate: newStruct.dueDate || null,
        academicYearId: newStruct.academicYearId ? Number(newStruct.academicYearId) : null,
      })
      setNewStruct(s => ({ ...s, amount: '', dueDate: '', academicYearId: '' }))
      await loadStructure()
      toast('Fee structure entry added!')
    } catch (err) { toast(err?.response?.data?.error || 'Could not save fee structure', 'error') }
  }

  const onDeleteStructure = async (id) => {
    if (!confirm('Delete this fee structure entry?')) return
    try {
      await deleteFeeStructure(id)
      await loadStructure()
      toast('Entry deleted')
    } catch { toast('Could not delete entry', 'error') }
  }

  const onGenerateInvoices = async (e) => {
    e.preventDefault()
    if (!genForm.classId && !genForm.studentId) {
      return toast('Select a class or enter a Student DB ID', 'error')
    }
    setGenLoading(true)
    try {
      const res = await generateInvoices({
        classId: genForm.classId ? Number(genForm.classId) : undefined,
        studentId: genForm.studentId ? Number(genForm.studentId) : undefined,
        academicYearId: genForm.academicYearId ? Number(genForm.academicYearId) : undefined,
        dueDate: genForm.dueDate || null,
      })
      const count = res.data?.invoices?.length || 0
      toast(`${count} invoice(s) generated successfully!`)
      setGenForm({ classId: '', studentId: '', academicYearId: '', dueDate: '' })
      await loadInvoices()
    } catch (err) { toast(err?.response?.data?.error || 'Could not generate invoices', 'error') }
    finally { setGenLoading(false) }
  }

  const openInvoice = async (inv) => {
    setSelectedInv(inv)
    setInvDetail(null)
    setDetailLoading(true)
    try {
      const r = await getInvoiceById(inv.id)
      setInvDetail(r.data)
      const due = r.data?.totalDue || 0
      setPayForm(f => ({ ...f, amountPaid: due > 0 ? String(due) : '', paymentMethod: 'cash', transactionId: '', remarks: '', collectedBy: '' }))
    } catch { toast('Could not load invoice details', 'error') }
    finally { setDetailLoading(false) }
  }

  const onRecordPayment = async (e) => {
    e.preventDefault()
    if (!selectedInv || !payForm.amountPaid) return toast('Enter amount to record', 'error')
    setPayLoading(true)
    try {
      const res = await recordPayment({
        invoiceId: selectedInv.id,
        amountPaid: Number(payForm.amountPaid),
        paymentMethod: payForm.paymentMethod,
        transactionId: payForm.transactionId || null,
        remarks: payForm.remarks || null,
        collectedBy: payForm.collectedBy || null,
      })
      toast(`Payment recorded! Status → ${res.data?.invoiceStatus?.toUpperCase()}`)
      await loadInvoices()
      await openInvoice(selectedInv)
    } catch (err) { toast(err?.response?.data?.error || 'Could not record payment', 'error') }
    finally { setPayLoading(false) }
  }

  const onPayOnline = async () => {
    if (!selectedInv) return
    setRzLoading(true)
    try {
      const loaded = await loadRazorpayScript()
      if (!loaded) return toast('Razorpay failed to load — check internet connection', 'error')
      const r = await createRazorpayOrder({ invoiceId: selectedInv.id })
      const { orderId, amount, currency } = r.data
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount, currency,
        name: 'School ERP',
        description: `Invoice #${selectedInv.invoice_number}`,
        order_id: orderId,
        handler: async (response) => {
          try {
            const vr = await verifyRazorpayPayment({
              invoiceId: selectedInv.id,
              razorpayOrderId:   response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            })
            toast(`✅ Online payment verified! Status → ${vr.data?.invoiceStatus?.toUpperCase()}`)
            await loadInvoices()
            await openInvoice(selectedInv)
          } catch { toast('Payment verification failed — contact support', 'error') }
        },
        prefill: {},
        theme: { color: '#2563eb' },
        modal: { ondismiss: () => toast('Payment cancelled', 'info') },
      }
      new window.Razorpay(options).open()
    } catch (err) { toast(err?.response?.data?.error || 'Could not initiate Razorpay', 'error') }
    finally { setRzLoading(false) }
  }

  const onPrintReceipt = (payment) => {
    setPrintData({ invoice: invDetail?.invoice, items: invDetail?.items, payment })
  }

  const loadReports = async () => {
    if (!dateRange.startDate || !dateRange.endDate) return toast('Select start and end dates', 'error')
    setReportLoading(true)
    try {
      const [byDay, byMethod, duesRes, defRes] = await Promise.all([
        collectionReport({ startDate: dateRange.startDate, endDate: dateRange.endDate, by: 'day' }),
        collectionReport({ startDate: dateRange.startDate, endDate: dateRange.endDate, by: 'method' }),
        duesReport({}),
        defaultersReport({}),
      ])
      setReports({
        collections: byDay.data?.data || [],
        byMethod:    byMethod.data?.data || [],
        dues:        duesRes.data?.data || [],
        defaulters:  defRes.data?.data || [],
      })
    } catch { toast('Could not load reports', 'error') }
    finally { setReportLoading(false) }
  }

  const loadLedger = async () => {
    if (!ledgerStudentId) return toast('Enter a Student DB ID', 'error')
    setLedgerLoading(true)
    try {
      const r = await getStudentLedger(ledgerStudentId)
      setLedger(r.data)
    } catch (err) { toast(err?.response?.data?.error || 'Student not found', 'error') }
    finally { setLedgerLoading(false) }
  }

  // ── Computed ───────────────────────────────────────────────
  const detailInv      = invDetail?.invoice    || {}
  const detailItems    = invDetail?.items       || []
  const detailPayments = invDetail?.payments    || []
  const totalPaid      = invDetail?.totalPaid   || 0
  const totalDue       = invDetail?.totalDue    || 0
  const totalBilled    = safe(detailInv.total_amount) + safe(detailInv.late_fee)

  const filteredInvoices = useMemo(() => {
    if (!invSearch) return invoices
    const q = invSearch.toLowerCase()
    return invoices.filter(i =>
      (i.student_name || '').toLowerCase().includes(q) ||
      (i.student_number || '').toLowerCase().includes(q) ||
      (i.invoice_number || '').toLowerCase().includes(q)
    )
  }, [invoices, invSearch])

  // ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Fee Management</h1>
        <p className="text-sm text-gray-500 mt-1">Manage fee structures, generate invoices, collect payments & view student ledgers</p>
      </div>

      {/* ── Tab Navigation ── */}
      <div className="flex gap-2 flex-wrap bg-gray-100 p-1.5 rounded-xl w-fit">
        {[
          { key: 'structure', label: '🏷 Fee Structure' },
          { key: 'invoices',  label: '📄 Invoices & Payments' },
          { key: 'ledger',    label: '📒 Student Ledger' },
          { key: 'reports',   label: '📊 Reports' },
        ].map(t => (
          <Tab key={t.key} active={tab === t.key} onClick={() => setTab(t.key)}>{t.label}</Tab>
        ))}
      </div>

      {/* ══════════════════════════════════════════════
          TAB 1 — FEE STRUCTURE
      ══════════════════════════════════════════════ */}
      {tab === 'structure' && (
        <div className="space-y-6">
          {/* Add structure */}
          <div className="card">
            <div className="section-header">➕ Add Fee Structure Entry</div>
            <form onSubmit={onCreateStructure} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div>
                <label className="label">Class</label>
                <select className="input" value={newStruct.classId} onChange={e => setNewStruct(s => ({ ...s, classId: e.target.value }))} required>
                  <option value="">Select Class</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name} {c.section || ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Fee Type</label>
                <select className="input" value={newStruct.feeType} onChange={e => setNewStruct(s => ({ ...s, feeType: e.target.value }))}>
                  {FEE_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Amount (₹)</label>
                <input type="number" className="input" placeholder="e.g. 5000" min="0" step="0.01"
                  value={newStruct.amount} onChange={e => setNewStruct(s => ({ ...s, amount: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Due Date</label>
                <input type="date" className="input" value={newStruct.dueDate} onChange={e => setNewStruct(s => ({ ...s, dueDate: e.target.value }))} />
              </div>
              <div>
                <label className="label">Academic Year ID</label>
                <input type="number" className="input" placeholder="Optional" value={newStruct.academicYearId}
                  onChange={e => setNewStruct(s => ({ ...s, academicYearId: e.target.value }))} />
              </div>
              <div className="flex items-end">
                <button type="submit" className="btn btn-primary w-full">Add Entry</button>
              </div>
            </form>
          </div>

          {/* Structure table */}
          <div className="card">
            <div className="section-header">📋 Configured Fee Structure</div>
            {structureLoading ? (
              <div className="text-center py-8 text-gray-400">Loading…</div>
            ) : structure.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <div className="text-4xl mb-3">🏷</div>
                <div className="font-medium">No fee structure entries yet.</div>
                <div className="text-sm mt-1">Add entries above to configure fees per class.</div>
              </div>
            ) : (
              <div className="overflow-auto">
                <table className="table-modern w-full">
                  <thead>
                    <tr>
                      <th>Class</th><th>Fee Type</th><th>Amount</th><th>Due Date</th><th>Acad. Year</th><th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {structure.map(r => (
                      <tr key={r.id}>
                        <td className="font-medium">{r.class_name || `Class #${r.class_id}`} {r.section || ''}</td>
                        <td>
                          <span className="badge bg-blue-50 text-blue-700 border border-blue-200">{r.fee_type}</span>
                        </td>
                        <td className="font-bold text-gray-900">{fmtAmount(r.amount)}</td>
                        <td>{r.due_date ? r.due_date.slice(0,10) : '—'}</td>
                        <td>{r.academic_year_id || '—'}</td>
                        <td>
                          <button onClick={() => onDeleteStructure(r.id)} className="text-xs text-red-500 hover:text-red-700 font-medium">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          TAB 2 — INVOICES & PAYMENTS
      ══════════════════════════════════════════════ */}
      {tab === 'invoices' && (
        <div className="space-y-6">
          {/* Generate invoices */}
          <div className="card">
            <div className="section-header">⚡ Generate Invoices</div>
            <p className="text-sm text-gray-500 mb-4">Select a class to generate invoices for all students in that class, or pick an individual student from the dropdown. If the due date is in the past, a ₹50 late fine will be added automatically.</p>
            <form onSubmit={onGenerateInvoices} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              <div>
                <label className="label">Class</label>
                <select className="input" value={genForm.classId} onChange={e => setGenForm(s => ({ ...s, classId: e.target.value, studentId: '' }))}>
                  <option value="">— Select Class —</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name} {c.section || ''}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Student</label>
                {genForm.classId && classStudents.length > 0 ? (
                  <select className="input" value={genForm.studentId} onChange={e => setGenForm(s => ({ ...s, studentId: e.target.value }))}>
                    <option value="">— All Students in Class ({classStudents.length}) —</option>
                    {classStudents.map(st => (
                      <option key={st.id} value={st.id}>
                        {st.name} {st.roll_number ? `(Roll #${st.roll_number})` : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input className="input" placeholder="Enter Student DB ID" value={genForm.studentId}
                    onChange={e => setGenForm(s => ({ ...s, studentId: e.target.value }))} />
                )}
              </div>
              <div>
                <label className="label">Academic Year ID</label>
                <input type="number" className="input" placeholder="Optional" value={genForm.academicYearId}
                  onChange={e => setGenForm(s => ({ ...s, academicYearId: e.target.value }))} />
              </div>
              <div>
                <label className="label">Due Date</label>
                <input type="date" className="input" value={genForm.dueDate}
                  onChange={e => setGenForm(s => ({ ...s, dueDate: e.target.value }))} />
              </div>
              <div className="flex items-end">
                <button type="submit" disabled={genLoading} className="btn btn-primary w-full">
                  {genLoading ? 'Generating…' : 'Generate'}
                </button>
              </div>
            </form>
          </div>

          {/* Invoice list */}
          <div className="card">
            <div className="section-header">📄 All Invoices</div>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <input
                className="input max-w-xs"
                placeholder="Search by student name, ID or invoice #"
                value={invSearch}
                onChange={e => setInvSearch(e.target.value)}
              />
              <select
                className="input max-w-xs font-medium"
                value={invClassId}
                onChange={e => setInvClassId(e.target.value)}
              >
                <option value="">— All Classes —</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.section ? `(${c.section})` : ''}
                  </option>
                ))}
              </select>
              <div className="flex gap-1.5">
                {['all','unpaid','partial','paid'].map(s => (
                  <button key={s} onClick={() => setInvStatus(s)}
                    className={`btn text-xs ${invStatus === s ? 'btn-primary' : 'btn-outline'}`}>
                    {s.charAt(0).toUpperCase()+s.slice(1)}
                  </button>
                ))}
              </div>
              <button onClick={loadInvoices} className="btn btn-outline ml-auto">🔄 Refresh</button>
            </div>

            {invLoading ? (
              <div className="text-center py-10 text-gray-400">Loading invoices…</div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <div className="text-4xl mb-3">📄</div>
                <div className="font-medium">No invoices found.</div>
                <div className="text-sm mt-1">Select a class or generate invoices above to get started.</div>
              </div>
            ) : (
              <div className="overflow-auto">
                <table className="table-modern w-full">
                  <thead>
                    <tr>
                      <th>Invoice #</th><th>Student</th><th>Class</th><th>Total</th><th>Paid</th><th>Due</th><th>Status</th><th>Date</th><th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map(inv => {
                      const total = safe(inv.total_amount) + safe(inv.late_fee)
                      const paid  = safe(inv.amount_paid)
                      const due   = Math.max(0, total - paid)
                      return (
                        <tr key={inv.id} className={selectedInv?.id === inv.id ? 'bg-blue-50' : ''}>
                          <td className="font-mono text-xs font-semibold">{inv.invoice_number}</td>
                          <td>
                            <div className="font-medium">{inv.student_name}</div>
                            <div className="text-xs text-gray-500">
                              {inv.roll_number ? `Roll #${inv.roll_number} · ` : ''}{inv.student_number}
                            </div>
                          </td>
                          <td className="text-xs font-medium">{inv.class_name} {inv.section || ''}</td>
                          <td className="font-bold">{fmtAmount(total)}</td>
                          <td className="text-emerald-700 font-medium">{fmtAmount(paid)}</td>
                          <td className={`font-bold ${due > 0 ? 'text-red-600' : 'text-gray-400'}`}>{fmtAmount(due)}</td>
                          <td>
                            <span className={`badge border ${statusColor(inv.status)}`}>
                              {(inv.status || 'unpaid').toUpperCase()}
                            </span>
                          </td>
                          <td className="text-xs text-gray-400">{fmt(inv.invoice_date)}</td>
                          <td>
                            <div className="flex gap-2 justify-end">
                              {due > 0 && (
                                <button
                                  onClick={() => openInvoice(inv)}
                                  className="btn btn-primary text-xs py-1.5 px-3 flex items-center gap-1 font-semibold"
                                >
                                  💵 Collect Cash
                                </button>
                              )}
                              <button onClick={() => openInvoice(inv)} className="btn btn-outline text-xs py-1.5 px-3">
                                View
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Invoice Detail Panel */}
          {selectedInv && (
            <div className="card border-2 border-blue-100 animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="font-bold text-lg text-gray-900">Invoice: {selectedInv.invoice_number}</div>
                  <div className="text-sm text-gray-500">
                    {detailInv.student_name} ({detailInv.student_number}) &nbsp;·&nbsp;
                    {detailInv.class_name} {detailInv.section}
                  </div>
                </div>
                <button onClick={() => { setSelectedInv(null); setInvDetail(null) }} className="text-gray-400 hover:text-gray-700 text-xl">✕</button>
              </div>

              {detailLoading ? (
                <div className="text-center py-8 text-gray-400">Loading details…</div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left: Fee breakdown + summary */}
                  <div>
                    <div className="font-semibold text-sm text-gray-700 mb-2">Fee Breakdown</div>
                    <div className="border border-gray-100 rounded-lg overflow-hidden mb-4">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr><th className="text-left px-3 py-2 text-xs text-gray-500">Type</th><th className="text-right px-3 py-2 text-xs text-gray-500">Amount</th></tr>
                        </thead>
                        <tbody>
                          {detailItems.map(it => (
                            <tr key={it.id} className="border-t border-gray-100">
                              <td className="px-3 py-2">{it.fee_type}</td>
                              <td className="px-3 py-2 text-right font-medium">{fmtAmount(it.amount)}</td>
                            </tr>
                          ))}
                          <tr className="border-t border-gray-200 bg-gray-50">
                            <td className="px-3 py-2 font-bold">Total Billed</td>
                            <td className="px-3 py-2 text-right font-bold">{fmtAmount(totalBilled)}</td>
                          </tr>
                          <tr className="bg-emerald-50">
                            <td className="px-3 py-2 font-bold text-emerald-700">Total Paid</td>
                            <td className="px-3 py-2 text-right font-bold text-emerald-700">{fmtAmount(totalPaid)}</td>
                          </tr>
                          <tr className={totalDue > 0 ? 'bg-red-50' : 'bg-gray-50'}>
                            <td className={`px-3 py-2 font-bold ${totalDue > 0 ? 'text-red-700' : 'text-gray-500'}`}>Balance Due</td>
                            <td className={`px-3 py-2 text-right font-bold ${totalDue > 0 ? 'text-red-700' : 'text-gray-500'}`}>{fmtAmount(totalDue)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Payment history */}
                    <div className="font-semibold text-sm text-gray-700 mb-2">Payment History</div>
                    {detailPayments.length === 0 ? (
                      <div className="text-sm text-gray-400 italic">No payments recorded yet.</div>
                    ) : (
                      <div className="space-y-2">
                        {detailPayments.map(p => (
                          <div key={p.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg bg-gray-50">
                            <div>
                              <div className="font-medium text-sm">{fmtAmount(p.amount_paid)} — {(p.payment_method || '').toUpperCase()}</div>
                              <div className="text-xs text-gray-400">{fmt(p.payment_date)} &nbsp;·&nbsp; {p.receipt_number}</div>
                              {p.remarks && <div className="text-xs text-gray-400 italic">{p.remarks}</div>}
                            </div>
                            <button
                              onClick={() => onPrintReceipt(p)}
                              className="btn btn-outline text-xs py-1 px-2.5 ml-3 whitespace-nowrap"
                            >
                              🖨 Receipt
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right: Record payment */}
                  <div>
                    {/* Cash / Offline Payment */}
                    <div className="border border-gray-200 rounded-xl p-4 mb-4">
                      <div className="font-semibold text-sm text-gray-800 mb-3">💵 Record Cash / Offline Payment</div>
                      <form onSubmit={onRecordPayment} className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="label">Amount (₹)</label>
                            <input type="number" className="input" step="0.01" min="0"
                              placeholder={`Max: ${fmtAmount(totalDue)}`}
                              value={payForm.amountPaid}
                              onChange={e => setPayForm(f => ({ ...f, amountPaid: e.target.value }))} />
                          </div>
                          <div>
                            <label className="label">Payment Method</label>
                            <select className="input" value={payForm.paymentMethod}
                              onChange={e => setPayForm(f => ({ ...f, paymentMethod: e.target.value }))}>
                              {PAY_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="label">Transaction / Cheque / DD Reference</label>
                          <input className="input" placeholder="Optional reference number"
                            value={payForm.transactionId}
                            onChange={e => setPayForm(f => ({ ...f, transactionId: e.target.value }))} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="label">Collected By</label>
                            <input className="input" placeholder="Admin / Staff name"
                              value={payForm.collectedBy}
                              onChange={e => setPayForm(f => ({ ...f, collectedBy: e.target.value }))} />
                          </div>
                          <div>
                            <label className="label">Remarks</label>
                            <input className="input" placeholder="Optional note"
                              value={payForm.remarks}
                              onChange={e => setPayForm(f => ({ ...f, remarks: e.target.value }))} />
                          </div>
                        </div>
                        <button type="submit" disabled={payLoading || totalDue <= 0}
                          className="btn btn-secondary w-full">
                          {payLoading ? 'Recording…' : totalDue <= 0 ? '✅ Fully Paid' : `Record ${payForm.paymentMethod === 'cash' ? 'Cash' : ''} Payment`}
                        </button>
                      </form>
                    </div>

                    {/* Razorpay Online */}
                    {canUseRazor && (
                      <div className="border border-blue-200 rounded-xl p-4 bg-blue-50">
                        <div className="font-semibold text-sm text-blue-900 mb-1">💳 Online Payment via Razorpay</div>
                        <div className="text-xs text-blue-600 mb-3">Running in Test Mode — use test cards to simulate payment</div>
                        <button
                          onClick={onPayOnline}
                          disabled={rzLoading || totalDue <= 0}
                          className="btn btn-primary w-full"
                        >
                          {rzLoading ? 'Opening Razorpay…' : `Pay ${fmtAmount(totalDue)} Online`}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════
          TAB 3 — STUDENT LEDGER
      ══════════════════════════════════════════════ */}
      {tab === 'ledger' && (
        <div className="space-y-6">
          <div className="card">
            <div className="section-header">📒 Student Fee Ledger</div>
            <p className="text-sm text-gray-500 mb-4">View complete fee history, payment records, and outstanding balance for any student.</p>
            <div className="flex gap-3 items-end">
              <div className="flex-1 max-w-xs">
                <label className="label">Student DB ID</label>
                <input className="input" placeholder="Enter Student DB ID (e.g. 42)"
                  value={ledgerStudentId}
                  onChange={e => setLedgerStudentId(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && loadLedger()} />
              </div>
              <button onClick={loadLedger} disabled={ledgerLoading} className="btn btn-primary">
                {ledgerLoading ? 'Loading…' : '🔍 View Ledger'}
              </button>
              {ledger && <button onClick={() => setLedger(null)} className="btn btn-outline">Clear</button>}
            </div>
          </div>

          {ledger && (
            <div className="animate-fade-in space-y-5">
              {/* Student Info + Summary */}
              <div className="card">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                    {(ledger.student?.student_name || 'S').charAt(0)}
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-900">{ledger.student?.student_name}</div>
                    <div className="text-sm text-gray-500">
                      {ledger.student?.student_number} &nbsp;·&nbsp;
                      {ledger.student?.class_name} {ledger.student?.section}
                    </div>
                    <div className="text-xs text-gray-400">{ledger.student?.email}</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Total Billed',     value: fmtAmount(ledger.summary?.totalBilled),  color: 'bg-blue-50 border-blue-200 text-blue-800' },
                    { label: 'Total Paid',        value: fmtAmount(ledger.summary?.totalPaid),   color: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
                    { label: 'Outstanding Due',   value: fmtAmount(ledger.summary?.totalDue),    color: 'bg-red-50 border-red-200 text-red-800' },
                  ].map(s => (
                    <div key={s.label} className={`border rounded-xl p-3 text-center ${s.color}`}>
                      <div className="text-xl font-extrabold">{s.value}</div>
                      <div className="text-xs font-medium mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Invoice + Payment table */}
              {ledger.invoices?.length === 0 ? (
                <div className="card text-center py-10 text-gray-400">No invoices found for this student.</div>
              ) : (
                ledger.invoices?.map(inv => {
                  const items = ledger.items?.[inv.id] || []
                  const invPayments = ledger.payments?.filter(p => p.invoice_id === inv.id) || []
                  const total = safe(inv.total_amount) + safe(inv.late_fee)
                  const paid = invPayments.reduce((s, p) => s + safe(p.amount_paid), 0)
                  const due = Math.max(0, total - paid)
                  return (
                    <div key={inv.id} className="card border border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="font-mono text-sm font-bold text-gray-800">{inv.invoice_number}</div>
                          <div className="text-xs text-gray-400">Due: {fmt(inv.due_date)} &nbsp;·&nbsp; Issued: {fmt(inv.invoice_date)}</div>
                        </div>
                        <span className={`badge border ${statusColor(inv.status)}`}>{(inv.status || '').toUpperCase()}</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Items */}
                        <div>
                          <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Fee Items</div>
                          {items.map((it, i) => (
                            <div key={i} className="flex justify-between text-sm py-1 border-b border-gray-100 last:border-0">
                              <span>{it.fee_type}</span>
                              <span className="font-medium">{fmtAmount(it.amount)}</span>
                            </div>
                          ))}
                          <div className="flex justify-between text-sm font-bold pt-1 mt-1 border-t border-gray-200">
                            <span>Total</span><span>{fmtAmount(total)}</span>
                          </div>
                        </div>

                        {/* Payments */}
                        <div>
                          <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Payments</div>
                          {invPayments.length === 0 ? (
                            <div className="text-sm text-gray-400 italic">No payments yet.</div>
                          ) : invPayments.map((p, i) => (
                            <div key={i} className="flex justify-between items-start text-sm py-1 border-b border-gray-100 last:border-0">
                              <div>
                                <div className="font-medium text-emerald-700">{fmtAmount(p.amount_paid)}</div>
                                <div className="text-xs text-gray-400">{fmt(p.payment_date)} · {(p.payment_method||'').toUpperCase()}</div>
                                {p.receipt_number && <div className="text-xs text-gray-400">{p.receipt_number}</div>}
                              </div>
                              <button onClick={() => setPrintData({ invoice: { ...inv, student_name: ledger.student?.student_name, student_number: ledger.student?.student_number }, items, payment: p })}
                                className="text-xs text-blue-600 hover:text-blue-800 ml-2 whitespace-nowrap">🖨 Receipt</button>
                            </div>
                          ))}
                          <div className="flex justify-between text-sm font-bold pt-1 mt-1 border-t border-gray-200">
                            <span className={due > 0 ? 'text-red-600' : 'text-emerald-600'}>
                              {due > 0 ? `Balance Due` : 'Fully Paid'}
                            </span>
                            <span className={due > 0 ? 'text-red-600' : 'text-emerald-600'}>{fmtAmount(due)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════
          TAB 4 — REPORTS
      ══════════════════════════════════════════════ */}
      {tab === 'reports' && (
        <div className="space-y-6">
          <div className="card">
            <div className="section-header">📊 Collection Report</div>
            <div className="flex flex-wrap gap-3 items-end mb-4">
              <div>
                <label className="label">From</label>
                <input type="date" className="input" value={dateRange.startDate}
                  onChange={e => setDateRange(s => ({ ...s, startDate: e.target.value }))} />
              </div>
              <div>
                <label className="label">To</label>
                <input type="date" className="input" value={dateRange.endDate}
                  onChange={e => setDateRange(s => ({ ...s, endDate: e.target.value }))} />
              </div>
              <button onClick={loadReports} disabled={reportLoading} className="btn btn-primary">
                {reportLoading ? 'Loading…' : 'Load Reports'}
              </button>
            </div>

            {reports && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                {/* Daily collections */}
                <div>
                  <div className="font-semibold text-sm text-gray-700 mb-2">📅 Daily Collections</div>
                  {reports.collections.length === 0 ? (
                    <div className="text-sm text-gray-400 italic">No data for this period.</div>
                  ) : (
                    <table className="table-modern w-full">
                      <thead><tr><th>Date</th><th>Amount Collected</th></tr></thead>
                      <tbody>
                        {reports.collections.map(r => (
                          <tr key={r.date}>
                            <td>{r.date?.slice(0,10)}</td>
                            <td className="font-bold text-emerald-700">{fmtAmount(r.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* By method */}
                <div>
                  <div className="font-semibold text-sm text-gray-700 mb-2">💳 By Payment Method</div>
                  {reports.byMethod.length === 0 ? (
                    <div className="text-sm text-gray-400 italic">No data for this period.</div>
                  ) : (
                    <table className="table-modern w-full">
                      <thead><tr><th>Method</th><th>Total</th></tr></thead>
                      <tbody>
                        {reports.byMethod.map(r => (
                          <tr key={r.payment_method}>
                            <td>{(r.payment_method || 'unknown').toUpperCase()}</td>
                            <td className="font-bold">{fmtAmount(r.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Outstanding dues */}
                <div>
                  <div className="font-semibold text-sm text-gray-700 mb-2">⚠️ Outstanding Dues</div>
                  {reports.dues.filter(r => safe(r.due) > 0).length === 0 ? (
                    <div className="text-sm text-gray-400 italic">No outstanding dues.</div>
                  ) : (
                    <table className="table-modern w-full">
                      <thead><tr><th>Student</th><th>Class</th><th>Due</th></tr></thead>
                      <tbody>
                        {reports.dues.filter(r => safe(r.due) > 0).map(r => (
                          <tr key={r.student_id}>
                            <td>
                              <div className="font-medium">{r.student_name}</div>
                              <div className="text-xs text-gray-400">{r.student_number}</div>
                            </td>
                            <td className="text-xs">{r.class_name} {r.section}</td>
                            <td className="font-bold text-red-600">{fmtAmount(r.due)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Defaulters */}
                <div>
                  <div className="font-semibold text-sm text-gray-700 mb-2">🚨 Defaulters</div>
                  {reports.defaulters.length === 0 ? (
                    <div className="text-sm text-gray-400 italic">No defaulters.</div>
                  ) : (
                    <table className="table-modern w-full">
                      <thead><tr><th>Student</th><th>Class</th><th>Overdue</th></tr></thead>
                      <tbody>
                        {reports.defaulters.map(r => (
                          <tr key={r.student_id}>
                            <td>
                              <div className="font-medium">{r.student_name}</div>
                              <div className="text-xs text-gray-400">{r.student_number}</div>
                            </td>
                            <td className="text-xs">{r.class_name} {r.section}</td>
                            <td className="font-bold text-red-700">{fmtAmount(r.due)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Print Receipt Modal ── */}
      {printData && (
        <PrintReceiptModal
          invoice={printData.invoice}
          items={printData.items}
          payment={printData.payment}
          onClose={() => setPrintData(null)}
        />
      )}

      {/* ── Toast Notifications ── */}
      <Toast toasts={toasts} />
    </div>
  )
}
