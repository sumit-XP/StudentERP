import { useState, useEffect, useRef } from 'react'
import { getClasses } from '../services/academic'
import html2pdf from 'html2pdf.js'
import { getUser } from '../services/auth'
import api from '../services/api'

// --- Teacher Upload Marks View ---
function TeacherReportView({ classes }) {
  const [selectedClass, setSelectedClass] = useState('')
  const [subjects, setSubjects] = useState([])
  const [selectedSubject, setSelectedSubject] = useState('')
  const [examType, setExamType] = useState('')
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const examTypes = ['Unit Test', 'Term 1', 'Term 2', 'Final']

  useEffect(() => {
    if (selectedClass) {
      api.get('/subjects', { params: { classId: selectedClass } })
        .then(res => {
          setSubjects(res.data.subjects || [])
          setSelectedSubject('')
        })
        .catch(err => console.error(err))
    } else {
      setSubjects([])
      setSelectedSubject('')
    }
  }, [selectedClass])

  useEffect(() => {
    if (selectedClass && selectedSubject && examType) {
      fetchGrades()
    } else {
      setStudents([])
    }
  }, [selectedClass, selectedSubject, examType])

  const fetchGrades = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await api.get(`/classes/${selectedClass}/subjects/${selectedSubject}/grades`, {
        params: { examType }
      })
      // grades array has: student_id, student_name, roll_number, marks_obtained, max_marks, grade_letter
      setStudents(res.data.grades || [])
    } catch (err) {
      console.error(err)
      setError("Failed to fetch students/grades.")
    } finally {
      setLoading(false)
    }
  }

  const handleMarkChange = (studentId, value) => {
    setStudents(prev => prev.map(s => s.student_id === studentId ? { ...s, marks_obtained: value } : s))
  }

  const handleGradeChange = (studentId, value) => {
    setStudents(prev => prev.map(s => s.student_id === studentId ? { ...s, grade_letter: value } : s))
  }

  const handleMaxMarksChange = (studentId, value) => {
    setStudents(prev => prev.map(s => s.student_id === studentId ? { ...s, max_marks: value } : s))
  }

  const submitMarks = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const payload = {
        examType,
        grades: students.map(s => ({
          studentId: s.student_id,
          marksObtained: s.marks_obtained,
          maxMarks: s.max_marks || 100,
          gradeLetter: s.grade_letter || ''
        }))
      }
      await api.post(`/classes/${selectedClass}/subjects/${selectedSubject}/grades`, payload)
      setSuccess("Marks successfully saved!")
    } catch (err) {
      console.error(err)
      setError("Failed to save marks. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-sm space-y-4">
        <h3 className="font-semibold text-lg">Select Class & Subject to Upload Marks</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Class</label>
            <select 
              className="w-full bg-surface-container-low border border-outline-variant rounded-xl p-3 focus:ring-primary focus:border-primary"
              value={selectedClass} 
              onChange={e => setSelectedClass(e.target.value)}
            >
              <option value="">-- Choose Class --</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name} {c.section}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Subject</label>
            <select 
              className="w-full bg-surface-container-low border border-outline-variant rounded-xl p-3 focus:ring-primary focus:border-primary disabled:opacity-50"
              value={selectedSubject}
              onChange={e => setSelectedSubject(e.target.value)}
              disabled={!selectedClass}
            >
              <option value="">-- Choose Subject --</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Exam Type</label>
            <select 
              className="w-full bg-surface-container-low border border-outline-variant rounded-xl p-3 focus:ring-primary focus:border-primary"
              value={examType}
              onChange={e => setExamType(e.target.value)}
            >
              <option value="">-- Choose Exam --</option>
              {examTypes.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
        </div>
      </div>

      {loading && <div className="text-center py-10 animate-pulse text-primary font-medium">Loading students...</div>}
      {error && <div className="p-4 bg-error-container text-error rounded-xl font-medium">{error}</div>}
      {success && <div className="p-4 bg-teal-50 text-teal-700 border border-teal-200 rounded-xl font-medium">{success}</div>}

      {!loading && students.length > 0 && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-on-surface">Enter Marks</h3>
            <button 
              onClick={submitMarks}
              disabled={saving}
              className="bg-primary text-on-primary px-6 py-2.5 rounded-lg font-semibold hover:bg-primary/90 hover:shadow-lg transition-all disabled:opacity-70 flex items-center gap-2"
            >
              {saving ? 'Saving...' : 'Submit Marks'}
            </button>
          </div>
          
          <div className="flex-1 overflow-auto rounded-lg border border-outline-variant">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low text-on-surface-variant">
                  <th className="py-3 px-4 text-sm font-semibold w-16">Roll</th>
                  <th className="py-3 px-4 text-sm font-semibold">Student Name</th>
                  <th className="py-3 px-4 text-sm font-semibold w-32">Max Marks</th>
                  <th className="py-3 px-4 text-sm font-semibold w-32">Marks Obtained</th>
                  <th className="py-3 px-4 text-sm font-semibold w-32">Grade (Opt)</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s.student_id} className="border-b border-surface-variant hover:bg-surface-container-low transition-colors">
                    <td className="py-3 px-4 text-sm text-on-surface-variant">{s.roll_number || '-'}</td>
                    <td className="py-3 px-4 text-base font-medium text-on-surface">{s.student_name}</td>
                    <td className="py-2 px-4">
                      <input 
                        type="number" 
                        className="w-full bg-surface border border-outline-variant rounded-lg p-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                        value={s.max_marks || 100}
                        onChange={e => handleMaxMarksChange(s.student_id, e.target.value)}
                      />
                    </td>
                    <td className="py-2 px-4">
                      <input 
                        type="number" 
                        step="0.1"
                        className="w-full bg-surface border border-outline-variant rounded-lg p-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                        value={s.marks_obtained !== null && s.marks_obtained !== undefined ? s.marks_obtained : ''}
                        onChange={e => handleMarkChange(s.student_id, e.target.value)}
                        placeholder="e.g. 85"
                      />
                    </td>
                    <td className="py-2 px-4">
                      <input 
                        type="text" 
                        className="w-full bg-surface border border-outline-variant rounded-lg p-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none uppercase"
                        value={s.grade_letter || ''}
                        onChange={e => handleGradeChange(s.student_id, e.target.value)}
                        placeholder="e.g. A"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// --- Main Reports Component ---
export default function Reports() {
  const user = getUser()
  const isStudent = user?.role === 'student' || user?.role === 'parent'
  const isTeacher = user?.role === 'teacher'
  
  const [classes, setClasses] = useState([])
  const [selectedClass, setSelectedClass] = useState('')
  const [searchName, setSearchName] = useState('')
  const [students, setStudents] = useState([])
  
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [reportData, setReportData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const reportRef = useRef(null)

  useEffect(() => {
    if (!isStudent) {
      getClasses().then(res => setClasses(res.data.classes || []))
    } else {
      fetchOwnReportCard()
    }
  }, [isStudent])

  // Search students when class or name changes
  useEffect(() => {
    if (isStudent || isTeacher || !selectedClass) return
    
    const fetchStudents = async () => {
      try {
        const res = await api.get('/students', { params: { classId: selectedClass } })
        let list = res.data.students || []
        if (searchName) {
          list = list.filter(s => ((s.first_name || '') + ' ' + (s.last_name || '') + (s.name || '')).toLowerCase().includes(searchName.toLowerCase()))
        }
        setStudents(list)
      } catch (err) {
        console.error("Failed to fetch students", err)
      }
    }
    const timer = setTimeout(fetchStudents, 300)
    return () => clearTimeout(timer)
  }, [selectedClass, searchName, isStudent, isTeacher])

  const fetchOwnReportCard = async () => {
    try {
      setLoading(true)
      const res = await api.get('/students') 
      if (res.data.students && res.data.students.length > 0) {
        loadReportCard(res.data.students[0].id)
      } else {
        setError("Student record not found.")
      }
    } catch (err) {
      console.error(err)
      setError("Failed to load student data.")
    } finally {
      setLoading(false)
    }
  }

  const loadReportCard = async (studentId) => {
    setLoading(true)
    setError(null)
    setReportData(null)
    try {
      const res = await api.get(`/students/${studentId}/grades`)
      setReportData(res.data)
    } catch (err) {
      console.error(err)
      setError("Failed to load report card. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPdf = () => {
    if (!reportRef.current) return
    const element = reportRef.current
    const opt = {
      margin:       0.5,
      filename:     `${reportData?.student?.name?.replace(/\s+/g, '_') || 'Student'}_Report_Card.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    }
    html2pdf().set(opt).from(element).save()
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-on-surface">
            {isTeacher ? "Upload Marks" : "Academic Reports"}
          </h2>
          <p className="text-on-surface-variant mt-1">
            {isTeacher ? "Enter and submit grades for your classes." : "View and download student yearly report cards."}
          </p>
        </div>
      </div>

      {isTeacher ? (
        <TeacherReportView classes={classes} />
      ) : (
        <>
          {/* Admin / Student View */}
          {!isStudent && (
            <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-sm space-y-4">
              <h3 className="font-semibold text-lg">Search Student</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Select Class</label>
                  <select 
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl p-3 focus:ring-primary focus:border-primary"
                    value={selectedClass} 
                    onChange={e => setSelectedClass(e.target.value)}
                  >
                    <option value="">-- Choose Class --</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name} {c.section}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Student Name</label>
                  <input 
                    type="text" 
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl p-3 focus:ring-primary focus:border-primary disabled:opacity-50"
                    placeholder="Search name..."
                    value={searchName}
                    onChange={e => setSearchName(e.target.value)}
                    disabled={!selectedClass}
                  />
                </div>
              </div>
              
              {selectedClass && (
                <div className="mt-4 border-t border-outline-variant pt-4">
                  <label className="block text-sm font-medium mb-2">Select a student from the list ({students.length} found)</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-48 overflow-y-auto pr-2">
                    {students.map(s => (
                      <button 
                        key={s.id}
                        onClick={() => { setSelectedStudent(s); loadReportCard(s.id); }}
                        className={`text-left p-3 rounded-xl border transition-all ${selectedStudent?.id === s.id ? 'bg-primary-container text-on-primary-container border-primary shadow-sm' : 'bg-surface border-outline-variant hover:border-primary/50'}`}
                      >
                        <div className="font-medium">{s.first_name || s.name} {s.last_name || ''}</div>
                        <div className="text-xs opacity-70">Roll: {s.roll_number || 'N/A'}</div>
                      </button>
                    ))}
                    {students.length === 0 && <div className="text-sm text-outline italic col-span-3">No students found.</div>}
                  </div>
                </div>
              )}
            </div>
          )}

          {loading && <div className="text-center py-10 animate-pulse text-primary font-medium">Loading report card...</div>}
          {error && <div className="p-4 bg-error-container text-error rounded-xl font-medium">{error}</div>}

          {reportData && !loading && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex justify-end">
                <button 
                  onClick={handleDownloadPdf}
                  className="bg-primary text-on-primary px-6 py-2.5 rounded-full font-medium hover:bg-primary/90 hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined">download</span>
                  Save as PDF
                </button>
              </div>

              <div className="bg-white text-black p-8 sm:p-12 rounded-lg shadow-xl overflow-x-auto border border-gray-200">
                {/* PDF Content Area */}
                <div ref={reportRef} className="min-w-[700px] bg-white p-4 font-sans text-gray-900">
                  
                  {/* Header */}
                  <div className="text-center border-b-2 border-gray-800 pb-6 mb-8">
                    <h1 className="text-3xl font-bold uppercase tracking-wider text-blue-900 mb-2">School ERP Academy</h1>
                    <p className="text-gray-600 font-medium text-lg">Yearly Academic Report Card</p>
                    <p className="text-gray-500 text-sm mt-1">Academic Year 2023-2024</p>
                  </div>

                  {/* Student Details */}
                  <div className="grid grid-cols-2 gap-6 mb-8">
                    <div className="space-y-2">
                      <div className="flex"><span className="w-32 font-bold text-gray-700">Student Name:</span> <span className="font-medium border-b border-gray-300 flex-1">{reportData.student?.name || (reportData.student?.first_name + ' ' + reportData.student?.last_name)}</span></div>
                      <div className="flex"><span className="w-32 font-bold text-gray-700">Class:</span> <span className="font-medium border-b border-gray-300 flex-1">{reportData.student?.class_name} {reportData.student?.class_section}</span></div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex"><span className="w-32 font-bold text-gray-700">Enrollment No:</span> <span className="font-medium border-b border-gray-300 flex-1">{reportData.student?.enrollment_number || 'N/A'}</span></div>
                      <div className="flex"><span className="w-32 font-bold text-gray-700">Date:</span> <span className="font-medium border-b border-gray-300 flex-1">{new Date().toLocaleDateString()}</span></div>
                    </div>
                  </div>

                  {/* Grades Table */}
                  <table className="w-full border-collapse border border-gray-800 mb-8 text-left">
                    <thead>
                      <tr className="bg-gray-100 text-gray-800">
                        <th className="border border-gray-800 p-3 font-bold">Subject Code</th>
                        <th className="border border-gray-800 p-3 font-bold">Subject Name</th>
                        <th className="border border-gray-800 p-3 font-bold text-center">Maximum Marks</th>
                        <th className="border border-gray-800 p-3 font-bold text-center">Marks Obtained</th>
                        <th className="border border-gray-800 p-3 font-bold text-center">Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.grades && reportData.grades.length > 0 ? (
                        reportData.grades.map(g => (
                          <tr key={g.id}>
                            <td className="border border-gray-800 p-3 text-gray-700">{g.subject_code || '-'}</td>
                            <td className="border border-gray-800 p-3 font-semibold text-gray-900">{g.subject_name}</td>
                            <td className="border border-gray-800 p-3 text-center">{g.max_marks || 100}</td>
                            <td className="border border-gray-800 p-3 text-center font-bold">{g.marks_obtained !== null ? g.marks_obtained : '-'}</td>
                            <td className="border border-gray-800 p-3 text-center font-bold text-blue-700">{g.grade_letter || '-'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="border border-gray-800 p-6 text-center text-gray-500 italic">
                            No grades recorded for this student yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    {reportData.grades && reportData.grades.length > 0 && (
                      <tfoot>
                        <tr className="bg-gray-50 font-bold">
                          <td colSpan="2" className="border border-gray-800 p-3 text-right">Total:</td>
                          <td className="border border-gray-800 p-3 text-center">
                            {reportData.grades.reduce((sum, g) => sum + (Number(g.max_marks) || 100), 0)}
                          </td>
                          <td className="border border-gray-800 p-3 text-center text-blue-800 text-lg">
                            {reportData.grades.reduce((sum, g) => sum + (Number(g.marks_obtained) || 0), 0)}
                          </td>
                          <td className="border border-gray-800 p-3 text-center"></td>
                        </tr>
                      </tfoot>
                    )}
                  </table>

                  {/* Signatures */}
                  <div className="flex justify-between items-end mt-24 pt-8">
                    <div className="text-center w-48">
                      <div className="border-b border-gray-800 h-8 mb-2"></div>
                      <span className="font-bold text-gray-700">Class Teacher</span>
                    </div>
                    <div className="text-center w-48">
                      <div className="border-b border-gray-800 h-8 mb-2"></div>
                      <span className="font-bold text-gray-700">Principal</span>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
