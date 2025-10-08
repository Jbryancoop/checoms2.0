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
  Students: undefined;
  Attendance: undefined;
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

// 25-26 All Students Types
export interface AllStudent {
  id: string;
  'entry ID': string; // Primary field - student name
  Student?: string;
  Created?: string;
  'Student Grade'?: 'Elementary' | 'Middle School' | 'High School';
  Status?: 'Active' | 'Inactive' | 'Waitlist';
  'Grade Level'?: string;
  Programs?: string[]; // Linked record to Programs table
  'Student Type'?: string[];
  'Race/Ethnicity'?: string[];
  Gender?: string[];
  'Zip Code'?: string;
  City?: string;
  'Student ID'?: string;
  SASID?: string;
  'Students in Family'?: number;
  'Attendance Type'?: string;
  'Account Name'?: string;
  'Account Created'?: string;
  'Parent First Name'?: string;
  'Parent Last Name'?: string;
  'Parent Type'?: string[];
  'Parent Email'?: string;
  'Enrollment Status'?: string;
  'Parent Phone'?: string;
  Teachers?: string;
  'Staff (from Truth)'?: string[]; // Lookup field - linked staff members
  'recordId (from Staff) (from Truth) 2'?: string[]; // Lookup field - staff record IDs
  'S1 Session Dates Text Rollup (from Classes)'?: string; // Comma-separated dates
}

// Program Types (2025-2026 Programs)
export interface Program {
  id: string;
  Name: string; // Primary field
  Status?: 'Closed' | 'Active' | string;
  'EP Approval Status'?: string;
  'Percent Filled'?: number;
  'S1 First Class Date'?: string;
  'Total Capacity'?: number;
  '1st Sem Funding'?: number;
  'Students Left 1st Semester'?: number;
  'Number of Students'?: number;
  'Waitlist 25-26'?: number;
  'Pending Enrolled'?: number;
  'Enrolled 25-26'?: number;
  'Funded Students'?: number;
  'Regional Director'?: string;
  'MC Coordinator'?: string;
  Staff?: string[]; // Linked record to Staff/Leaders table
  'Campus Type'?: string;
  'Campus Code'?: string;
  'Last Name (from Staff)'?: string[];
  'First Name (from Staff)'?: string[];
  Campus?: string;
  'Campus Type Single Select'?: string;
  'Student Truth'?: string[]; // Linked record to students
  RecordID?: string;
  'School Year'?: string[];
}

// Alert Types
export interface Alert {
  id: string;
  Title: string; // Primary field
  Message: string;
  Priority: 'Critical' | 'High' | 'Medium' | 'Low';
  Status: 'Active' | 'Inactive' | 'Scheduled';
  'Start Date': string;
  'End Date'?: string;
  'Specific Staff'?: string[]; // Linked record to Staff/Leaders
  'Action Link'?: string;
  Dismissible: boolean;
  'Created By'?: string;
  'Created Date'?: string;
}

// Attendance Record Types (25-26 Attendance Records)
export interface AttendanceRecord {
  id: string;
  Date: string; // Date field
  Student?: string[]; // Linked record to student(s)
}
