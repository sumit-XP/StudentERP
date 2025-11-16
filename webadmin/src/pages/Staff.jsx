import { useEffect, useMemo, useState } from 'react'
import { registerUser, listUsers, getRole } from '../services/auth'
import { createTeacher, uploadResourceFile } from '../services/academic'
import CSVUpload from '../components/CSVUpload'

const TAB_CONFIGS = [
  { key: 'view', label: 'View Staff' },
  { key: 'create', label: 'Add New Staff', adminOnly: true },
  { key: 'bulk', label: 'Bulk Import', adminOnly: true },
]

const DEFAULT_STAFF_PASSWORD = 'Welcome@123'

export default function Staff() {
  const [users, setUsers] = useState([])
  const [query, setQuery] = useState({ role: 'teacher', search: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const role = useMemo(() => getRole(), [])
  const availableTabs = useMemo(
    () => TAB_CONFIGS.filter((tab) => !tab.adminOnly || role === 'admin'),
    [role]
  )
  const [currentTab, setCurrentTab] = useState(availableTabs[0]?.key || 'view')

  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: DEFAULT_STAFF_PASSWORD,
    phone: '',
    address: '',
    dateOfBirth: '',
    gender: '',
    role: 'teacher',
    employeeId: '',
    qualification: '',
    department: '',
    joiningDate: '',
    salary: '',
    photo: null,
    idProof: null,
  })
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState('')
  const [createSuccess, setCreateSuccess] = useState('')
  const [uploadingFiles, setUploadingFiles] = useState(false)

  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkError, setBulkError] = useState('')
  const [bulkSuccess, setBulkSuccess] = useState('')

  useEffect(() => {
    if (!availableTabs.find((tab) => tab.key === currentTab)) {
      setCurrentTab(availableTabs[0]?.key || 'view')
    }
  }, [availableTabs, currentTab])

  useEffect(() => {
    generateEmployeeId()
  }, [])

  const generateEmployeeId = () => {
    const timestamp = Date.now().toString().slice(-6)
    const randomPart = Math.random().toString(36).substring(2, 4).toUpperCase()
    setCreateForm(prev => ({ ...prev, employeeId: `EMP-${timestamp}${randomPart}` }))
  }

  const loadUsers = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await listUsers({ role: query.role || undefined, search: query.search || undefined })
      setUsers(res.data.users || [])
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load staff list')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onSearch = async (e) => {
    e.preventDefault()
    await loadUsers()
  }

  const onCreateStaff = async (e) => {
    e.preventDefault()
    setCreateError('')
    setCreateSuccess('')
    setCreateLoading(true)
    try {
      const { name, email, password, phone, address, dateOfBirth, gender, role: staffRole, employeeId, qualification, department, joiningDate, salary, photo, idProof } = createForm

      if (!name || !email || !phone || !employeeId || !staffRole) {
        setCreateError('Name, Email, Phone, Employee ID, and Role are required')
        setCreateLoading(false)
        return
      }

      setUploadingFiles(true)
      let photoUrl = null
      let idProofUrl = null

      try {
        if (photo) {
          const formData = new FormData()
          formData.append('resourceFile', photo)
          const res = await uploadResourceFile(formData)
          photoUrl = res.data.fileUrl
        }
        if (idProof) {
          const formData = new FormData()
          formData.append('resourceFile', idProof)
          const res = await uploadResourceFile(formData)
          idProofUrl = res.data.fileUrl
        }
      } catch (uploadErr) {
        setCreateError('Failed to upload files: ' + (uploadErr?.response?.data?.error || uploadErr.message))
        setUploadingFiles(false)
        setCreateLoading(false)
        return
      }
      setUploadingFiles(false)

      const finalPassword = password || DEFAULT_STAFF_PASSWORD

      try {
        await registerUser({
          email,
          password: finalPassword,
          name,
          role: staffRole,
          phone: phone || undefined,
          address: address || undefined,
          dateOfBirth: dateOfBirth || undefined,
          gender: gender || undefined,
        })
      } catch (_) {
        // ignore duplicate; we'll still try to find the user
      }

      const usersRes = await listUsers({ role: staffRole, search: email })
      const u = (usersRes.data.users || []).find((usr) => usr.email === email)
      if (!u) {
        setCreateError('User created, but user id not found. Please check Users list.')
        setCreateLoading(false)
        return
      }

      if (staffRole === 'teacher') {
        await createTeacher({
          userId: u.id,
          employeeId,
          qualification: qualification || null,
          department: department || null,
          joiningDate: joiningDate || null,
          salary: salary ? Number(salary) : null,
        })
      }

      setCreateForm({
        name: '',
        email: '',
        password: DEFAULT_STAFF_PASSWORD,
        phone: '',
        address: '',
        dateOfBirth: '',
        gender: '',
        role: 'teacher',
        employeeId: '',
        qualification: '',
        department: '',
        joiningDate: '',
        salary: '',
        photo: null,
        idProof: null,
      })
      generateEmployeeId()
      setCreateSuccess('Staff member created successfully!')
      await loadUsers()
    } catch (err) {
      setCreateError(err?.response?.data?.error || err.message || 'Failed to create staff member')
    } finally {
      setCreateLoading(false)
    }
  }

  const parseCSV = (csvText) => {
    const lines = csvText.split('\n').filter(line => line.trim())
    if (lines.length < 2) throw new Error('CSV must have at least a header row and one data row')
    
    const headers = lines[0].split(',').map(h => h.trim())
    const rows = []
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      if (values.length !== headers.length) continue
      
      const row = {}
      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })
      rows.push(row)
    }
    
    return rows
  }

  const onCSVUpload = async (file) => {
    setBulkLoading(true)
    setBulkError('')
    setBulkSuccess('')
    
    try {
      const csvText = await file.text()
      const staffMembers = parseCSV(csvText)
      
      if (staffMembers.length === 0) {
        throw new Error('No valid staff records found in CSV')
      }

      let successCount = 0
      let errorCount = 0
      const errors = []

      for (const [index, staff] of staffMembers.entries()) {
        try {
          const { name, email, phone, address, dateOfBirth, gender, role: staffRole, qualification, department, joiningDate, salary } = staff
          
          if (!name || !email || !phone || !staffRole) {
            throw new Error(`Row ${index + 2}: Missing required fields (name, email, phone, role)`)
          }

          if (!['teacher', 'staff'].includes(staffRole)) {
            throw new Error(`Row ${index + 2}: Role must be either 'teacher' or 'staff'`)
          }

          const timestamp = Date.now().toString().slice(-6)
          const randomPart = Math.random().toString(36).substring(2, 4).toUpperCase()
          const employeeId = `EMP-${timestamp}${randomPart}`

          try {
            await registerUser({
              email,
              password: DEFAULT_STAFF_PASSWORD,
              name,
              role: staffRole,
              phone: phone || undefined,
              address: address || undefined,
              dateOfBirth: dateOfBirth || undefined,
              gender: gender || undefined,
            })
          } catch (_) {
            // ignore duplicate; we'll still try to find the user
          }

          const usersRes = await listUsers({ role: staffRole, search: email })
          const u = (usersRes.data.users || []).find((usr) => usr.email === email)
          if (!u) {
            throw new Error(`User creation failed for ${email}`)
          }

          if (staffRole === 'teacher') {
            await createTeacher({
              userId: u.id,
              employeeId,
              qualification: qualification || null,
              department: department || null,
              joiningDate: joiningDate || null,
              salary: salary ? Number(salary) : null,
            })
          }

          successCount++
        } catch (err) {
          errorCount++
          errors.push(`Row ${index + 2}: ${err.message}`)
        }
      }

      if (successCount > 0) {
        setBulkSuccess(`Successfully imported ${successCount} staff members. ${errorCount > 0 ? `${errorCount} failed.` : ''}`)
        await loadUsers()
      }
      
      if (errors.length > 0) {
        setBulkError(`Import completed with errors:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? `\n...and ${errors.length - 5} more errors` : ''}`)
      }
    } catch (err) {
      setBulkError(err.message || 'Failed to process CSV file')
    } finally {
      setBulkLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex flex-wrap gap-2">
          {availableTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`btn ${currentTab === tab.key ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setCurrentTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {currentTab === 'create' && (
        <div className="card">
          <div className="font-semibold mb-2">Add New Teacher/Staff Member</div>
          <div className="text-xs text-gray-500 mb-3">
            Enter staff details below. Employee ID is auto-generated. Default password is {DEFAULT_STAFF_PASSWORD}.
          </div>
          {createError && <div className="text-sm text-red-600 mb-2">{createError}</div>}
          {createSuccess && <div className="text-sm text-green-600 mb-2">{createSuccess}</div>}
          <form onSubmit={onCreateStaff} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <input
                className="input"
                placeholder="Full Name *"
                value={createForm.name}
                onChange={e => setCreateForm(s => ({ ...s, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1">
              <input
                className="input"
                type="email"
                placeholder="Email *"
                value={createForm.email}
                onChange={e => setCreateForm(s => ({ ...s, email: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1">
              <input
                className="input"
                type="tel"
                placeholder="Phone *"
                value={createForm.phone}
                onChange={e => setCreateForm(s => ({ ...s, phone: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1">
              <input
                className="input bg-gray-100"
                placeholder="Employee ID (auto-generated) *"
                value={createForm.employeeId}
                readOnly
                required
              />
              <div className="text-[10px] text-gray-500">Auto-generated</div>
            </div>
            <div className="space-y-1">
              <select
                className="input"
                value={createForm.role}
                onChange={e => setCreateForm(s => ({ ...s, role: e.target.value }))}
                required
              >
                <option value="teacher">Teacher</option>
                <option value="staff">Non-teaching Staff</option>
              </select>
            </div>
            <div className="space-y-1">
              <select
                className="input"
                value={createForm.gender}
                onChange={e => setCreateForm(s => ({ ...s, gender: e.target.value }))}
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-1">
              <input
                className="input"
                type="date"
                placeholder="Date of Birth"
                value={createForm.dateOfBirth}
                onChange={e => setCreateForm(s => ({ ...s, dateOfBirth: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <input
                className="input"
                placeholder="Address"
                value={createForm.address}
                onChange={e => setCreateForm(s => ({ ...s, address: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <input
                className="input"
                placeholder="Qualification (e.g. B.Ed, M.Sc)"
                value={createForm.qualification}
                onChange={e => setCreateForm(s => ({ ...s, qualification: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <input
                className="input"
                placeholder="Department (e.g. Mathematics, Science)"
                value={createForm.department}
                onChange={e => setCreateForm(s => ({ ...s, department: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <input
                className="input"
                type="date"
                placeholder="Joining Date"
                value={createForm.joiningDate}
                onChange={e => setCreateForm(s => ({ ...s, joiningDate: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <input
                className="input"
                type="number"
                placeholder="Salary (optional)"
                value={createForm.salary}
                onChange={e => setCreateForm(s => ({ ...s, salary: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <div className="label">Photo</div>
              <input
                type="file"
                accept="image/*"
                className="input"
                onChange={e => setCreateForm(s => ({ ...s, photo: e.target.files[0] }))}
              />
            </div>
            <div className="space-y-1">
              <div className="label">ID Proof</div>
              <input
                type="file"
                accept="image/*,application/pdf"
                className="input"
                onChange={e => setCreateForm(s => ({ ...s, idProof: e.target.files[0] }))}
              />
            </div>
            <div className="space-y-1 md:col-span-3">
              <div className="label">Login Password</div>
              <input
                className="input bg-gray-100"
                type="text"
                value={createForm.password}
                readOnly
              />
              <div className="text-[10px] text-gray-500">Default password: {DEFAULT_STAFF_PASSWORD}. Staff can change this after first login.</div>
            </div>
            <div className="md:col-span-3 text-xs text-gray-500">
              Fields marked * are mandatory. Employee ID is auto-generated. You can upload photo and ID proof now or later.
            </div>
            <div className="md:col-span-3">
              <button className="btn btn-primary w-full" disabled={createLoading || uploadingFiles}>
                {uploadingFiles ? 'Uploading files...' : createLoading ? 'Creating...' : 'Add Staff Member'}
              </button>
            </div>
          </form>
        </div>
      )}

      {currentTab === 'view' && (
        <div className="space-y-4">
          <div className="card">
            <div className="font-semibold mb-2">Teachers & Staff</div>
            <form className="flex flex-col md:flex-row gap-3 items-end" onSubmit={onSearch}>
              <div className="flex-1">
                <div className="label">Role</div>
                <select
                  className="input"
                  value={query.role}
                  onChange={e => setQuery(s => ({ ...s, role: e.target.value }))}
                >
                  <option value="teacher">Teachers</option>
                  <option value="staff">Non-teaching Staff</option>
                  <option value="">All</option>
                </select>
              </div>
              <div className="flex-1">
                <div className="label">Search</div>
                <input
                  className="input"
                  placeholder="Name or Email"
                  value={query.search}
                  onChange={e => setQuery(s => ({ ...s, search: e.target.value }))}
                />
              </div>
              <button className="btn btn-primary" disabled={loading}>{loading ? 'Loading...' : 'Search'}</button>
            </form>
            {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
          </div>

          <div className="card">
            <div className="font-semibold mb-2">Results</div>
            <div className="overflow-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="p-2">Name</th>
                    <th className="p-2">Email</th>
                    <th className="p-2">Phone</th>
                    <th className="p-2">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-t">
                      <td className="p-2">{u.name}</td>
                      <td className="p-2">{u.email}</td>
                      <td className="p-2">{u.phone || '-'}</td>
                      <td className="p-2 capitalize">{u.role || u.role_name}</td>
                    </tr>
                  ))}
                  {users.length === 0 && !loading && (
                    <tr>
                      <td className="p-3 text-gray-500" colSpan={4}>No users found for the selected filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {currentTab === 'bulk' && (
        <div className="card">
          <CSVUpload 
            type="staff"
            onUpload={onCSVUpload}
            isLoading={bulkLoading}
            error={bulkError}
            success={bulkSuccess}
          />
        </div>
      )}
    </div>
  )
}

