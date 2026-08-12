import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../services/api'
import { getUser } from '../services/auth'
import {
  ClipboardCheck, FileText, DollarSign,
  CheckCircle2, XCircle, Clock, AlertCircle,
  BookOpen, Calendar, TrendingUp, BadgeIndianRupee,
  ChevronDown, ChevronUp
} from 'lucide-react'

// ── Helpers ──────────────────────────────────────────────
const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const currency = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`

const statusColor = {
  present: 'bg-green-100 text-green-700',
  absent:  'bg-red-100 text-red-700',
  late:    'bg-yellow-100 text-yellow-700',
  excused: 'bg-blue-100 text-blue-700',
}
const feeStatusColor = {
  paid:    'bg-green-100 text-green-700',
  unpaid:  'bg-red-100 text-red-700',
  partial: 'bg-yellow-100 text-yellow-700',
}
const assignStatusColor = {
  pending:   'bg-yellow-100 text-yellow-700',
  submitted: 'bg-blue-100 text-blue-700',
  graded:    'bg-green-100 text-green-700',
  overdue:   'bg-red-100 text-red-700',
}

// ── Stat Card ─────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-xs text-gray-500">{label}</div>
      </div>
    </div>
  )
}

// ── Tab Button ────────────────────────────────────────────
function Tab({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all
        ${active ? 'bg-blue-600 text-white shadow' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  )
}

// ══════════════════════════════════════════════════════════
//  ATTENDANCE TAB
// ══════════════════════════════════════════════════════════
//  ATTENDANCE TAB
// ══════════════════════════════════════════════════════════
function AttendanceTab() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    api.get('/attendance/my-attendance')
      .then(res => {
        const data = res.data.attendance || res.data.records || []
        setRecords(data)
      })
      .catch(err => {
        setRecords([])
        setError(err?.response?.data?.error || 'Failed to load attendance')
      })
      .finally(() => setLoading(false))
  }, [])

  const summary = useMemo(() => {
    const total = records.length
    const present = records.filter(r => r.status === 'present').length
    const absent  = records.filter(r => r.status === 'absent').length
    const late    = records.filter(r => r.status === 'late').length
    const pct = total ? Math.round((present / total) * 100) : 0
    return { total, present, absent, late, pct }
  }, [records])

  if (loading) return <div className="text-center py-12 text-gray-400">Loading attendance…</div>
  if (error)   return <div className="text-center py-12 text-red-500">{error}</div>

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp}    label="Attendance %" value={`${summary.pct}%`}       color="bg-blue-100 text-blue-600" />
        <StatCard icon={CheckCircle2}  label="Present"      value={summary.present}          color="bg-green-100 text-green-600" />
        <StatCard icon={XCircle}       label="Absent"       value={summary.absent}           color="bg-red-100 text-red-600" />
        <StatCard icon={Clock}         label="Late"         value={summary.late}             color="bg-yellow-100 text-yellow-600" />
      </div>

      {/* Progress bar */}
      <div className="card">
        <div className="flex justify-between text-sm font-medium mb-2">
          <span>Overall Attendance</span>
          <span className={summary.pct >= 75 ? 'text-green-600' : 'text-red-600'}>{summary.pct}%</span>
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-3 rounded-full transition-all duration-700 ${summary.pct >= 75 ? 'bg-green-500' : 'bg-red-500'}`}
            style={{ width: `${summary.pct}%` }}
          />
        </div>
        {summary.pct < 75 && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-red-600">
            <AlertCircle className="w-3.5 h-3.5" />
            Your attendance is below 75%. Please attend regularly.
          </div>
        )}
      </div>

      {/* Records table */}
      <div className="card">
        <div className="font-semibold mb-3">Attendance Records</div>
        {records.length === 0 ? (
          <div className="text-gray-400 text-sm py-8 text-center">No attendance records found.</div>
        ) : (
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="p-2">Date</th>
                  <th className="p-2">Subject</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <tr key={r.id || i} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="p-2 font-mono text-xs">{fmt(r.date)}</td>
                    <td className="p-2">{r.subject_name || r.subject || '—'}</td>
                    <td className="p-2">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${statusColor[r.status] || 'bg-gray-100 text-gray-600'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="p-2 text-gray-500 text-xs">{r.remarks || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
//  ASSIGNMENTS TAB
// ══════════════════════════════════════════════════════════
function AssignmentsTab() {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    setLoading(true)
    api.get('/assignments/my-assignments')
      .then(res => {
        const data = res.data.assignments || res.data || []
        setAssignments(data)
      })
      .catch(err => {
        setAssignments([])
        setError(err?.response?.data?.error || 'Failed to load assignments')
      })
      .finally(() => setLoading(false))
  }, [])

  const summary = useMemo(() => ({
    total:     assignments.length,
    pending:   assignments.filter(a => a.status === 'pending' || !a.submission_status).length,
    submitted: assignments.filter(a => a.status === 'submitted' || a.submission_status === 'submitted').length,
    graded:    assignments.filter(a => a.status === 'graded'   || a.submission_status === 'graded').length,
  }), [assignments])

  if (loading) return <div className="text-center py-12 text-gray-400">Loading assignments…</div>
  if (error)   return <div className="text-center py-12 text-red-500">{error}</div>

  const getStatus = (a) => a.submission_status || a.status || 'pending'
  const isOverdue = (a) => a.due_date && new Date(a.due_date) < new Date() && getStatus(a) === 'pending'

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={BookOpen}     label="Total"     value={summary.total}     color="bg-blue-100 text-blue-600" />
        <StatCard icon={Clock}        label="Pending"   value={summary.pending}   color="bg-yellow-100 text-yellow-600" />
        <StatCard icon={FileText}     label="Submitted" value={summary.submitted} color="bg-blue-100 text-blue-600" />
        <StatCard icon={CheckCircle2} label="Graded"   value={summary.graded}    color="bg-green-100 text-green-600" />
      </div>

      {/* Assignment cards */}
      <div className="space-y-3">
        {assignments.length === 0 ? (
          <div className="card text-center text-gray-400 py-10">No assignments found for your class.</div>
        ) : assignments.map((a, i) => {
          const status = isOverdue(a) ? 'overdue' : getStatus(a)
          const isOpen = expanded === (a.id || i)
          return (
            <div key={a.id || i} className="card">
              <button
                className="w-full flex items-center justify-between gap-3 text-left"
                onClick={() => setExpanded(isOpen ? null : (a.id || i))}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium truncate">{a.title}</div>
                    <div className="text-xs text-gray-500">{a.subject_name || a.subject || '—'} · Due {fmt(a.due_date)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${assignStatusColor[status] || 'bg-gray-100 text-gray-600'}`}>
                    {status}
                  </span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
              </button>

              {isOpen && (
                <div className="mt-3 pt-3 border-t text-sm space-y-2 text-gray-600">
                  {a.description && <p>{a.description}</p>}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="font-medium text-gray-700">Assigned:</span> {fmt(a.created_at)}</div>
                    <div><span className="font-medium text-gray-700">Due:</span> {fmt(a.due_date)}</div>
                    {a.max_marks && <div><span className="font-medium text-gray-700">Max Marks:</span> {a.max_marks}</div>}
                    {a.marks_obtained != null && <div><span className="font-medium text-gray-700">Marks Obtained:</span> {a.marks_obtained}</div>}
                    {a.feedback && <div className="col-span-2"><span className="font-medium text-gray-700">Feedback:</span> {a.feedback}</div>}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
//  PAY FEES TAB
// ══════════════════════════════════════════════════════════
function FeesTab() {
  const [invoices, setInvoices] = useState([])
  const [items, setItems] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState(null)
  const [payModal, setPayModal] = useState(null)
  const [payStep, setPayStep] = useState(0) // 0=method, 1=processing, 2=success
  const [payMethod, setPayMethod] = useState('')

  useEffect(() => {
    setLoading(true)
    api.get('/fees/my-invoices')
      .then(res => {
        const inv = res.data.invoices || []
        const itm = res.data.items || {}
        setInvoices(inv)
        setItems(itm)
      })
      .catch(err => {
        setInvoices([])
        setItems({})
        setError(err?.response?.data?.error || 'Failed to load fee invoices')
      })
      .finally(() => setLoading(false))
  }, [])

  // ── Real payment flow ──
  const openPayModal = (inv) => { setPayModal(inv); setPayStep(0); setPayMethod('') }
  const closePayModal = () => { setPayModal(null); setPayStep(0); setPayMethod('') }
  const handlePay = async () => {
    if (!payMethod) return
    setPayStep(1)
    
    try {
      const token = localStorage.getItem('erp_jwt') || localStorage.getItem('token') || '';
      
      // 1. Create order
      const orderResponse = await api.post('/fees/razorpay/create-order', { invoiceId: payModal.id })
      const { orderId, amount, currency, keyId } = orderResponse.data

      // 2. Open Razorpay
      const options = {
        key: keyId,
        amount,
        currency,
        name: 'School ERP System',
        description: `Fee Payment for ${payModal.invoice_number}`,
        order_id: orderId,
        handler: async function (response) {
          try {
            // 3. Verify payment
            await api.post('/fees/razorpay/verify', {
              invoiceId: payModal.id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            })
            
            setPayStep(2)
            setInvoices(prev => prev.map(i => i.id === payModal.id ? { ...i, status: 'paid' } : i))
          } catch (err) {
            alert('Payment verification failed: ' + (err.response?.data?.error || err.message))
            closePayModal()
          }
        },
        modal: {
          ondismiss: function() {
            closePayModal()
          }
        },
        theme: { color: '#3399cc' }
      }
      
      const razorpay = new window.Razorpay(options)
      razorpay.open()
      
    } catch (err) {
      alert('Failed to initiate payment: ' + (err.response?.data?.error || err.message))
      closePayModal()
    }
  }

  const summary = useMemo(() => {
    const totalDue  = invoices.filter(i => i.status !== 'paid').reduce((s, i) => s + Number(i.total_amount || 0), 0)
    const totalPaid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.total_amount || 0), 0)
    return { totalDue, totalPaid, count: invoices.length }
  }, [invoices])

  if (loading) return <div className="text-center py-12 text-gray-400">Loading fee invoices…</div>

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={BadgeIndianRupee} label="Total Due"  value={currency(summary.totalDue)}  color="bg-red-100 text-red-600" />
        <StatCard icon={CheckCircle2}     label="Total Paid" value={currency(summary.totalPaid)} color="bg-green-100 text-green-600" />
        <StatCard icon={DollarSign}       label="Invoices"   value={summary.count}               color="bg-blue-100 text-blue-600" />
      </div>

      {/* Invoices list */}
      <div className="space-y-3">
        {invoices.length === 0 ? (
          <div className="card text-center text-gray-400 py-10">No fee invoices found. Please contact the school office.</div>
        ) : invoices.map((inv) => {
          const isOpen = expanded === inv.id
          const invItems = items[inv.id] || []
          return (
            <div key={inv.id} className="card">
              <button
                className="w-full flex items-center justify-between gap-3 text-left"
                onClick={() => setExpanded(isOpen ? null : inv.id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                    <DollarSign className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium font-mono text-sm">{inv.invoice_number}</div>
                    <div className="text-xs text-gray-500">Due: {fmt(inv.due_date)} · {inv.class_name || ''} {inv.section || ''}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">{currency(inv.total_amount)}</div>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${feeStatusColor[inv.status] || 'bg-gray-100 text-gray-600'}`}>
                      {inv.status}
                    </span>
                  </div>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
              </button>

              {isOpen && (
                <div className="mt-3 pt-3 border-t space-y-3">
                  {invItems.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-gray-500 mb-1">Fee Breakdown</div>
                      <table className="w-full text-sm">
                        <tbody>
                          {invItems.map((item, idx) => (
                            <tr key={idx} className="border-b last:border-0">
                              <td className="py-1.5 capitalize text-gray-700">{item.fee_type?.replace(/_/g, ' ')}</td>
                              <td className="py-1.5 text-right font-medium">{currency(item.amount)}</td>
                            </tr>
                          ))}
                          <tr className="font-semibold">
                            <td className="py-1.5">Total</td>
                            <td className="py-1.5 text-right">{currency(inv.total_amount)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                  {inv.status !== 'paid' && (
                    <div className="space-y-2">
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                        <span>This invoice is <strong>{inv.status}</strong>. Ask your parent to make the payment online.</span>
                      </div>
                      <button
                        onClick={() => openPayModal(inv)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
                      >
                        <BadgeIndianRupee className="w-4 h-4" />
                        Pay Now — {currency(inv.total_amount)}
                      </button>
                    </div>
                  )}
                  {inv.status === 'paid' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>This invoice has been fully paid. Thank you!</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Payment Modal ── */}
      {payModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            {payStep === 0 && (
              <>
                <div className="text-lg font-bold mb-1">Pay Fee Invoice</div>
                <div className="text-xs text-gray-500 mb-4 font-mono">{payModal.invoice_number}</div>
                <div className="text-2xl font-extrabold text-blue-600 mb-5 text-center">{currency(payModal.total_amount)}</div>

                <div className="text-sm font-semibold text-gray-700 mb-3">Select Payment Method</div>
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {[
                    { key: 'upi',     label: 'UPI / QR',       emoji: '📱' },
                    { key: 'card',    label: 'Credit / Debit',  emoji: '💳' },
                    { key: 'netbank', label: 'Net Banking',     emoji: '🏦' },
                    { key: 'wallet',  label: 'Wallet',          emoji: '👛' },
                  ].map(m => (
                    <button
                      key={m.key}
                      onClick={() => setPayMethod(m.key)}
                      className={`flex flex-col items-center gap-1 p-3 border-2 rounded-xl text-sm font-medium transition-all
                        ${payMethod === m.key ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-blue-300'}`}
                    >
                      <span className="text-2xl">{m.emoji}</span>
                      {m.label}
                    </button>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button onClick={closePayModal} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
                  <button
                    onClick={handlePay}
                    disabled={!payMethod}
                    className="flex-1 py-2.5 bg-blue-600 disabled:bg-blue-300 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
                  >Proceed</button>
                </div>
              </>
            )}

            {payStep === 1 && (
              <div className="py-6 text-center space-y-4">
                <div className="w-14 h-14 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <div className="font-semibold text-gray-700">Processing payment…</div>
                <div className="text-xs text-gray-400">Please do not close this window</div>
              </div>
            )}

            {payStep === 2 && (
              <div className="py-4 text-center space-y-3">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-9 h-9 text-green-600" />
                </div>
                <div className="text-xl font-bold text-gray-800">Payment Successful!</div>
                <div className="text-sm text-gray-500">{currency(payModal.total_amount)} paid for {payModal.invoice_number}</div>
                <div className="text-xs text-gray-400">Receipt will be sent to your registered email.</div>
                <button onClick={closePayModal} className="mt-2 w-full py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700">Done</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════
//  MAIN STUDENT DASHBOARD
// ══════════════════════════════════════════════════════════
const TABS = [
  { key: 'attendance',  label: 'My Attendance',  icon: ClipboardCheck },
  { key: 'assignments', label: 'My Assignments',  icon: FileText },
  { key: 'fees',        label: 'My Fees',         icon: DollarSign },
]

export default function StudentDashboard() {
  const user = getUser()
  const [searchParams, setSearchParams] = useSearchParams()
  const tabFromUrl = searchParams.get('tab') || 'attendance'
  
  // Keep local state for fast UI updates, but initialize from URL
  const [activeTab, setActiveTab] = useState(tabFromUrl)

  // Sync state if URL changes (e.g. from sidebar clicks)
  useEffect(() => {
    setActiveTab(searchParams.get('tab') || 'attendance')
  }, [searchParams])

  const handleTabChange = (key) => {
    setActiveTab(key)
    setSearchParams({ tab: key })
  }

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="space-y-6">

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map(tab => (
          <Tab
            key={tab.key}
            active={activeTab === tab.key}
            onClick={() => handleTabChange(tab.key)}
            icon={tab.icon}
            label={tab.label}
          />
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'attendance'  && <AttendanceTab />}
      {activeTab === 'assignments' && <AssignmentsTab />}
      {activeTab === 'fees'        && <FeesTab />}
    </div>
  )
}
