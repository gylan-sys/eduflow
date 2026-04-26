export type UserRole = 'admin' | 'teacher' | 'parent';
export type BusinessLine = 'shadow' | 'swimming' | 'both';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  businessLine?: BusinessLine;
  studentId?: string; // Linked student for parents
  phoneNumber?: string;
  assignedStudentIds?: string[]; // Max 2 students
  photoURL?: string;
}

export type StudentType = 'shadow' | 'swimming' | 'both';

export interface Student {
  id: string;
  name: string;
  parentId: string;
  dateOfBirth?: string;
  notes?: string;
  type: StudentType;
}

export type SessionType = 'shadow' | 'swimming';
export type SessionStatus = 'scheduled' | 'completed' | 'cancelled';

export interface Session {
  id: string;
  studentId: string;
  teacherId: string;
  type: SessionType;
  startTime: any; // Firestore Timestamp
  endTime: any;   // Firestore Timestamp
  status: SessionStatus;
  transportFee?: number;
  sessionFee?: number;
}

export interface Attendance {
  id: string;
  sessionId: string;
  studentId: string;
  teacherId: string;
  studentPresent: boolean;
  teacherPresent: boolean;
  timestamp: any;
  notes?: string;
}

export interface Payment {
  id: string;
  studentId: string;
  amount: number;
  type: 'tuition' | 'transport' | 'other';
  status: 'pending' | 'paid' | 'verified';
  date: any;
  month: number;
  year: number;
  notes?: string;
  proofUrl?: string;
}

export interface ProgressReport {
  id: string;
  studentId: string;
  teacherId: string;
  date: any;
  content: string;
  metrics?: {
    focus?: number;
    social?: number;
    skill?: number;
  };
}

export interface AppSettings {
  appName: string;
  appLogoUrl: string;
  themeColor: string;
  monthlyFee?: number;
  qrisUrl?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: any;
  type: 'info' | 'program' | 'event';
  isActive: boolean;
}

export interface Program {
  id: string;
  name: string;
  price: number;
  description?: string;
  includes?: string;
  isActive: boolean;
  createdAt: string;
}
