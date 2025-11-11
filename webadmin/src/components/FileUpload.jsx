import { useState } from 'react'

export default function FileUpload({ label = 'Upload', field = 'file', onUploaded, uploadFn }) {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onChange = (e) => setFile(e.target.files?.[0] || null)

  const onUpload = async () => {
    if (!file) return setError('Please select a file')
    setError('')
    setLoading(true)
    try {
      const form = new FormData()
      form.append(field, file)
      const res = await uploadFn(form)
      onUploaded?.(res)
    } catch (err) {
      setError(err?.response?.data?.error || err.message)
    } finally { setLoading(false) }
  }

  return (
    <div className="space-y-2">
      <div className="label">{label}</div>
      <input type="file" onChange={onChange} className="input" />
      <div className="flex gap-2">
        <button className="btn btn-secondary" onClick={onUpload} disabled={loading}>{loading ? 'Uploading...' : 'Upload'}</button>
        {error && <div className="text-sm text-red-600">{error}</div>}
      </div>
    </div>
  )
}
