import { useState } from 'react'

export default function CSVUpload({ onUpload, type, isLoading, error, success }) {
  const [file, setFile] = useState(null)
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile.type === 'text/csv' || droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile)
      }
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = () => {
    if (file && onUpload) {
      onUpload(file)
      setFile(null)
    }
  }

  const downloadTemplate = () => {
    let csvContent = ''
    let filename = ''
    
    if (type === 'students') {
      csvContent = 'name,email,phone,address,dateOfBirth,classId,guardianName,guardianRelation,guardianPhone,guardianEmail\n'
      csvContent += 'John Doe,john@example.com,1234567890,123 Main St,2005-01-15,1,Robert Doe,Father,0987654321,robert@example.com\n'
      csvContent += 'Mary Smith,mary@example.com,1234567891,456 Oak Ave,2005-03-20,1,Sarah Smith,Mother,0987654322,sarah@example.com'
      filename = 'students_template.csv'
    } else if (type === 'staff') {
      csvContent = 'name,email,phone,address,dateOfBirth,gender,role,qualification,department,joiningDate,salary\n'
      csvContent += 'Alice Johnson,alice@example.com,1234567890,789 Pine St,1985-05-10,female,teacher,M.Ed,Mathematics,2023-01-15,50000\n'
      csvContent += 'Bob Wilson,bob@example.com,1234567891,321 Elm St,1980-08-25,male,staff,B.A,Administration,2023-02-01,35000'
      filename = 'staff_template.csv'
    }

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="font-semibold">CSV Bulk Upload</div>
        <button 
          type="button"
          className="btn btn-outline btn-sm" 
          onClick={downloadTemplate}
        >
          Download Template
        </button>
      </div>
      
      <div 
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {file ? (
          <div className="space-y-2">
            <div className="text-sm font-medium text-green-600">
              📄 {file.name}
            </div>
            <div className="text-xs text-gray-500">
              {(file.size / 1024).toFixed(1)} KB
            </div>
            <button 
              type="button"
              className="btn btn-outline btn-sm" 
              onClick={() => setFile(null)}
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-gray-500">
              <div className="text-2xl mb-2">📁</div>
              <div className="text-sm">
                Drag and drop your CSV file here, or{' '}
                <label className="text-blue-600 hover:text-blue-700 cursor-pointer underline">
                  browse
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
            <div className="text-xs text-gray-400">
              Only CSV files are supported
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="text-sm text-green-600 bg-green-50 p-3 rounded">
          {success}
        </div>
      )}

      <div className="flex gap-2">
        <button 
          type="button"
          className="btn btn-primary flex-1" 
          onClick={handleUpload}
          disabled={!file || isLoading}
        >
          {isLoading ? 'Processing...' : `Upload ${type}`}
        </button>
      </div>

      <div className="text-xs text-gray-500 space-y-1">
        <div className="font-medium">CSV Format Requirements:</div>
        {type === 'students' && (
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Required: name, email, phone, classId</li>
            <li>Optional: address, dateOfBirth, guardianName, guardianRelation, guardianPhone, guardianEmail</li>
            <li>classId should be the numeric ID of an existing class</li>
            <li>dateOfBirth format: YYYY-MM-DD</li>
            <li>guardianRelation should be either 'Father' or 'Mother'</li>
            <li>Student ID will be auto-generated: First 3 letters of name + First 2 letters of guardian name + Birth year</li>
          </ul>
        )}
        {type === 'staff' && (
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Required: name, email, phone, role</li>
            <li>Optional: address, dateOfBirth, gender, qualification, department, joiningDate, salary</li>
            <li>role should be either 'teacher' or 'staff'</li>
            <li>gender should be 'male', 'female', or 'other'</li>
            <li>dateOfBirth and joiningDate format: YYYY-MM-DD</li>
          </ul>
        )}
      </div>
    </div>
  )
}
