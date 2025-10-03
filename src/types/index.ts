// Staff Info Types
export interface StaffInfo {
  id: string;
  Name: string;
  Email: string;
  Role: 'Coordinator' | 'Director' | 'Tech' | 'Staff';
  PushToken?: string;
  Campus: string;
}

// Staff Updates Types
export interface StaffUpdate {
  id: string;
  Title: string;
  Description: string;
  Date: string;
  Link?: string;
}

// Staff Messages Types
export interface StaffMessage {
  id: string;
  SenderEmail: string;
  RecipientGroup: 'Coordinator' | 'Director' | 'Tech';
  Message: string;
  Timestamp: string;
}

// 2025-2026 Leaders Types (from your CSV)
export interface Leader {
  id: string;
  'Micro-Campus Leader': string;
  'Full Name': string;
  'First Name': string;
  'Last Name': string;
  'Google ID': string;
  Phone: string;
  'Type of Campus': 'Micro-Campus' | 'NCLC' | 'CHE - New Castle' | 'Inspired Learning' | 'Mt Zion' | 'Pagosa Valor Academy' | 'Admin' | 'New Castle Teacher' | 'Venture Off' | 'Branch Campus';
  'CHE Email': string;
  'Campus Director': string[];
  ProfilePic?: string;
  UID?: string; // Firebase UID
}

// Navigation Types
export type RootTabParamList = {
  Updates: undefined;
  Info: undefined;
  Messages: undefined;
};

// Auth Types
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

// Message Recipient Groups
export type RecipientGroup = 'Coordinator' | 'Director' | 'Tech';
