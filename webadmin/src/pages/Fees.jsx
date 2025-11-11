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

function Section({ title, children }) {
  return (
    <div className="card mb-6">
      <div className="text-lg font-semibold mb-3">{title}</div>
      {children}
    </div>
  )
}

export default function Fees() {
  const [structure, setStructure] = useState([])
  const [invoices, setInvoices] = useState([])
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [invoiceDetails, setInvoiceDetails] = useState(null)
  const [reports, setReports] = useState({ collections: [], dues: [], defaulters: [] })
  const [deposits, setDeposits] = useState([])

  const [newStruct, setNewStruct] = useState({ classId: '', feeType: '', amount: '', dueDate: '', academicYearId: '' })
  const [genInv, setGenInv] = useState({ classId: '', studentId: '', academicYearId: '', dueDate: '' })
  const [pay, setPay] = useState({ amountPaid: '', paymentMethod: 'cash', transactionId: '' })
  const [depositForm, setDepositForm] = useState({ studentId: '', amount: '', receivedAt: '' })
  const [refundForm, setRefundForm] = useState({ id: '', amount: '' })
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' })

  const canUseRazor = useMemo(() => !!import.meta.env.VITE_RAZORPAY_KEY_ID, [])

  const loadStructure = async () => {
    const res = await getFeeStructure({})
    setStructure(res.data.feeStructure || [])
  }
  const loadInvoices = async () => {
    const res = await listInvoices({})
    setInvoices(res.data.invoices || [])
  }
  const loadDeposits = async () => {
    const res = await listDeposits({})
    setDeposits(res.data.deposits || [])
  }

  useEffect(() => {
    loadStructure()
    loadInvoices()
    loadDeposits()
  }, [])

  const onCreateStructure = async (e) => {
    e.preventDefault()
    await createFeeStructure({
      classId: Number(newStruct.classId),
      feeType: newStruct.feeType,
      amount: Number(newStruct.amount),
      dueDate: newStruct.dueDate || null,
      academicYearId: newStruct.academicYearId ? Number(newStruct.academicYearId) : null,
    })
    setNewStruct({ classId: '', feeType: '', amount: '', dueDate: '', academicYearId: '' })
    await loadStructure()
  }

  const onGenerateInvoices = async (e) => {
    e.preventDefault()
    await generateInvoices({
      classId: genInv.classId ? Number(genInv.classId) : undefined,
      studentId: genInv.studentId ? Number(genInv.studentId) : undefined,
      academicYearId: genInv.academicYearId ? Number(genInv.academicYearId) : undefined,
      dueDate: genInv.dueDate || null,
    })
    setGenInv({ classId: '', studentId: '', academicYearId: '', dueDate: '' })
    await loadInvoices()
  }

  const openInvoice = async (inv) => {
    setSelectedInvoice(inv)
    const r = await getInvoiceById(inv.id)
    setInvoiceDetails(r.data)
  }

  const onRecordPayment = async (e) => {
    e.preventDefault()
    if (!selectedInvoice) return
    await recordPayment({ invoiceId: selectedInvoice.id, amountPaid: Number(pay.amountPaid), paymentMethod: pay.paymentMethod, transactionId: pay.transactionId || null })
    await loadInvoices()
    await openInvoice(selectedInvoice)
    setPay({ amountPaid: '', paymentMethod: 'cash', transactionId: '' })
  }

  const loadCollections = async () => {
    if (!dateRange.startDate || !dateRange.endDate) return
    const byDay = await collectionReport({ startDate: dateRange.startDate, endDate: dateRange.endDate, by: 'day' })
    const byMethod = await collectionReport({ startDate: dateRange.startDate, endDate: dateRange.endDate, by: 'method' })
    const duesRes = await duesReport({})
    const defRes = await defaultersReport({})
    setReports({ collections: byDay.data.data || [], dues: duesRes.data.data || [], defaulters: defRes.data.data || [], byMethod: byMethod.data.data || [] })
  }

  const onCreateDeposit = async (e) => {
    e.preventDefault()
    await createDeposit({ studentId: Number(depositForm.studentId), amount: Number(depositForm.amount), receivedAt: depositForm.receivedAt || null })
    setDepositForm({ studentId: '', amount: '', receivedAt: '' })
    await loadDeposits()
  }

  const onRefundDeposit = async (e) => {
    e.preventDefault()
    await refundDeposit(Number(refundForm.id), { amount: Number(refundForm.amount) })
    setRefundForm({ id: '', amount: '' })
    await loadDeposits()
  }

  const onPayOnline = async () => {
    if (!selectedInvoice) return
    const r = await createRazorpayOrder({ invoiceId: selectedInvoice.id })
    const { orderId, amount, currency } = r.data
    // Razorpay Checkout
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount,
      currency,
      name: 'School ERP',
      description: `Invoice #${selectedInvoice.invoice_number}`,
      order_id: orderId,
      handler: async function (response) {
        await verifyRazorpayPayment({
          invoiceId: selectedInvoice.id,
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        })
        await loadInvoices()
        await openInvoice(selectedInvoice)
        alert('Payment successful')
      },
      prefill: {},
      theme: { color: '#2563eb' },
    }
    const rz = new window.Razorpay(options)
    rz.open()
  }

  return (
    <div className="space-y-6">
      <div className="text-2xl font-semibold mb-2">Fees</div>

      <Section title="Fee Structure">
        <form className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4" onSubmit={onCreateStructure}>
          <input className="input" placeholder="Class ID" value={newStruct.classId} onChange={e=>setNewStruct(s=>({...s,classId:e.target.value}))} />
          <input className="input" placeholder="Fee Type" value={newStruct.feeType} onChange={e=>setNewStruct(s=>({...s,feeType:e.target.value}))} />
          <input type="number" className="input" placeholder="Amount" value={newStruct.amount} onChange={e=>setNewStruct(s=>({...s,amount:e.target.value}))} />
          <input type="date" className="input" value={newStruct.dueDate} onChange={e=>setNewStruct(s=>({...s,dueDate:e.target.value}))} />
          <input className="input" placeholder="Academic Year ID" value={newStruct.academicYearId} onChange={e=>setNewStruct(s=>({...s,academicYearId:e.target.value}))} />
          <button className="btn btn-primary" type="submit">Add</button>
        </form>
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead><tr className="text-left"><th className="p-2">Class</th><th className="p-2">Type</th><th className="p-2">Amount</th><th className="p-2">Due</th></tr></thead>
            <tbody>
              {structure.map(r=> (
                <tr key={r.id} className="border-t"><td className="p-2">{r.class_id}</td><td className="p-2">{r.fee_type}</td><td className="p-2">₹{Number(r.amount).toFixed(2)}</td><td className="p-2">{r.due_date?.slice(0,10) || '-'}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Invoices">
        <form className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4" onSubmit={onGenerateInvoices}>
          <input className="input" placeholder="Class ID (or)" value={genInv.classId} onChange={e=>setGenInv(s=>({...s,classId:e.target.value}))} />
          <input className="input" placeholder="Student ID" value={genInv.studentId} onChange={e=>setGenInv(s=>({...s,studentId:e.target.value}))} />
          <input className="input" placeholder="Academic Year ID" value={genInv.academicYearId} onChange={e=>setGenInv(s=>({...s,academicYearId:e.target.value}))} />
          <input type="date" className="input" value={genInv.dueDate} onChange={e=>setGenInv(s=>({...s,dueDate:e.target.value}))} />
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
                  <td className="p-2">₹{Number(inv.total_amount + (inv.late_fee||0)).toFixed(2)}</td>
                  <td className="p-2"><span className="badge bg-gray-200">{inv.status}</span></td>
                  <td className="p-2 space-x-2">
                    <button className="btn btn-outline" onClick={()=>openInvoice(inv)}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {invoiceDetails && selectedInvoice && (
          <div className="mt-4 p-4 border rounded">
            <div className="font-semibold mb-2">Invoice Details - {selectedInvoice.invoice_number}</div>
            <div className="text-sm mb-2">Student: {invoiceDetails.invoice.student_name} ({invoiceDetails.invoice.student_number})</div>
            <div className="text-sm mb-2">Total: ₹{Number(invoiceDetails.invoice.total_amount + (invoiceDetails.invoice.late_fee||0)).toFixed(2)}</div>

            <div className="mb-3">
              <div className="font-medium">Items</div>
              <ul className="list-disc ml-5 text-sm">
                {invoiceDetails.items.map(it => (
                  <li key={it.id}>{it.fee_type}: ₹{Number(it.amount).toFixed(2)}</li>
                ))}
              </ul>
            </div>

            <div className="mb-3">
              <div className="font-medium">Payments</div>
              <ul className="list-disc ml-5 text-sm">
                {invoiceDetails.payments.map(p => (
                  <li key={p.id}>₹{Number(p.amount_paid).toFixed(2)} • {p.payment_method} • {p.payment_date?.slice(0,10)} ({p.receipt_number})</li>
                ))}
              </ul>
            </div>

            <form className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3" onSubmit={onRecordPayment}>
              <input type="number" className="input" placeholder="Amount" value={pay.amountPaid} onChange={e=>setPay(s=>({...s,amountPaid:e.target.value}))} />
              <select className="input" value={pay.paymentMethod} onChange={e=>setPay(s=>({...s,paymentMethod:e.target.value}))}>
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
                <option value="card">Card</option>
                <option value="bank">Bank Transfer</option>
              </select>
              <input className="input" placeholder="Transaction ID (optional)" value={pay.transactionId} onChange={e=>setPay(s=>({...s,transactionId:e.target.value}))} />
              <button className="btn btn-secondary" type="submit">Record Payment</button>
            </form>

            {canUseRazor && (
              <button className="btn btn-primary" onClick={onPayOnline}>Pay Online (Razorpay)</button>
            )}
          </div>
        )}
      </Section>

      <Section title="Reports">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3">
          <input type="date" className="input" value={dateRange.startDate} onChange={e=>setDateRange(s=>({...s,startDate:e.target.value}))} />
          <input type="date" className="input" value={dateRange.endDate} onChange={e=>setDateRange(s=>({...s,endDate:e.target.value}))} />
          <button className="btn btn-outline" onClick={loadCollections}>Load</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="font-medium mb-2">Daily Collections</div>
            <ul className="text-sm list-disc ml-5">
              {reports.collections.map(r=> (
                <li key={r.date}>{r.date?.slice(0,10)}: ₹{Number(r.total).toFixed(2)}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="font-medium mb-2">By Payment Method</div>
            <ul className="text-sm list-disc ml-5">
              {reports.byMethod?.map(r=> (
                <li key={r.payment_method || 'unknown'}>{r.payment_method || 'unknown'}: ₹{Number(r.total).toFixed(2)}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <div className="font-medium mb-2">Outstanding Dues</div>
            <ul className="text-sm list-disc ml-5">
              {reports.dues.map(r=> (
                <li key={r.student_id}>{r.student_name} ({r.student_number}) - {r.class_name} {r.section}: ₹{Number(r.due).toFixed(2)}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="font-medium mb-2">Defaulters</div>
            <ul className="text-sm list-disc ml-5">
              {reports.defaulters.map(r=> (
                <li key={r.student_id}>{r.student_name} ({r.student_number}) - {r.class_name} {r.section}: ₹{Number(r.due).toFixed(2)}</li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section title="Security Deposits">
        <form className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3" onSubmit={onCreateDeposit}>
          <input className="input" placeholder="Student ID" value={depositForm.studentId} onChange={e=>setDepositForm(s=>({...s,studentId:e.target.value}))} />
          <input type="number" className="input" placeholder="Amount" value={depositForm.amount} onChange={e=>setDepositForm(s=>({...s,amount:e.target.value}))} />
          <input type="date" className="input" value={depositForm.receivedAt} onChange={e=>setDepositForm(s=>({...s,receivedAt:e.target.value}))} />
          <button className="btn btn-primary" type="submit">Add Deposit</button>
        </form>
        <form className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3" onSubmit={onRefundDeposit}>
          <input className="input" placeholder="Deposit ID" value={refundForm.id} onChange={e=>setRefundForm(s=>({...s,id:e.target.value}))} />
          <input type="number" className="input" placeholder="Refund Amount" value={refundForm.amount} onChange={e=>setRefundForm(s=>({...s,amount:e.target.value}))} />
          <button className="btn btn-outline" type="submit">Refund</button>
        </form>
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead><tr className="text-left"><th className="p-2">ID</th><th className="p-2">Student</th><th className="p-2">Amount</th><th className="p-2">Received</th><th className="p-2">Refunded</th></tr></thead>
            <tbody>
              {deposits.map(d => (
                <tr key={d.id} className="border-t"><td className="p-2">{d.id}</td><td className="p-2">{d.student_name} ({d.student_number})</td><td className="p-2">₹{Number(d.amount).toFixed(2)}</td><td className="p-2">{d.received_at?.slice(0,10)}</td><td className="p-2">₹{Number(d.refunded_amount||0).toFixed(2)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  )
}
