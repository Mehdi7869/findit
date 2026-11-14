import { Timestamp } from 'firebase/firestore';

export type UserRole = 'student' | 'faculty';

export type ItemCategory =
  | 'Electronics'
  | 'Bags & Backpacks'
  | 'Books & Notes'
  | 'ID Cards & Keys'
  | 'Water Bottles & Gear'
  | 'Clothing & Accessories'
  | 'Other';

export const ITEM_CATEGORIES: ItemCategory[] = [
  'Electronics',
  'Bags & Backpacks',
  'Books & Notes',
  'ID Cards & Keys',
  'Water Bottles & Gear',
  'Clothing & Accessories',
  'Other',
];

export const CAMPUS_LOCATIONS: string[] = [
  'Main Library',
  'Engineering & Tech Block',
  'Science & Research Wing',
  'Student Commons & Cafeteria',
  'Sports Complex & Gym',
  'North Quad & Benches',
  'Lecture Hall Complex',
  'Administration & Security Desk',
  'Hostel / Residence Hall',
  'Campus Bus Stop / Parking',
];

export type ReportType = 'lost' | 'found';
export type ReportStatus = 'open' | 'matched' | 'claim_pending' | 'returned' | 'closed';

export interface UserPublicProfile {
  uid: string;
  displayName: string;
  role: UserRole;
  department: string;
  photoURL: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface UserPrivateInfo {
  uid: string;
  email: string;
  phone: string;
  campusId: string;
  updatedAt?: Timestamp;
}

export interface ItemReport {
  reportId: string;
  type: ReportType;
  reporterId: string;
  reporterName: string;
  reporterRole: UserRole;
  itemName: string;
  category: ItemCategory;
  description: string;
  location: string;
  eventDate: string;
  eventTime: string;
  color: string;
  characteristics: string;
  keywords: string[];
  photoURL: string;
  status: ReportStatus;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface ReportPrivateDetails {
  reportId: string;
  reporterId: string;
  additionalDetails: string;
  contactPreference: string;
  updatedAt?: Timestamp;
}

export type ConfidenceTier = 'high' | 'potential' | 'low';

export interface MatchBreakdown {
  category: number;
  name: number;
  keywords: number;
  description: number;
  location: number;
  date: number;
  characteristics: number;
}

export interface SmartMatch {
  matchId: string;
  lostReportId: string;
  foundReportId: string;
  lostReporterId: string;
  foundReporterId: string;
  lostItemName: string;
  foundItemName: string;
  confidenceScore: number;
  confidenceTier: ConfidenceTier;
  breakdown: MatchBreakdown;
  status: 'suggested' | 'claim_initiated' | 'dismissed' | 'resolved';
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface ItemClaim {
  claimId: string;
  reportId: string;
  reportType: ReportType;
  itemName: string;
  claimantId: string;
  claimantName: string;
  reportOwnerId: string;
  ownershipProof: string;
  matchId: string;
  status: 'pending' | 'approved' | 'rejected' | 'returned';
  adminNote: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface UserNotification {
  notificationId: string;
  userId: string;
  title: string;
  message: string;
  type: 'match' | 'claim' | 'system' | 'return';
  relatedId: string;
  read: boolean;
  createdAt?: Timestamp;
}

export type SupportCategory =
  | 'Account & Verification'
  | 'Report Issue'
  | 'Claim Dispute'
  | 'Campus Security Desk'
  | 'Technical Feedback';

export interface SupportTicket {
  ticketId: string;
  userId: string;
  subject: string;
  category: SupportCategory;
  message: string;
  status: 'open' | 'in_review' | 'resolved';
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface MatchingThresholds {
  highMin: number;
  potentialMin: number;
  minimumRecordThreshold: number;
}

export const DEFAULT_MATCHING_THRESHOLDS: MatchingThresholds = {
  highMin: 85,
  potentialMin: 65,
  minimumRecordThreshold: 40,
};
