import { useEffect, useMemo, useState } from 'react'
import { getClasses } from '../services/academic'
import { getAttendanceReport, getClassAttendanceSummary } from '../services/attendance'

function toCsv(rows) {
  if (!rows?.length) return ''
  const headers = Object.keys(rows[0])
  const lines = [headers.join(',')]
  for (const r of rows) lines.push(headers.map(h => JSON.stringify(r[h] ?? '')).join(','))
  return lines.join('\n')
}

export default function AttendanceReports() {
  const [classes, setClasses] = useState([])
  const [form, setForm] = useState({ classId: '', startDate: '', endDate: '', format: 'summary' })
  const [report, setReport] = useState([])
  const [summary, setSummary] = useState([])

  useEffect(() => { getClasses().then(r=>setClasses(r.data.classes||[])) }, [])

  const load = async () => {
    if (!form.classId || !form.startDate || !form.endDate) return
    const rep = await getAttendanceReport({ classId: form.classId, startDate: form.startDate, endDate: form.endDate, format: form.format })
    setReport(rep.data.attendanceReport || [])
    const sum = await getClassAttendanceSummary({ classId: form.classId, startDate: form.startDate, endDate: form.endDate })
    setSummary(sum.data.attendanceSummary || [])
  }

  const exportRep = () => {
    const csv = toCsv(report)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `attendance_${form.format}.csv`; a.click(); URL.revokeObjectURL(url)
  }

  const exportSum = () => {
    const csv = toCsv(summary)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `attendance_summary.csv`; a.click(); URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="text-2xl font-semibold">Attendance Reports</div>

      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <select className="input" value={form.classId} onChange={e=>setForm(s=>({...s,classId:e.target.value}))}>
            <option value="">Select Class</option>
            {classes.map(c=> <option key={c.id} value={c.id}>{c.name} {c.section}</option>)}
          </select>
          <input type="date" className="input" value={form.startDate} onChange={e=>setForm(s=>({...s,startDate:e.target.value}))} />
          <input type="date" className="input" value={form.endDate} onChange={e=>setForm(s=>({...s,endDate:e.target.value}))} />
          <select className="input" value={form.format} onChange={e=>setForm(s=>({...s,format:e.target.value}))}>
            <option value="summary">Summary</option>
            <option value="detailed">Detailed</option>
          </select>
          <button className="btn btn-primary" onClick={load}>Load</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold">{form.format==='detailed'?'Detailed Report':'Report (Summary-by-student)'}</div>
            <button className="btn btn-outline" onClick={exportRep} disabled={!report.length}>Export CSV</button>
          </div>
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  {report[0] && Object.keys(report[0]).map(h=> <th key={h} className="p-2">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {report.map((row,i)=> (
                  <tr key={i} className="border-t">
                    {Object.keys(report[0]||{}).map(h=> <td key={h} className="p-2">{String(row[h] ?? '')}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold">Class Summary</div>
            <button className="btn btn-outline" onClick={exportSum} disabled={!summary.length}>Export CSV</button>
          </div>
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  {summary[0] && Object.keys(summary[0]).map(h=> <th key={h} className="p-2">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {summary.map((row,i)=> (
                  <tr key={i} className="border-t">
                    {Object.keys(summary[0]||{}).map(h=> <td key={h} className="p-2">{String(row[h] ?? '')}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
