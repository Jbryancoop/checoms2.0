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
  image?: string | Array<{url: string}>;
}

// Message Types
export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  recipientId: string;
  recipientName: string;
  recipientEmail: string;
  content: string;
  timestamp: string;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  isFromCurrentUser: boolean;
}

export interface Conversation {
  id: string;
  recipient: AnyUser;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline: boolean;
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
  ProfilePic?: string | Array<{url: string}>;
  UID?: string; // Firebase UID
  nonCheStudentWaiverLink?: string; // Formula field for waiver link
}

// General User Types (for Users table)
export interface AppUser {
  id: string;
  'Full Name': string;
  'First Name': string;
  'Last Name': string;
  'Email': string;
  'Phone': string;
  'User Type': 'Staff' | 'Parent' | 'Student' | 'Volunteer' | 'Admin';
  'UID'?: string; // Firebase UID
  'ProfilePic'?: string | Array<{url: string}>;
  'Active'?: boolean;
}

// Union type for all user types
export type AnyUser = Leader | AppUser;

// Navigation Types
export type RootTabParamList = {
  Home: undefined;
  Updates: undefined;
  Info: undefined;
  Messages: undefined;
  Profile: undefined;
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

// Student Types (for Liability Waivers)
export interface Student {
  id: string;
  Name: string;
  Date: string;
  Waiver?: Array<{url: string; filename: string}>;
  'Parent Name'?: string | string[]; // Lookup field can be array
  'Parent Email'?: string | string[]; // Lookup field can be array
  recordid?: string;
}
