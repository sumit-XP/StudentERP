import { useEffect, useMemo, useState } from 'react'
import {
  getFeeStructure,
  createFeeStructure,
  generateInvoices,
  listInvoices,
  getInvoiceById,
  recordPayment,
  createRazorpayOrder,
  verifyRazorpayPayment,
  collectionReport,
  duesReport,
  defaultersReport,
  listDeposits,
  createDeposit,
  refundDeposit,
} from '../services/fees'

// ── helpers ────────────────────────────────────────────────
const safe = (n) => Number(n) || 0
const fmt  = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—'

// ── Mock data ───────────────────────────────────────────────
const MOCK_STRUCTURE = [
  { id: 1, class_id: 'Class X-A',  fee_type: 'Tuition Fee',   amount: 18000, due_date: '2026-07-15' },
  { id: 2, class_id: 'Class X-A',  fee_type: 'Sports Fee',    amount:  3000, due_date: '2026-07-15' },
  { id: 3, class_id: 'Class X-A',  fee_type: 'Library Fee',   amount:  2000, due_date: '2026-07-15' },
  { id: 4, class_id: 'Class X-A',  fee_type: 'Lab Fee',       amount:  4000, due_date: '2026-07-15' },
  { id: 5, class_id: 'Class X-A',  fee_type: 'Transport Fee', amount:  5000, due_date: '2026-07-15' },
  { id: 6, class_id: 'Class IX-B', fee_type: 'Tuition Fee',   amount: 16000, due_date: '2026-07-15' },
  { id: 7, class_id: 'Class IX-B', fee_type: 'Sports Fee',    amount:  2500, due_date: '2026-07-15' },
]

const MOCK_INVOICES = [
  { id: 'i1', invoice_number: 'INV-2026-0041', student_name: 'Aarav Sharma',  student_number: 'STU1001', total_amount: 32000, late_fee: 0,   status: 'unpaid',  due_date: '2026-07-15' },
  { id: 'i2', invoice_number: 'INV-2026-0040', student_name: 'Priya Patel',   student_number: 'STU1002', total_amount: 32000, late_fee: 500, status: 'partial', due_date: '2026-07-15' },
  { id: 'i3', invoice_number: 'INV-2026-0039', student_name: 'Rohan Mehta',   student_number: 'STU1003', total_amount: 32000, late_fee: 0,   status: 'paid',    due_date: '2026-07-15' },
  { id: 'i4', invoice_number: 'INV-2026-0038', student_name: 'Sneha Reddy',   student_number: 'STU1004', total_amount: 32000, late_fee: 500, status: 'unpaid',  due_date: '2026-07-15' },
  { id: 'i5', invoice_number: 'INV-2026-0037', student_name: 'Karan Singh',   student_number: 'STU1005', total_amount: 28500, late_fee: 0,   status: 'paid',    due_date: '2026-07-15' },
]

const MOCK_DEPOSITS = [
  { id: 1, student_name: 'Aarav Sharma', student_number: 'STU1001', amount: 5000, received_at: '2026-04-01', refunded_amount: 0 },
  { id: 2, student_name: 'Priya Patel',  student_number: 'STU1002', amount: 5000, received_at: '2026-04-01', refunded_amount: 0 },
  { id: 3, student_name: 'Rohan Mehta',  student_number: 'STU1003', amount: 5000, received_at: '2026-04-01', refunded_amount: 5000 },
]

// build mock invoice detail from an invoice row
const mockDetail = (inv) => ({
  invoice: { ...inv, late_fee: safe(inv.late_fee) },
  items: [
    { id: 1, fee_type: 'Tuition Fee',   amount: safe(inv.total_amount) * 0.5625  },
    { id: 2, fee_type: 'Sports Fee',    amount: safe(inv.total_amount) * 0.09375 },
    { id: 3, fee_type: 'Library Fee',   amount: safe(inv.total_amount) * 0.0625  },
    { id: 4, fee_type: 'Lab Fee',       amount: safe(inv.total_amount) * 0.125   },
    { id: 5, fee_type: 'Transport Fee', amount: safe(inv.total_amount) * 0.15625 },
  ],
  payments: inv.status === 'paid'
    ? [{ id: 1, amount_paid: safe(inv.total_amount), payment_method: 'online', payment_date: inv.due_date, receipt_number: 'RCP-DEMO-001' }]
    : [],
})

// ── Parent Payment Preview demo ─────────────────────────────
const PARENT_DEMO_INVOICES = [
  { id: 'p1', invoice_number: 'INV-2026-0041', student_name: 'Aarav Sharma', class_name: 'Class X', section: 'A', total_amount: 32000, status: 'unpaid', due_date: '2026-07-15' },
  { id: 'p2', invoice_number: 'INV-2026-0019', student_name: 'Aarav Sharma', class_name: 'Class X', section: 'A', total_amount: 32000, status: 'paid',   due_date: '2026-04-10' },
  { id: 'p3', invoice_number: 'INV-2026-0008', student_name: 'Aarav Sharma', class_name: 'Class X', section: 'A', total_amount: 32000, status: 'paid',   due_date: '2026-01-10' },
]

function ParentPaymentPreview() {
  const [list, setList]         = useState(PARENT_DEMO_INVOICES)
  const [modal, setModal]       = useState(null)
  const [step, setStep]         = useState(0)
  const [method, setMethod]     = useState('')

  const SC = { paid: 'bg-green-100 text-green-800', partial: 'bg-yellow-100 text-yellow-800', unpaid: 'bg-red-100 text-red-800' }

  const openModal  = (inv) => { setModal(inv); setStep(0); setMethod('') }
  const closeModal = ()    => { setModal(null); setStep(0); setMethod('') }
  const handlePay  = ()    => {
    if (!method) return
    setStep(1)
    setTimeout(() => {
      setStep(2)
      setList(prev => prev.map(i => i.id === modal.id ? { ...i, status: 'paid' } : i))
    }, 2200)
  }

  return (
    <div className="card mb-6 border-2 border-blue-100">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white text-lg">👪</div>
        <div>
          <div className="text-lg font-bold text-gray-800">Parent Payment Portal Preview</div>
          <div className="text-xs text-gray-500">This is how parents view and pay fees online — demo mode</div>
        </div>
        <span className="ml-auto px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">Demo</span>
      </div>

      {/* summary */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Total Due',  value: '₹32,000', color: 'bg-red-50 border-red-200 text-red-700' },
          { label: 'Total Paid', value: '₹64,000', color: 'bg-green-50 border-green-200 text-green-700' },
          { label: 'Invoices',   value: '3',        color: 'bg-blue-50 border-blue-200 text-blue-700' },
        ].map(s => (
          <div key={s.label} className={`border rounded-xl p-3 text-center ${s.color}`}>
            <div className="text-xl font-extrabold">{s.value}</div>
            <div className="text-xs font-medium mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* invoice rows */}
      <div className="space-y-3">
        {list.map(inv => (
          <div key={inv.id} className="border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="font-mono text-sm font-semibold text-gray-800">{inv.invoice_number}</div>
              <div className="text-xs text-gray-500 mt-0.5">
                {inv.student_name} · {inv.class_name} {inv.section} · Due {fmt(inv.due_date)}
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <div className="font-bold text-gray-900">₹{safe(inv.total_amount).toLocaleString('en-IN')}</div>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${SC[inv.status] || 'bg-gray-100 text-gray-700'}`}>
                  {inv.status.toUpperCase()}
                </span>
              </div>
              {inv.status !== 'paid' ? (
                <button onClick={() => openModal(inv)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap">
                  Pay Now
                </button>
              ) : (
                <span className="px-3 py-2 text-green-600 text-sm font-semibold">✓ Paid</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* how-to */}
      <div className="mt-5 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="font-semibold text-blue-900 text-sm mb-2">📋 How Parents Make a Payment</div>
        <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
          <li>Log in to the Parent Portal and navigate to <strong>Fee Payments</strong>.</li>
          <li>Enter your child's Student ID to view all pending invoices.</li>
          <li>Click <strong>Pay Now</strong> next to the unpaid invoice.</li>
          <li>Choose a payment method: UPI / QR, Credit/Debit Card, Net Banking, or Wallet.</li>
          <li>Confirm the payment — a receipt is emailed instantly.</li>
        </ol>
      </div>

      {/* payment modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            {step === 0 && (
              <>
                <div className="text-lg font-bold mb-1">Parent Fee Payment</div>
                <div className="text-xs text-gray-500 mb-1 font-mono">{modal.invoice_number}</div>
                <div className="text-xs text-gray-400 mb-4">{modal.student_name} · {modal.class_name} {modal.section}</div>
                <div className="text-2xl font-extrabold text-blue-600 mb-5 text-center">
                  ₹{safe(modal.total_amount).toLocaleString('en-IN')}
                </div>
                <div className="text-sm font-semibold text-gray-700 mb-3">Select Payment Method</div>
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {[
                    { key: 'upi',     label: 'UPI / QR',     emoji: '📱' },
                    { key: 'card',    label: 'Credit/Debit',  emoji: '💳' },
                    { key: 'netbank', label: 'Net Banking',   emoji: '🏦' },
                    { key: 'wallet',  label: 'Wallet',        emoji: '👛' },
                  ].map(m => (
                    <button
                      key={m.key}
                      onClick={() => setMethod(m.key)}
                      className={`flex flex-col items-center gap-1 p-3 border-2 rounded-xl text-sm font-medium transition-all
                        ${method === m.key ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-blue-300'}`}
                    >
                      <span className="text-2xl">{m.emoji}</span>
                      {m.label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button onClick={closeModal} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
                  <button onClick={handlePay} disabled={!method} className="flex-1 py-2.5 bg-blue-600 disabled:bg-blue-300 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
                    Proceed to Pay
                  </button>
                </div>
              </>
            )}
            {step === 1 && (
              <div className="py-8 text-center space-y-4">
                <div className="w-14 h-14 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <div className="font-semibold text-gray-700">Processing payment…</div>
                <div className="text-xs text-gray-400">Please do not close this window</div>
              </div>
            )}
            {step === 2 && (
              <div className="py-4 text-center space-y-3">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-3xl">✅</span>
                </div>
                <div className="text-xl font-bold text-gray-800">Payment Successful!</div>
                <div className="text-sm text-gray-500">₹{safe(modal.total_amount).toLocaleString('en-IN')} paid for {modal.invoice_number}</div>
                <div className="text-xs text-gray-400">A receipt has been sent to the registered email address.</div>
                <button onClick={closeModal} className="mt-2 w-full py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700">Done</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Section wrapper ──────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div className="card mb-6">
      <div className="text-lg font-semibold mb-3">{title}</div>
      {children}
    </div>
  )
}

// ════════════════════════════════════════════════════════════
//  MAIN FEES PAGE
// ════════════════════════════════════════════════════════════
export default function Fees() {
  const [structure,       setStructure]       = useState([])
  const [invoices,        setInvoices]        = useState([])
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [invoiceDetails,  setInvoiceDetails]  = useState(null)
  const [reports,         setReports]         = useState({ collections: [], dues: [], defaulters: [], byMethod: [] })
  const [deposits,        setDeposits]        = useState([])

  const [newStruct,    setNewStruct]    = useState({ classId: '', feeType: '', amount: '', dueDate: '', academicYearId: '' })
  const [genInv,       setGenInv]       = useState({ classId: '', studentId: '', academicYearId: '', dueDate: '' })
  const [pay,          setPay]          = useState({ amountPaid: '', paymentMethod: 'cash', transactionId: '' })
  const [depositForm,  setDepositForm]  = useState({ studentId: '', amount: '', receivedAt: '' })
  const [refundForm,   setRefundForm]   = useState({ id: '', amount: '' })
  const [dateRange,    setDateRange]    = useState({ startDate: '', endDate: '' })

  const canUseRazor = useMemo(() => !!import.meta.env.VITE_RAZORPAY_KEY_ID, [])

  // ── loaders (never throw) ──────────────────────────────────
  const loadStructure = async () => {
    try {
      const res  = await getFeeStructure({})
      const data = res.data?.feeStructure || []
      setStructure(data.length > 0 ? data : MOCK_STRUCTURE)
    } catch { setStructure(MOCK_STRUCTURE) }
  }

  const loadInvoices = async () => {
    try {
      const res  = await listInvoices({})
      const data = res.data?.invoices || []
      setInvoices(data.length > 0 ? data : MOCK_INVOICES)
    } catch { setInvoices(MOCK_INVOICES) }
  }

  const loadDeposits = async () => {
    try {
      const res  = await listDeposits({})
      const data = res.data?.deposits || []
      setDeposits(data.length > 0 ? data : MOCK_DEPOSITS)
    } catch { setDeposits(MOCK_DEPOSITS) }
  }

  useEffect(() => { loadStructure(); loadInvoices(); loadDeposits() }, [])

  // ── handlers (never throw) ─────────────────────────────────
  const onCreateStructure = async (e) => {
    e.preventDefault()
    try {
      await createFeeStructure({
        classId: Number(newStruct.classId),
        feeType: newStruct.feeType,
        amount: Number(newStruct.amount),
        dueDate: newStruct.dueDate || null,
        academicYearId: newStruct.academicYearId ? Number(newStruct.academicYearId) : null,
      })
      setNewStruct({ classId: '', feeType: '', amount: '', dueDate: '', academicYearId: '' })
      await loadStructure()
    } catch { alert('Could not save fee structure — backend unavailable.') }
  }

  const onGenerateInvoices = async (e) => {
    e.preventDefault()
    try {
      await generateInvoices({
        classId: genInv.classId ? Number(genInv.classId) : undefined,
        studentId: genInv.studentId ? Number(genInv.studentId) : undefined,
        academicYearId: genInv.academicYearId ? Number(genInv.academicYearId) : undefined,
        dueDate: genInv.dueDate || null,
      })
      setGenInv({ classId: '', studentId: '', academicYearId: '', dueDate: '' })
      await loadInvoices()
    } catch { alert('Could not generate invoices — backend unavailable.') }
  }

  const openInvoice = async (inv) => {
    setSelectedInvoice(inv)
    try {
      const r = await getInvoiceById(inv.id)
      setInvoiceDetails(r.data)
    } catch {
      setInvoiceDetails(mockDetail(inv))
    }
  }

  const onRecordPayment = async (e) => {
    e.preventDefault()
    if (!selectedInvoice) return
    try {
      await recordPayment({
        invoiceId: selectedInvoice.id,
        amountPaid: Number(pay.amountPaid),
        paymentMethod: pay.paymentMethod,
        transactionId: pay.transactionId || null,
      })
      await loadInvoices()
      await openInvoice(selectedInvoice)
      setPay({ amountPaid: '', paymentMethod: 'cash', transactionId: '' })
    } catch { alert('Could not record payment — backend unavailable.') }
  }

  const loadCollections = async () => {
    if (!dateRange.startDate || !dateRange.endDate) return
    try {
      const byDay    = await collectionReport({ startDate: dateRange.startDate, endDate: dateRange.endDate, by: 'day' })
      const byMethod = await collectionReport({ startDate: dateRange.startDate, endDate: dateRange.endDate, by: 'method' })
      const duesRes  = await duesReport({})
      const defRes   = await defaultersReport({})
      setReports({
        collections: byDay.data?.data    || [],
        dues:        duesRes.data?.data  || [],
        defaulters:  defRes.data?.data   || [],
        byMethod:    byMethod.data?.data || [],
      })
    } catch { alert('Could not load reports — backend unavailable.') }
  }

  const onCreateDeposit = async (e) => {
    e.preventDefault()
    try {
      await createDeposit({ studentId: Number(depositForm.studentId), amount: Number(depositForm.amount), receivedAt: depositForm.receivedAt || null })
      setDepositForm({ studentId: '', amount: '', receivedAt: '' })
      await loadDeposits()
    } catch { alert('Could not add deposit — backend unavailable.') }
  }

  const onRefundDeposit = async (e) => {
    e.preventDefault()
    try {
      await refundDeposit(Number(refundForm.id), { amount: Number(refundForm.amount) })
      setRefundForm({ id: '', amount: '' })
      await loadDeposits()
    } catch { alert('Could not process refund — backend unavailable.') }
  }

  const onPayOnline = async () => {
    if (!selectedInvoice) return
    try {
      const r = await createRazorpayOrder({ invoiceId: selectedInvoice.id })
      const { orderId, amount, currency } = r.data
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount, currency,
        name: 'School ERP',
        description: `Invoice #${selectedInvoice.invoice_number}`,
        order_id: orderId,
        handler: async (response) => {
          try {
            await verifyRazorpayPayment({
              invoiceId: selectedInvoice.id,
              razorpayOrderId:   response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            })
            await loadInvoices()
            await openInvoice(selectedInvoice)
            alert('Payment successful')
          } catch { alert('Payment verification failed.') }
        },
        prefill: {},
        theme: { color: '#2563eb' },
      }
      new window.Razorpay(options).open()
    } catch { alert('Could not initiate Razorpay — backend unavailable.') }
  }

  // safe computed values from invoiceDetails
  const detailInv      = invoiceDetails?.invoice    || {}
  const detailItems    = invoiceDetails?.items       || []
  const detailPayments = invoiceDetails?.payments    || []
  const detailTotal    = safe(detailInv.total_amount) + safe(detailInv.late_fee)

  // ── render ─────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="text-2xl font-semibold mb-2">Fees</div>

      {/* Parent Payment Preview */}
      <ParentPaymentPreview />

      {/* Fee Structure */}
      <Section title="Fee Structure">
        <form className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4" onSubmit={onCreateStructure}>
          <input className="input" placeholder="Class ID"        value={newStruct.classId}        onChange={e => setNewStruct(s => ({ ...s, classId:        e.target.value }))} />
          <input className="input" placeholder="Fee Type"        value={newStruct.feeType}         onChange={e => setNewStruct(s => ({ ...s, feeType:         e.target.value }))} />
          <input type="number" className="input" placeholder="Amount" value={newStruct.amount}     onChange={e => setNewStruct(s => ({ ...s, amount:          e.target.value }))} />
          <input type="date"   className="input"                 value={newStruct.dueDate}          onChange={e => setNewStruct(s => ({ ...s, dueDate:         e.target.value }))} />
          <input className="input" placeholder="Academic Year ID" value={newStruct.academicYearId} onChange={e => setNewStruct(s => ({ ...s, academicYearId:  e.target.value }))} />
          <button className="btn btn-primary" type="submit">Add</button>
        </form>
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead><tr className="text-left"><th className="p-2">Class</th><th className="p-2">Type</th><th className="p-2">Amount</th><th className="p-2">Due</th></tr></thead>
            <tbody>
              {structure.map(r => (
                <tr key={r.id} className="border-t">
                  <td className="p-2">{r.class_id}</td>
                  <td className="p-2">{r.fee_type}</td>
                  <td className="p-2">₹{safe(r.amount).toFixed(2)}</td>
                  <td className="p-2">{r.due_date?.slice(0, 10) || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Invoices */}
      <Section title="Invoices">
        <form className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4" onSubmit={onGenerateInvoices}>
          <input className="input" placeholder="Class ID (or)"  value={genInv.classId}        onChange={e => setGenInv(s => ({ ...s, classId:        e.target.value }))} />
          <input className="input" placeholder="Student ID"     value={genInv.studentId}      onChange={e => setGenInv(s => ({ ...s, studentId:      e.target.value }))} />
          <input className="input" placeholder="Academic Year ID" value={genInv.academicYearId} onChange={e => setGenInv(s => ({ ...s, academicYearId: e.target.value }))} />
          <input type="date" className="input"                  value={genInv.dueDate}         onChange={e => setGenInv(s => ({ ...s, dueDate:        e.target.value }))} />
          <button className="btn btn-primary" type="submit">Generate</button>
        </form>

        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead><tr className="text-left"><th className="p-2">Invoice #</th><th className="p-2">Student</th><th className="p-2">Amount</th><th className="p-2">Status</th><th className="p-2">Actions</th></tr></thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id} className="border-t">
                  <td className="p-2">{inv.invoice_number}</td>
                  <td className="p-2">{inv.student_name} ({inv.student_number})</td>
                  <td className="p-2">₹{(safe(inv.total_amount) + safe(inv.late_fee)).toFixed(2)}</td>
                  <td className="p-2"><span className="badge bg-gray-200">{inv.status}</span></td>
                  <td className="p-2">
                    <button className="btn btn-outline" onClick={() => openInvoice(inv)}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {invoiceDetails && selectedInvoice && (
          <div className="mt-4 p-4 border rounded">
            <div className="font-semibold mb-2">Invoice Details — {selectedInvoice.invoice_number}</div>
            <div className="text-sm mb-2">Student: {detailInv.student_name} ({detailInv.student_number})</div>
            <div className="text-sm mb-2">Total: ₹{detailTotal.toFixed(2)}</div>

            <div className="mb-3">
              <div className="font-medium">Items</div>
              <ul className="list-disc ml-5 text-sm">
                {detailItems.map(it => (
                  <li key={it.id}>{it.fee_type}: ₹{safe(it.amount).toFixed(2)}</li>
                ))}
              </ul>
            </div>

            <div className="mb-3">
              <div className="font-medium">Payments</div>
              <ul className="list-disc ml-5 text-sm">
                {detailPayments.map(p => (
                  <li key={p.id}>₹{safe(p.amount_paid).toFixed(2)} • {p.payment_method} • {p.payment_date?.slice(0,10)} ({p.receipt_number})</li>
                ))}
                {detailPayments.length === 0 && <li className="text-gray-400">No payments yet.</li>}
              </ul>
            </div>

            <form className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3" onSubmit={onRecordPayment}>
              <input type="number" className="input" placeholder="Amount" value={pay.amountPaid} onChange={e => setPay(s => ({ ...s, amountPaid: e.target.value }))} />
              <select className="input" value={pay.paymentMethod} onChange={e => setPay(s => ({ ...s, paymentMethod: e.target.value }))}>
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
                <option value="card">Card</option>
                <option value="bank">Bank Transfer</option>
              </select>
              <input className="input" placeholder="Transaction ID (optional)" value={pay.transactionId} onChange={e => setPay(s => ({ ...s, transactionId: e.target.value }))} />
              <button className="btn btn-secondary" type="submit">Record Payment</button>
            </form>

            {canUseRazor && (
              <button className="btn btn-primary" onClick={onPayOnline}>Pay Online (Razorpay)</button>
            )}
          </div>
        )}
      </Section>

      {/* Reports */}
      <Section title="Reports">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3">
          <input type="date" className="input" value={dateRange.startDate} onChange={e => setDateRange(s => ({ ...s, startDate: e.target.value }))} />
          <input type="date" className="input" value={dateRange.endDate}   onChange={e => setDateRange(s => ({ ...s, endDate:   e.target.value }))} />
          <button className="btn btn-outline" onClick={loadCollections}>Load</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="font-medium mb-2">Daily Collections</div>
            <ul className="text-sm list-disc ml-5">
              {reports.collections.map(r => <li key={r.date}>{r.date?.slice(0,10)}: ₹{safe(r.total).toFixed(2)}</li>)}
              {reports.collections.length === 0 && <li className="text-gray-400">No data — select a date range and click Load.</li>}
            </ul>
          </div>
          <div>
            <div className="font-medium mb-2">By Payment Method</div>
            <ul className="text-sm list-disc ml-5">
              {(reports.byMethod || []).map(r => <li key={r.payment_method || 'unknown'}>{r.payment_method || 'unknown'}: ₹{safe(r.total).toFixed(2)}</li>)}
              {(reports.byMethod || []).length === 0 && <li className="text-gray-400">No data yet.</li>}
            </ul>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <div className="font-medium mb-2">Outstanding Dues</div>
            <ul className="text-sm list-disc ml-5">
              {reports.dues.map(r => <li key={r.student_id}>{r.student_name} ({r.student_number}) — {r.class_name} {r.section}: ₹{safe(r.due).toFixed(2)}</li>)}
              {reports.dues.length === 0 && <li className="text-gray-400">No outstanding dues.</li>}
            </ul>
          </div>
          <div>
            <div className="font-medium mb-2">Defaulters</div>
            <ul className="text-sm list-disc ml-5">
              {reports.defaulters.map(r => <li key={r.student_id}>{r.student_name} ({r.student_number}) — {r.class_name} {r.section}: ₹{safe(r.due).toFixed(2)}</li>)}
              {reports.defaulters.length === 0 && <li className="text-gray-400">No defaulters.</li>}
            </ul>
          </div>
        </div>
      </Section>

      {/* Security Deposits */}
      <Section title="Security Deposits">
        <form className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3" onSubmit={onCreateDeposit}>
          <input className="input" placeholder="Student ID" value={depositForm.studentId}  onChange={e => setDepositForm(s => ({ ...s, studentId:  e.target.value }))} />
          <input type="number" className="input" placeholder="Amount" value={depositForm.amount} onChange={e => setDepositForm(s => ({ ...s, amount:    e.target.value }))} />
          <input type="date" className="input"              value={depositForm.receivedAt} onChange={e => setDepositForm(s => ({ ...s, receivedAt: e.target.value }))} />
          <button className="btn btn-primary" type="submit">Add Deposit</button>
        </form>
        <form className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3" onSubmit={onRefundDeposit}>
          <input className="input" placeholder="Deposit ID"    value={refundForm.id}     onChange={e => setRefundForm(s => ({ ...s, id:     e.target.value }))} />
          <input type="number" className="input" placeholder="Refund Amount" value={refundForm.amount} onChange={e => setRefundForm(s => ({ ...s, amount: e.target.value }))} />
          <button className="btn btn-outline" type="submit">Refund</button>
        </form>
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead><tr className="text-left"><th className="p-2">ID</th><th className="p-2">Student</th><th className="p-2">Amount</th><th className="p-2">Received</th><th className="p-2">Refunded</th></tr></thead>
            <tbody>
              {deposits.map(d => (
                <tr key={d.id} className="border-t">
                  <td className="p-2">{d.id}</td>
                  <td className="p-2">{d.student_name} ({d.student_number})</td>
                  <td className="p-2">₹{safe(d.amount).toFixed(2)}</td>
                  <td className="p-2">{d.received_at?.slice(0,10)}</td>
                  <td className="p-2">₹{safe(d.refunded_amount).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  )
}
