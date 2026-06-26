export interface Announcement {
  id: string;
  title: string;
  content: string;
  targetAudience: string;
  createdAt: string;
  createdByName?: string;
}

export interface Conversation {
  recipientId: string;
  recipientName: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  createdAt: string;
}

export interface PTMMeeting {
  id: string;
  teacherId: string;
  teacherName?: string;
  scheduledAt: string;
  purpose: string;
  status: string;
}
