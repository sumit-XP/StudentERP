import { useEffect, useMemo, useState } from 'react'
import { Building2, RefreshCcw, ShieldCheck, UserPlus } from 'lucide-react'
import { createSchool, createSchoolAdmin, getSchools, toggleSchoolStatus, createSchoolAcademicYear } from '../services/superAdmin'

const defaultSchool = {
  name: '',
  place: '',
  owner_name: '',
  tenure: '',
  renewal_date: '',
  contact_email: '',
  contact_phone: '',
  services_taken: '',
  plan: 'basic',
}

const defaultAdmin = {
  schoolId: '',
  name: '',
  email: '',
  password: '',
  phone: '',
}

const defaultAcademicYear = {
  schoolId: '',
  yearName: '',
  startDate: '',
  endDate: '',
  isCurrent: true
}

export default function SuperAdmin() {
  const [schools, setSchools] = useState([])
  const [schoolForm, setSchoolForm] = useState(defaultSchool)
  const [adminForm, setAdminForm] = useState(defaultAdmin)
  const [academicYearForm, setAcademicYearForm] = useState(defaultAcademicYear)
  const [loading, setLoading] = useState(true)
  const [savingSchool, setSavingSchool] = useState(false)
  const [savingAdmin, setSavingAdmin] = useState(false)
  const [savingAcademicYear, setSavingAcademicYear] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getSchools({ limit: 100 })
      setSchools(res.data.schools || [])
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load schools')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const activeCount = useMemo(() => schools.filter((school) => school.is_active).length, [schools])

  const onCreateSchool = async (e) => {
    e.preventDefault()
    setSavingSchool(true)
    setError('')
    setMessage('')
    try {
      const payload = {
        ...schoolForm,
        services_taken: schoolForm.services_taken.split(',').map((item) => item.trim()).filter(Boolean),
      }
      const res = await createSchool(payload)
      setSchoolForm(defaultSchool)
      setMessage(`School created. 5 digit School ID: ${res.data.school.school_code}`)
      await load()
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to create school')
    } finally {
      setSavingSchool(false)
    }
  }

  const onCreateAdmin = async (e) => {
    e.preventDefault()
    setSavingAdmin(true)
    setError('')
    setMessage('')
    try {
      const res = await createSchoolAdmin(adminForm.schoolId, {
        name: adminForm.name,
        email: adminForm.email,
        password: adminForm.password,
        phone: adminForm.phone || null,
      })
      setAdminForm(defaultAdmin)
      setMessage(`Admin created for School ID ${res.data.admin.school_code}.`)
      await load()
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to create admin')
    } finally {
      setSavingAdmin(false)
    }
  }

  const onToggle = async (school) => {
    await toggleSchoolStatus(school.id, { is_active: !school.is_active })
    await load()
  }

  const onCreateAcademicYear = async (e) => {
    e.preventDefault()
    setSavingAcademicYear(true)
    setError('')
    setMessage('')
    
    // We need to pass the real school database id, not the school_code.
    // Let's find the school by code
    const school = schools.find(s => s.school_code === academicYearForm.schoolId)
    if (!school) {
      setError("Invalid school selected")
      setSavingAcademicYear(false)
      return
    }

    try {
      const res = await createSchoolAcademicYear(school.id, {
        yearName: academicYearForm.yearName,
        startDate: academicYearForm.startDate,
        endDate: academicYearForm.endDate,
        isCurrent: academicYearForm.isCurrent
      })
      setAcademicYearForm(defaultAcademicYear)
      setMessage(`Academic Year created for School ID ${school.school_code}.`)
      await load()
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to create academic year')
    } finally {
      setSavingAcademicYear(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-950">Super Admin</h1>
          <p className="text-sm text-gray-500">Create schools, issue 5 digit school IDs, and onboard school admins.</p>
        </div>
        <button className="btn btn-outline" onClick={load} disabled={loading}>
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {(message || error) && (
        <div className={`rounded-lg border p-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
          {error || message}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="stat-card stat-card-blue">
          <div className="text-sm text-white/80">Total Schools</div>
          <div className="mt-2 text-3xl font-bold">{schools.length}</div>
        </div>
        <div className="stat-card stat-card-green">
          <div className="text-sm text-white/80">Active Schools</div>
          <div className="mt-2 text-3xl font-bold">{activeCount}</div>
        </div>
        <div className="stat-card stat-card-orange">
          <div className="text-sm text-white/80">Suspended</div>
          <div className="mt-2 text-3xl font-bold">{schools.length - activeCount}</div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="card">
          <div className="mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-950">Create School</h2>
          </div>
          <form className="grid gap-3 md:grid-cols-2" onSubmit={onCreateSchool}>
            <input className="input md:col-span-2" placeholder="School name" value={schoolForm.name} onChange={(e) => setSchoolForm((s) => ({ ...s, name: e.target.value }))} required />
            <input className="input" placeholder="Place / City" value={schoolForm.place} onChange={(e) => setSchoolForm((s) => ({ ...s, place: e.target.value }))} />
            <input className="input" placeholder="Owner name" value={schoolForm.owner_name} onChange={(e) => setSchoolForm((s) => ({ ...s, owner_name: e.target.value }))} />
            <input className="input" placeholder="Tenure, e.g. 1 year" value={schoolForm.tenure} onChange={(e) => setSchoolForm((s) => ({ ...s, tenure: e.target.value }))} />
            <input className="input" type="date" value={schoolForm.renewal_date} onChange={(e) => setSchoolForm((s) => ({ ...s, renewal_date: e.target.value }))} />
            <input className="input" type="email" placeholder="Contact email" value={schoolForm.contact_email} onChange={(e) => setSchoolForm((s) => ({ ...s, contact_email: e.target.value }))} required />
            <input className="input" placeholder="Contact phone" value={schoolForm.contact_phone} onChange={(e) => setSchoolForm((s) => ({ ...s, contact_phone: e.target.value }))} />
            <input className="input md:col-span-2" placeholder="Services taken, comma separated" value={schoolForm.services_taken} onChange={(e) => setSchoolForm((s) => ({ ...s, services_taken: e.target.value }))} />
            <button className="btn btn-primary md:col-span-2" disabled={savingSchool}>
              <ShieldCheck className="h-4 w-4" />
              {savingSchool ? 'Creating...' : 'Create School ID'}
            </button>
          </form>
        </div>

        <div className="card">
          <div className="mb-4 flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-950">Create School Admin</h2>
          </div>
          <form className="space-y-3" onSubmit={onCreateAdmin}>
            <select className="input" value={adminForm.schoolId} onChange={(e) => setAdminForm((s) => ({ ...s, schoolId: e.target.value }))} required>
              <option value="" disabled>Select School...</option>
              {schools.map(s => (
                <option key={s.school_code} value={s.school_code}>{s.name} ({s.school_code})</option>
              ))}
            </select>
            <input className="input" placeholder="Admin full name" value={adminForm.name} onChange={(e) => setAdminForm((s) => ({ ...s, name: e.target.value }))} required />
            <input className="input" type="email" placeholder="Admin email" value={adminForm.email} onChange={(e) => setAdminForm((s) => ({ ...s, email: e.target.value }))} required />
            <input className="input" placeholder="Temporary password" value={adminForm.password} onChange={(e) => setAdminForm((s) => ({ ...s, password: e.target.value }))} required />
            <input className="input" placeholder="Phone" value={adminForm.phone} onChange={(e) => setAdminForm((s) => ({ ...s, phone: e.target.value }))} />
            <button className="btn btn-primary w-full" disabled={savingAdmin}>
              <UserPlus className="h-4 w-4" />
              {savingAdmin ? 'Creating...' : 'Create Admin'}
            </button>
          </form>
        </div>

        <div className="card">
          <div className="mb-4 flex items-center gap-2">
            <RefreshCcw className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-950">Create Academic Year</h2>
          </div>
          <form className="grid gap-3 md:grid-cols-2" onSubmit={onCreateAcademicYear}>
            <select className="input md:col-span-2" value={academicYearForm.schoolId} onChange={(e) => setAcademicYearForm((s) => ({ ...s, schoolId: e.target.value }))} required>
              <option value="" disabled>Select School...</option>
              {schools.map(s => (
                <option key={s.school_code} value={s.school_code}>{s.name} ({s.school_code})</option>
              ))}
            </select>
            <input className="input md:col-span-2" placeholder="e.g. 2024-2025" value={academicYearForm.yearName} onChange={(e) => setAcademicYearForm((s) => ({ ...s, yearName: e.target.value }))} required />
            <input className="input" type="date" title="Start Date" value={academicYearForm.startDate} onChange={(e) => setAcademicYearForm((s) => ({ ...s, startDate: e.target.value }))} required />
            <input className="input" type="date" title="End Date" value={academicYearForm.endDate} onChange={(e) => setAcademicYearForm((s) => ({ ...s, endDate: e.target.value }))} required />
            <div className="flex items-center gap-2 md:col-span-2">
              <input type="checkbox" id="isCurrent" checked={academicYearForm.isCurrent} onChange={(e) => setAcademicYearForm((s) => ({ ...s, isCurrent: e.target.checked }))} className="rounded border-gray-300" />
              <label htmlFor="isCurrent" className="text-sm font-medium text-gray-700">Set as Current Working Year</label>
            </div>
            <button className="btn btn-primary md:col-span-2" disabled={savingAcademicYear}>
              {savingAcademicYear ? 'Creating...' : 'Create Academic Year'}
            </button>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="mb-4 text-lg font-bold text-gray-950">Schools</div>
        <div className="overflow-x-auto">
          <table className="table-modern">
            <thead>
              <tr>
                <th>School ID</th>
                <th>School</th>
                <th>Owner</th>
                <th>Renewal</th>
                <th>Services</th>
                <th>Status</th>
                <th>Users</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {schools.map((school) => (
                <tr key={school.id}>
                  <td className="font-bold tracking-wider">{school.school_code}</td>
                  <td>
                    <div className="font-semibold">{school.name}</div>
                    <div className="text-xs text-gray-500">{school.place || school.contact_email}</div>
                  </td>
                  <td>{school.owner_name || '-'}</td>
                  <td>{school.renewal_date?.slice(0, 10) || '-'}</td>
                  <td>{Array.isArray(school.services_taken) ? school.services_taken.join(', ') : '-'}</td>
                  <td><span className={`badge ${school.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{school.is_active ? 'Active' : 'Suspended'}</span></td>
                  <td>{school.user_count || 0}</td>
                  <td><button className="btn btn-outline" onClick={() => onToggle(school)}>{school.is_active ? 'Suspend' : 'Activate'}</button></td>
                </tr>
              ))}
              {!loading && schools.length === 0 && (
                <tr><td colSpan="8" className="py-8 text-center text-gray-500">No schools created yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
