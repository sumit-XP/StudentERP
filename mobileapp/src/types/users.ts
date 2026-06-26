export interface Student {
  id: string;
  name: string;
  rollNumber: string;
  className?: string;
  section?: string;
  status?: string;
}

export interface Guardian {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

export interface StudentDocument {
  id: string;
  documentType: string;
  fileUrl?: string;
  uploadedAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}
