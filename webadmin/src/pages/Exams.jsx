import { useState, useEffect, useRef, useCallback } from 'react'
import { getUser } from '../services/auth'
import {
  getExams, createExam, updateExam,
  getTeacherAssignedSubjects,
  getExamGrades, saveExamGrades,
  getExamClassMatrix, publishClassResult,
  getMyPublishedResults, getStudentPublishedResults,
} from '../services/exams'
import { getClasses } from '../services/academic'
import html2pdf from 'html2pdf.js'
import {
  ClipboardList, Plus, ChevronRight, CheckCircle2, Clock,
  AlertCircle, BookOpen, Send, Save, Eye, Download,
  BarChart2, Users, Award, XCircle, RefreshCw, ArrowLeft, X
} from 'lucide-react'

// ── Helpers ───────────────────────────────────────────────
const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: 'bg-amber-100 text-amber-700 border-amber-200',   icon: Clock },
  draft:     { label: 'Draft',     color: 'bg-blue-100 text-blue-700 border-blue-200',      icon: Save },
  submitted: { label: 'Submitted', color: 'bg-green-100 text-green-700 border-green-200',   icon: CheckCircle2 },
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  )
}

// ══════════════════════════════════════════════════════════
//  ADMIN VIEW
// ══════════════════════════════════════════════════════════
function AdminExamsView() {
  const [exams, setExams] = useState([])
  const [classes, setClasses] = useState([])
  const [selectedExam, setSelectedExam] = useState(null)
  const [selectedClass, setSelectedClass] = useState(null)
  const [matrixData, setMatrixData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [matrixLoading, setMatrixLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [toast, setToast] = useState(null)
  const [form, setForm] = useState({ title: '', examType: 'unit_test', startDate: '', endDate: '', maxMarks: 100 })

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => {
    Promise.all([
      getExams(),
      getClasses()
    ]).then(([examRes, classRes]) => {
      setExams(examRes.data.exams || [])
      setClasses(classRes.data.classes || [])
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (selectedExam && selectedClass) {
      setMatrixLoading(true)
      getExamClassMatrix(selectedExam.id, selectedClass.id)
        .then(res => setMatrixData(res.data))
        .catch(console.error)
        .finally(() => setMatrixLoading(false))
    } else {
      setMatrixData(null)
    }
  }, [selectedExam, selectedClass])

  const handleCreateExam = async (e) => {
    e.preventDefault()
    try {
      const res = await createExam(form)
      setExams(prev => [res.data.exam, ...prev])
      setShowCreateModal(false)
      setForm({ title: '', examType: 'unit_test', startDate: '', endDate: '', maxMarks: 100 })
      showToast('Exam created successfully!')
    } catch (err) {
      showToast(err?.response?.data?.error || 'Failed to create exam', 'error')
    }
  }

  const handlePublish = async () => {
    if (!selectedExam || !selectedClass) return
    setPublishing(true)
    try {
      await publishClassResult(selectedExam.id, selectedClass.id)
      showToast('Result published! Students and parents have been notified.')
      // Refresh matrix
      const res = await getExamClassMatrix(selectedExam.id, selectedClass.id)
      setMatrixData(res.data)
    } catch (err) {
      showToast(err?.response?.data?.error || 'Failed to publish result', 'error')
    } finally {
      setPublishing(false)
    }
  }

  const examTypes = [
    { value: 'unit_test', label: 'Unit Test' },
    { value: 'midterm', label: 'Midterm' },
    { value: 'term', label: 'Term Exam' },
    { value: 'final', label: 'Final Exam' },
    { value: 'other', label: 'Other' },
  ]

  if (loading) return <div className="text-center py-16 text-gray-400 animate-pulse">Loading exams…</div>

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl font-medium text-sm flex items-center gap-2 transition-all
          ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>
          {toast.type === 'error' ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Exams & Results</h2>
          <p className="text-sm text-gray-500 mt-0.5">Create exams, monitor submissions, and publish results</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Create Exam
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Exam List */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">All Exams ({exams.length})</h3>
          {exams.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
              <ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No exams yet. Create one to get started.</p>
            </div>
          ) : exams.map(exam => (
            <button
              key={exam.id}
              onClick={() => { setSelectedExam(exam); setSelectedClass(null); setMatrixData(null); }}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all ${selectedExam?.id === exam.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50'}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-semibold text-gray-900 truncate">{exam.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5 capitalize">{exam.exam_type?.replace(/_/g, ' ')} • {exam.year_name || 'All Years'}</div>
                </div>
                <ChevronRight className={`w-4 h-4 mt-0.5 shrink-0 transition-transform ${selectedExam?.id === exam.id ? 'text-blue-500 rotate-90' : 'text-gray-400'}`} />
              </div>
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                <span>Max: {exam.max_marks} marks</span>
                {exam.start_date && <span>• {fmt(exam.start_date)}</span>}
              </div>
            </button>
          ))}
        </div>

        {/* Class Selection + Matrix */}
        <div className="lg:col-span-2">
          {!selectedExam ? (
            <div className="h-64 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-dashed border-blue-200">
              <div className="text-center">
                <BookOpen className="w-12 h-12 text-blue-300 mx-auto mb-3" />
                <p className="text-blue-400 font-medium">Select an exam to view submission matrix</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Exam Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-5 rounded-2xl shadow">
                <div className="font-bold text-xl">{selectedExam.title}</div>
                <div className="text-blue-200 text-sm mt-0.5 capitalize">
                  {selectedExam.exam_type?.replace(/_/g, ' ')} • Max {selectedExam.max_marks} marks
                </div>
              </div>

              {/* Class selector */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select Class to Review</label>
                <div className="flex flex-wrap gap-2">
                  {classes.map(cls => (
                    <button
                      key={cls.id}
                      onClick={() => setSelectedClass(cls)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all ${selectedClass?.id === cls.id
                        ? 'border-blue-500 bg-blue-600 text-white'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'}`}
                    >
                      {cls.name} {cls.section}
                    </button>
                  ))}
                </div>
              </div>

              {/* Matrix */}
              {matrixLoading && (
                <div className="text-center py-10 text-gray-400 animate-pulse">Loading submission matrix…</div>
              )}
              {matrixData && !matrixLoading && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  {/* Summary Bar */}
                  <div className="px-5 py-4 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-5 text-sm">
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-green-500" />
                        <span className="font-semibold text-gray-700">{matrixData.summary.submitted}</span>
                        <span className="text-gray-500">submitted</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-amber-400" />
                        <span className="font-semibold text-gray-700">{matrixData.summary.pending}</span>
                        <span className="text-gray-500">pending</span>
                      </span>
                      <span className="text-gray-400">/ {matrixData.summary.total} subjects</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {matrixData.publication?.is_published && (
                        <span className="flex items-center gap-1.5 text-xs font-semibold bg-green-100 text-green-700 px-3 py-1.5 rounded-full border border-green-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Published {fmt(matrixData.publication.published_at)}
                        </span>
                      )}
                      {(() => {
                        const isAllSubmitted = matrixData.summary.total > 0 && matrixData.summary.submitted === matrixData.summary.total;
                        return (
                          <div className="flex items-center gap-2">
                            {!isAllSubmitted && (
                              <span className="text-xs font-medium text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                                All subjects required to publish ({matrixData.summary.submitted}/{matrixData.summary.total})
                              </span>
                            )}
                            <button
                              onClick={handlePublish}
                              disabled={publishing || !isAllSubmitted}
                              title={!isAllSubmitted ? `Cannot publish until all ${matrixData.summary.total} subjects are submitted by teachers` : 'Publish result to students & parents'}
                              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:text-gray-500 text-white text-sm font-semibold rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed"
                            >
                              {publishing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                              {matrixData.publication?.is_published ? 'Re-Publish' : 'Publish Result'}
                            </button>
                          </div>
                        )
                      })()}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="px-5 pt-3 pb-1">
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-700"
                        style={{ width: `${matrixData.summary.total > 0 ? (matrixData.summary.submitted / matrixData.summary.total) * 100 : 0}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {matrixData.summary.total > 0
                        ? `${Math.round((matrixData.summary.submitted / matrixData.summary.total) * 100)}% complete`
                        : 'No subjects assigned'}
                    </div>
                  </div>

                  {/* Subject Table */}
                  <div className="divide-y divide-gray-100">
                    {matrixData.subjects.length === 0 ? (
                      <div className="text-center py-10 text-gray-400 text-sm">No subjects assigned to this class.</div>
                    ) : matrixData.subjects.map(sub => (
                      <div key={sub.subject_id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-2.5 h-2.5 rounded-full ${
                            sub.submission_status === 'submitted' ? 'bg-green-500' :
                            sub.submission_status === 'draft' ? 'bg-blue-400' : 'bg-amber-400'
                          }`} />
                          <div>
                            <div className="font-semibold text-gray-800">{sub.subject_name}</div>
                            <div className="text-xs text-gray-500">{sub.teacher_name || 'No teacher assigned'}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={sub.submission_status} />
                          {sub.submitted_at && (
                            <span className="text-xs text-gray-400">{fmt(sub.submitted_at)}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Exam Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">Create New Exam</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateExam} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Exam Title *</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="e.g. Unit Test 1, Term 1 Final Exam"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Exam Type *</label>
                <select
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={form.examType}
                  onChange={e => setForm(f => ({ ...f, examType: e.target.value }))}
                >
                  {examTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Start Date</label>
                  <input type="date" className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">End Date</label>
                  <input type="date" className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Default Max Marks</label>
                <input
                  type="number"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={form.maxMarks}
                  onChange={e => setForm(f => ({ ...f, maxMarks: Number(e.target.value) }))}
                  min={1}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors">
                  Create Exam
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════
//  TEACHER VIEW
// ══════════════════════════════════════════════════════════
function TeacherExamsView() {
  const [exams, setExams] = useState([])
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedExam, setSelectedExam] = useState(null)
  const [selectedAssignment, setSelectedAssignment] = useState(null) // {subject_id, class_id, ...}
  const [grades, setGrades] = useState([])
  const [submission, setSubmission] = useState({ status: 'pending' })
  const [gradesLoading, setGradesLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => {
    Promise.all([getExams({ isActive: 'true' }), getTeacherAssignedSubjects()])
      .then(([examRes, assignRes]) => {
        setExams(examRes.data.exams || [])
        setAssignments(assignRes.data.assignments || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleSelectAssignment = async (exam, assignment) => {
    setSelectedExam(exam)
    setSelectedAssignment(assignment)
    setGradesLoading(true)
    try {
      const res = await getExamGrades(exam.id, assignment.class_id, assignment.subject_id)
      setGrades(res.data.grades || [])
      setSubmission(res.data.submission || { status: 'pending' })
    } catch (err) {
      showToast('Failed to load students', 'error')
    } finally {
      setGradesLoading(false)
    }
  }

  const handleMarkChange = (studentId, field, value) => {
    setGrades(prev => prev.map(g => g.student_id === studentId ? { ...g, [field]: value } : g))
  }

  const handleSave = async (action) => {
    setSaving(true)
    try {
      const payload = {
        action,
        grades: grades.map(g => ({
          studentId: g.student_id,
          marksObtained: g.marks_obtained !== undefined && g.marks_obtained !== '' ? g.marks_obtained : null,
          maxMarks: g.max_marks || selectedExam.max_marks || 100,
          gradeLetter: g.grade_letter || '',
        }))
      }
      const res = await saveExamGrades(selectedExam.id, selectedAssignment.class_id, selectedAssignment.subject_id, payload)
      setSubmission({ status: res.data.status })
      showToast(res.data.message)
    } catch (err) {
      showToast(err?.response?.data?.error || 'Failed to save', 'error')
    } finally {
      setSaving(false)
    }
  }

  const isSubmitted = submission.status === 'submitted'

  if (loading) return <div className="text-center py-16 text-gray-400 animate-pulse">Loading…</div>

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl font-medium text-sm flex items-center gap-2
          ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>
          {toast.type === 'error' ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Update Results</h2>
        <p className="text-sm text-gray-500 mt-0.5">Select an exam and your assigned subject to enter marks</p>
      </div>

      {/* Step 1: Select Exam */}
      {!selectedExam ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Step 1 — Select Exam</h3>
          {exams.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
              <ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No active exams. Ask your admin to create one.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {exams.map(exam => (
                <button
                  key={exam.id}
                  onClick={() => setSelectedExam(exam)}
                  className="text-left p-5 bg-white border-2 border-gray-200 hover:border-blue-400 hover:shadow-md rounded-2xl transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-colors">
                    <ClipboardList className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="font-bold text-gray-900">{exam.title}</div>
                  <div className="text-xs text-gray-500 mt-1 capitalize">{exam.exam_type?.replace(/_/g, ' ')}</div>
                  <div className="text-xs text-gray-400 mt-1">Max Marks: {exam.max_marks}</div>
                  {exam.start_date && <div className="text-xs text-gray-400">{fmt(exam.start_date)} – {fmt(exam.end_date)}</div>}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : !selectedAssignment ? (
        // Step 2: Select Subject-Class
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <button onClick={() => { setSelectedExam(null); setSelectedAssignment(null); }}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 font-medium">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <div className="h-4 w-px bg-gray-300" />
            <div className="font-bold text-gray-900">{selectedExam.title}</div>
          </div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Step 2 — Select Your Subject & Class</h3>
          {assignments.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
              <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No subjects assigned to you yet. Contact your admin.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignments.map(asgn => (
                <button
                  key={`${asgn.class_id}-${asgn.subject_id}`}
                  onClick={() => handleSelectAssignment(selectedExam, asgn)}
                  className="text-left p-5 bg-white border-2 border-gray-200 hover:border-blue-400 hover:shadow-md rounded-2xl transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center mb-3">
                    <BookOpen className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="font-bold text-gray-900">{asgn.subject_name}</div>
                  <div className="text-sm text-gray-600 mt-0.5">{asgn.class_name} {asgn.class_section}</div>
                  <div className="text-xs text-gray-400 mt-1">Grade {asgn.grade_level}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        // Step 3: Enter Marks
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <button onClick={() => setSelectedAssignment(null)}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 font-medium">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <div className="h-4 w-px bg-gray-300" />
              <div>
                <div className="font-bold text-gray-900">{selectedAssignment.subject_name} — {selectedAssignment.class_name} {selectedAssignment.class_section}</div>
                <div className="text-xs text-gray-500">{selectedExam.title}</div>
              </div>
            </div>
            <StatusBadge status={submission.status} />
          </div>

          {isSubmitted && (
            <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 text-sm">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <div>
                <div className="font-semibold">Marks submitted to admin</div>
                <div className="text-xs text-green-600">Results are pending admin review and publication.</div>
              </div>
            </div>
          )}

          {gradesLoading ? (
            <div className="text-center py-12 text-gray-400 animate-pulse">Loading students…</div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 w-16">Roll</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Student Name</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 w-28">Max Marks</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 w-32">Marks Secured</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 w-24">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {grades.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-10 text-gray-400">No students found in this class.</td>
                      </tr>
                    ) : grades.map(s => (
                      <tr key={s.student_id} className={`hover:bg-gray-50 transition-colors ${isSubmitted ? 'opacity-80' : ''}`}>
                        <td className="px-4 py-2.5 text-gray-500 text-xs font-mono">{s.roll_number || '—'}</td>
                        <td className="px-4 py-2.5 font-medium text-gray-900">{s.student_name}</td>
                        <td className="px-4 py-2.5">
                          <input
                            type="number"
                            disabled={isSubmitted}
                            className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm disabled:bg-gray-50 disabled:text-gray-400 focus:ring-2 focus:ring-blue-400 outline-none"
                            value={s.max_marks ?? selectedExam.max_marks ?? 100}
                            onChange={e => handleMarkChange(s.student_id, 'max_marks', e.target.value)}
                          />
                        </td>
                        <td className="px-4 py-2.5">
                          <input
                            type="number"
                            step="0.5"
                            disabled={isSubmitted}
                            className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm disabled:bg-gray-50 disabled:text-gray-400 focus:ring-2 focus:ring-blue-400 outline-none"
                            value={s.marks_obtained !== null && s.marks_obtained !== undefined ? s.marks_obtained : ''}
                            onChange={e => handleMarkChange(s.student_id, 'marks_obtained', e.target.value)}
                            placeholder="Enter marks"
                          />
                        </td>
                        <td className="px-4 py-2.5">
                          <input
                            type="text"
                            disabled={isSubmitted}
                            className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm uppercase disabled:bg-gray-50 disabled:text-gray-400 focus:ring-2 focus:ring-blue-400 outline-none"
                            value={s.grade_letter || ''}
                            onChange={e => handleMarkChange(s.student_id, 'grade_letter', e.target.value)}
                            placeholder="A"
                            maxLength={2}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {!isSubmitted && (
                <div className="px-4 py-4 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-end gap-3">
                  <button
                    onClick={() => handleSave('draft')}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-100 disabled:opacity-50 transition-all"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving…' : 'Save Draft'}
                  </button>
                  <button
                    onClick={() => handleSave('submit')}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-xl font-semibold text-sm transition-all"
                  >
                    <Send className="w-4 h-4" />
                    {saving ? 'Submitting…' : 'Submit to Admin'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════
//  STUDENT / PARENT VIEW
// ══════════════════════════════════════════════════════════
function StudentResultsView() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedExamId, setSelectedExamId] = useState(null)
  const [examData, setExamData] = useState(null)
  const [examLoading, setExamLoading] = useState(false)
  const reportRef = useRef(null)

  useEffect(() => {
    getMyPublishedResults()
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const loadExam = async (examId) => {
    setSelectedExamId(examId)
    setExamLoading(true)
    try {
      const res = await getMyPublishedResults({ examId })
      setExamData(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setExamLoading(false)
    }
  }

  const handleDownloadPdf = () => {
    if (!reportRef.current) return
    const opt = {
      margin: 0.5,
      filename: `${examData?.student?.student_name?.replace(/\s+/g, '_') || 'Student'}_${examData?.selectedExam?.title?.replace(/\s+/g, '_') || 'Result'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    }
    html2pdf().set(opt).from(reportRef.current).save()
  }

  if (loading) return <div className="text-center py-16 text-gray-400 animate-pulse">Loading results…</div>

  const student = data?.student
  const publishedExams = data?.publishedExams || []

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">My Results</h2>
        <p className="text-sm text-gray-500 mt-0.5">View and download your published exam report cards</p>
      </div>

      {/* Student Info */}
      {student && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 rounded-2xl shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold">
              {student.student_name?.charAt(0)}
            </div>
            <div>
              <h3 className="text-xl font-bold">{student.student_name}</h3>
              <p className="text-blue-200 text-sm">{student.class_name} {student.class_section} • Roll: {student.roll_number}</p>
              <p className="text-blue-300 text-xs">ID: {student.enrollment_number}</p>
            </div>
          </div>
        </div>
      )}

      {publishedExams.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <Award className="w-14 h-14 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No published results yet</p>
          <p className="text-gray-400 text-sm mt-1">Your results will appear here once your teacher submits and admin publishes them.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Exam List */}
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Published Exams</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {publishedExams.map(exam => (
              <button
                key={exam.exam_id}
                onClick={() => loadExam(exam.exam_id)}
                className={`text-left p-4 rounded-2xl border-2 transition-all ${selectedExamId === exam.exam_id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-blue-300'}`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-gray-900 truncate">{exam.title}</div>
                    <div className="text-xs text-gray-500 capitalize">{exam.exam_type?.replace(/_/g, ' ')}</div>
                    <div className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Published {fmt(exam.published_at)}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Report Card */}
          {examLoading && (
            <div className="text-center py-10 text-gray-400 animate-pulse">Loading report card…</div>
          )}
          {examData && !examLoading && examData.selectedExam && (
            <div className="space-y-4 animate-fade-in">
              {/* Summary Stats */}
              {examData.summary && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center">
                    <div className="text-2xl font-bold text-blue-700">{examData.summary.totalObtained}</div>
                    <div className="text-xs text-blue-500 mt-0.5">Total Marks</div>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 text-center">
                    <div className="text-2xl font-bold text-purple-700">{examData.summary.totalMax}</div>
                    <div className="text-xs text-purple-500 mt-0.5">Max Marks</div>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
                    <div className="text-2xl font-bold text-amber-700">{examData.summary.percentage}%</div>
                    <div className="text-xs text-amber-500 mt-0.5">Percentage</div>
                  </div>
                  <div className={`${examData.summary.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border rounded-2xl p-4 text-center`}>
                    <div className={`text-xl font-bold ${examData.summary.passed ? 'text-green-700' : 'text-red-700'}`}>
                      {examData.summary.passed ? 'PASS' : 'FAIL'}
                    </div>
                    <div className={`text-xs mt-0.5 ${examData.summary.passed ? 'text-green-500' : 'text-red-500'}`}>Result</div>
                  </div>
                </div>
              )}

              {/* Download Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleDownloadPdf}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-all shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  Download PDF Report Card
                </button>
              </div>

              {/* Printable Report Card */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden">
                <div ref={reportRef} className="p-8 sm:p-12 font-sans text-gray-900">
                  {/* Header */}
                  <div className="text-center border-b-2 border-gray-800 pb-6 mb-8">
                    <h1 className="text-3xl font-bold uppercase tracking-widest text-blue-900 mb-1">School ERP Academy</h1>
                    <p className="text-gray-600 font-semibold text-lg">{examData.selectedExam.title} — Report Card</p>
                    {examData.selectedExam.year_name && (
                      <p className="text-gray-400 text-sm mt-1">Academic Year: {examData.selectedExam.year_name}</p>
                    )}
                  </div>

                  {/* Student Details */}
                  <div className="grid grid-cols-2 gap-6 mb-8">
                    <div className="space-y-2 text-sm">
                      <div className="flex">
                        <span className="w-36 font-bold text-gray-700">Student Name:</span>
                        <span className="flex-1 border-b border-gray-300 font-medium">{student?.student_name}</span>
                      </div>
                      <div className="flex">
                        <span className="w-36 font-bold text-gray-700">Class:</span>
                        <span className="flex-1 border-b border-gray-300 font-medium">{student?.class_name} {student?.class_section}</span>
                      </div>
                      <div className="flex">
                        <span className="w-36 font-bold text-gray-700">Roll Number:</span>
                        <span className="flex-1 border-b border-gray-300 font-medium">{student?.roll_number}</span>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex">
                        <span className="w-36 font-bold text-gray-700">Enrollment No:</span>
                        <span className="flex-1 border-b border-gray-300 font-medium">{student?.enrollment_number}</span>
                      </div>
                      <div className="flex">
                        <span className="w-36 font-bold text-gray-700">Exam Type:</span>
                        <span className="flex-1 border-b border-gray-300 font-medium capitalize">{examData.selectedExam.exam_type?.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="flex">
                        <span className="w-36 font-bold text-gray-700">Date:</span>
                        <span className="flex-1 border-b border-gray-300 font-medium">{new Date().toLocaleDateString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Grades Table */}
                  <table className="w-full border-collapse border border-gray-800 mb-8 text-sm">
                    <thead>
                      <tr className="bg-gray-100 text-gray-800">
                        <th className="border border-gray-800 p-3 text-left font-bold">#</th>
                        <th className="border border-gray-800 p-3 text-left font-bold">Subject</th>
                        <th className="border border-gray-800 p-3 text-center font-bold">Max Marks</th>
                        <th className="border border-gray-800 p-3 text-center font-bold">Marks Obtained</th>
                        <th className="border border-gray-800 p-3 text-center font-bold">Grade</th>
                        <th className="border border-gray-800 p-3 text-center font-bold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {examData.grades.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="border border-gray-800 p-6 text-center text-gray-400">
                            No grades recorded yet.
                          </td>
                        </tr>
                      ) : examData.grades.map((g, idx) => {
                        const passed = g.marks_obtained !== null && Number(g.marks_obtained) >= (Number(g.max_marks) * 0.33)
                        return (
                          <tr key={idx}>
                            <td className="border border-gray-800 p-3 text-center text-gray-500">{idx + 1}</td>
                            <td className="border border-gray-800 p-3 font-semibold">{g.subject_name}</td>
                            <td className="border border-gray-800 p-3 text-center">{g.max_marks}</td>
                            <td className="border border-gray-800 p-3 text-center font-bold text-blue-800">
                              {g.marks_obtained !== null ? g.marks_obtained : '—'}
                            </td>
                            <td className="border border-gray-800 p-3 text-center font-bold">{g.grade_letter || '—'}</td>
                            <td className="border border-gray-800 p-3 text-center">
                              <span className={`text-xs font-bold ${passed ? 'text-green-700' : 'text-red-600'}`}>
                                {g.marks_obtained !== null ? (passed ? 'P' : 'F') : '—'}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                    {examData.grades.length > 0 && examData.summary && (
                      <tfoot>
                        <tr className="bg-gray-50 font-bold">
                          <td colSpan={2} className="border border-gray-800 p-3 text-right">Total:</td>
                          <td className="border border-gray-800 p-3 text-center">{examData.summary.totalMax}</td>
                          <td className="border border-gray-800 p-3 text-center text-blue-800 text-lg">{examData.summary.totalObtained}</td>
                          <td className="border border-gray-800 p-3 text-center">{examData.summary.percentage}%</td>
                          <td className="border border-gray-800 p-3 text-center">
                            <span className={`font-bold ${examData.summary.passed ? 'text-green-700' : 'text-red-600'}`}>
                              {examData.summary.passed ? 'PASS' : 'FAIL'}
                            </span>
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>

                  {/* Signatures */}
                  <div className="flex justify-between items-end mt-16 pt-8">
                    <div className="text-center w-44">
                      <div className="border-b border-gray-800 h-8 mb-2" />
                      <span className="font-bold text-gray-700 text-sm">Class Teacher</span>
                    </div>
                    <div className="text-center w-44">
                      <div className="border-b border-gray-800 h-8 mb-2" />
                      <span className="font-bold text-gray-700 text-sm">Principal / Head</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════
//  MAIN EXAMS PAGE
// ══════════════════════════════════════════════════════════
export default function Exams() {
  const user = getUser()
  const role = user?.role

  if (role === 'admin' || role === 'super_admin') return <AdminExamsView />
  if (role === 'teacher') return <TeacherExamsView />
  return <StudentResultsView />
}
