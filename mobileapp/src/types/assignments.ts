export interface Assignment {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  maxMarks: number;
  description?: string;
  status?: 'submitted' | 'graded' | 'late' | 'pending';
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  submittedAt: string;
  marks?: number;
  feedback?: string;
  status: 'submitted' | 'graded' | 'late';
}
