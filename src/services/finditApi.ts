import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { auth, db, handleFirestoreError, OperationType, storage } from '../firebase/client';
import {
  DEFAULT_MATCHING_THRESHOLDS,
  ItemCategory,
  ItemClaim,
  ItemReport,
  MatchingThresholds,
  ReportPrivateDetails,
  ReportStatus,
  ReportType,
  SmartMatch,
  SupportCategory,
  UserNotification,
  UserPublicProfile,
  UserRole,
} from '../types/findit';
import {
  DEFAULT_MATCHING_WEIGHTS,
  evaluateReportPair,
  extractKeywords,
  MatchingWeights,
} from './matchingEngine';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

export function generateReportId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 6; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `RPT-${suffix}`;
}

export function generateId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${rand}`;
}

export async function uploadImageFile(
  file: File,
  folder: 'reports' | 'avatars',
  uid: string
): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please upload a valid image file (PNG, JPG, or WebP).');
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('Image size must be 5 MB or smaller.');
  }

  const safeExt = (file.name.split('.').pop() || 'jpg').replace(/[^a-zA-Z0-9]/g, '').slice(0, 6) || 'jpg';
  const filePath = `${folder}/${uid}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${safeExt}`;
  const storageRef = ref(storage, filePath);
  await uploadBytes(storageRef, file, { contentType: file.type });
  return getDownloadURL(storageRef);
}

export async function upsertUserProfiles(params: {
  uid: string;
  displayName: string;
  role: UserRole;
  department: string;
  photoURL: string;
  email: string;
  phone: string;
  campusId: string;
  isNewUser: boolean;
}): Promise<void> {
  const publicRef = doc(db, 'users', params.uid);
  const privateRef = doc(db, 'users', params.uid, 'private', 'info');

  const safeDisplayName = params.displayName.trim().slice(0, 100) || 'Campus User';
  const safeDept = params.department.trim().slice(0, 100) || 'General Studies';
  const safePhoto = params.photoURL.trim().slice(0, 1000);
  const safeEmail = params.email.trim().slice(0, 200);
  const safePhone = params.phone.trim().slice(0, 30);
  const safeCampusId = params.campusId.trim().slice(0, 40);

  if (params.isNewUser) {
    try {
      await setDoc(publicRef, {
        uid: params.uid,
        displayName: safeDisplayName,
        role: params.role,
        department: safeDept,
        photoURL: safePhoto,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${params.uid}`);
    }

    try {
      await setDoc(privateRef, {
        uid: params.uid,
        email: safeEmail,
        phone: safePhone,
        campusId: safeCampusId,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${params.uid}/private/info`);
    }
    return;
  }

  try {
    await updateDoc(publicRef, {
      displayName: safeDisplayName,
      department: safeDept,
      photoURL: safePhoto,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${params.uid}`);
  }

  try {
    await updateDoc(privateRef, {
      email: safeEmail,
      phone: safePhone,
      campusId: safeCampusId,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${params.uid}/private/info`);
  }
}

export interface CreateReportInput {
  type: ReportType;
  itemName: string;
  category: ItemCategory;
  description: string;
  location: string;
  eventDate: string;
  eventTime: string;
  color: string;
  characteristics: string;
  additionalDetails: string;
  contactPreference: string;
  photoFile?: File | null;
}

export async function createNotification(params: {
  userId: string;
  title: string;
  message: string;
  type: UserNotification['type'];
  relatedId: string;
}): Promise<void> {
  const notificationId = generateId('NTF');
  const notifRef = doc(db, 'notifications', notificationId);
  try {
    await setDoc(notifRef, {
      notificationId,
      userId: params.userId,
      title: params.title.slice(0, 140),
      message: params.message.slice(0, 500),
      type: params.type,
      relatedId: params.relatedId.slice(0, 128),
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `notifications/${notificationId}`);
  }
}

/**
 * Compares a newly submitted report against opposite-type open/matched reports in Firestore,
 * stores SmartMatch records above threshold, updates status, and notifies both parties.
 */
export async function runSmartMatchingForReport(
  sourceReport: ItemReport,
  weights: MatchingWeights = DEFAULT_MATCHING_WEIGHTS,
  thresholds: MatchingThresholds = DEFAULT_MATCHING_THRESHOLDS
): Promise<SmartMatch[]> {
  const oppositeType: ReportType = sourceReport.type === 'lost' ? 'found' : 'lost';
  const reportsCol = collection(db, 'reports');
  const q = query(
    reportsCol,
    where('type', '==', oppositeType),
    where('status', 'in', ['open', 'matched'])
  );

  let candidates: ItemReport[] = [];
  try {
    const snap = await getDocs(q);
    candidates = snap.docs
      .map((d) => d.data() as ItemReport)
      .filter((r) => r.reporterId !== sourceReport.reporterId);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'reports');
  }

  const createdMatches: SmartMatch[] = [];

  for (const candidate of candidates) {
    const lostReport = sourceReport.type === 'lost' ? sourceReport : candidate;
    const foundReport = sourceReport.type === 'found' ? sourceReport : candidate;
    const result = evaluateReportPair(lostReport, foundReport, weights, thresholds);

    if (result.confidenceScore >= thresholds.minimumRecordThreshold) {
      const matchId = `${lostReport.reportId}__${foundReport.reportId}`;
      const matchRef = doc(db, 'matches', matchId);

      const matchPayload = {
        matchId,
        lostReportId: lostReport.reportId,
        foundReportId: foundReport.reportId,
        lostReporterId: lostReport.reporterId,
        foundReporterId: foundReport.reporterId,
        lostItemName: lostReport.itemName.slice(0, 120),
        foundItemName: foundReport.itemName.slice(0, 120),
        confidenceScore: result.confidenceScore,
        confidenceTier: result.confidenceTier,
        breakdown: result.breakdown,
        status: 'suggested' as const,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      try {
        const existingSnap = await getDoc(matchRef);
        if (!existingSnap.exists()) {
          await setDoc(matchRef, matchPayload);
          createdMatches.push(matchPayload as unknown as SmartMatch);

          // Notify both users when a potential or high-confidence match is found
          if (result.confidenceScore >= thresholds.potentialMin) {
            await createNotification({
              userId: lostReport.reporterId,
              title: `${result.confidenceScore}% Match Detected`,
              message: `A found report "${foundReport.itemName}" may match your lost item "${lostReport.itemName}" near ${foundReport.location}.`,
              type: 'match',
              relatedId: foundReport.reportId,
            });
            await createNotification({
              userId: foundReport.reporterId,
              title: `${result.confidenceScore}% Match Detected`,
              message: `Your found report "${foundReport.itemName}" may match "${lostReport.itemName}".`,
              type: 'match',
              relatedId: lostReport.reportId,
            });

            if (lostReport.status === 'open') {
              await updateDoc(doc(db, 'reports', lostReport.reportId), {
                status: 'matched',
                updatedAt: serverTimestamp(),
              });
            }
          }
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `matches/${matchId}`);
      }
    }
  }

  return createdMatches.sort((a, b) => b.confidenceScore - a.confidenceScore);
}

export async function submitItemReport(
  input: CreateReportInput,
  profile: UserPublicProfile
): Promise<{ report: ItemReport; matches: SmartMatch[] }> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('You must be signed in to submit a report.');

  let photoURL = '';
  if (input.photoFile) {
    photoURL = await uploadImageFile(input.photoFile, 'reports', uid);
  }

  const reportId = generateReportId();
  const keywords = extractKeywords(
    input.itemName,
    input.color,
    input.characteristics,
    input.description
  );

  const reportData = {
    reportId,
    type: input.type,
    reporterId: uid,
    reporterName: profile.displayName.slice(0, 100),
    reporterRole: profile.role,
    itemName: input.itemName.trim().slice(0, 120),
    category: input.category,
    description: input.description.trim().slice(0, 1200),
    location: input.location.trim().slice(0, 160),
    eventDate: input.eventDate.trim().slice(0, 30),
    eventTime: input.eventTime.trim().slice(0, 20),
    color: input.color.trim().slice(0, 60),
    characteristics: input.characteristics.trim().slice(0, 400),
    keywords,
    photoURL: photoURL.slice(0, 1000),
    status: 'open' as ReportStatus,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const reportRef = doc(db, 'reports', reportId);
  try {
    await setDoc(reportRef, reportData);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `reports/${reportId}`);
  }

  // Save sensitive verification details in isolated private subcollection
  const secretsRef = doc(db, 'reports', reportId, 'private', 'secrets');
  try {
    await setDoc(secretsRef, {
      reportId,
      reporterId: uid,
      additionalDetails: input.additionalDetails.trim().slice(0, 1000),
      contactPreference: input.contactPreference.trim().slice(0, 120),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `reports/${reportId}/private/secrets`);
  }

  const reportObj = reportData as unknown as ItemReport;
  const matches = await runSmartMatchingForReport(reportObj);

  return { report: reportObj, matches };
}

export async function getReportSecrets(reportId: string): Promise<ReportPrivateDetails | null> {
  const secretsRef = doc(db, 'reports', reportId, 'private', 'secrets');
  try {
    const snap = await getDoc(secretsRef);
    return snap.exists() ? (snap.data() as ReportPrivateDetails) : null;
  } catch {
    return null;
  }
}

export async function updateReportStatus(reportId: string, status: ReportStatus): Promise<void> {
  const reportRef = doc(db, 'reports', reportId);
  try {
    await updateDoc(reportRef, {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `reports/${reportId}`);
  }
}

export async function deleteOpenReport(reportId: string): Promise<void> {
  const reportRef = doc(db, 'reports', reportId);
  try {
    await deleteDoc(reportRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `reports/${reportId}`);
  }
}

export async function submitOwnershipClaim(params: {
  report: ItemReport;
  claimantName: string;
  ownershipProof: string;
  matchId?: string;
}): Promise<string> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('You must be signed in to submit a claim.');
  if (params.report.reporterId === uid) {
    throw new Error('You cannot submit a claim on your own report.');
  }

  const claimId = generateId('CLM');
  const claimRef = doc(db, 'claims', claimId);
  try {
    await setDoc(claimRef, {
      claimId,
      reportId: params.report.reportId,
      reportType: params.report.type,
      itemName: params.report.itemName.slice(0, 120),
      claimantId: uid,
      claimantName: params.claimantName.slice(0, 100),
      reportOwnerId: params.report.reporterId,
      ownershipProof: params.ownershipProof.trim().slice(0, 1200),
      matchId: (params.matchId || '').slice(0, 128),
      status: 'pending',
      adminNote: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `claims/${claimId}`);
  }

  // Mark report as claim_pending
  if (params.report.status === 'open' || params.report.status === 'matched') {
    await updateReportStatus(params.report.reportId, 'claim_pending');
  }

  if (params.matchId) {
    try {
      await updateDoc(doc(db, 'matches', params.matchId), {
        status: 'claim_initiated',
        updatedAt: serverTimestamp(),
      });
    } catch {
      // ignore if match wasn't persisted
    }
  }

  await createNotification({
    userId: params.report.reporterId,
    title: 'New Verification Claim Received',
    message: `${params.claimantName} submitted ownership verification for "${params.report.itemName}" (${params.report.reportId}).`,
    type: 'claim',
    relatedId: claimId,
  });

  return claimId;
}

export async function reviewOwnershipClaim(params: {
  claim: ItemClaim;
  decision: 'approved' | 'rejected';
  adminNote: string;
}): Promise<void> {
  const claimRef = doc(db, 'claims', params.claim.claimId);
  try {
    await updateDoc(claimRef, {
      status: params.decision,
      adminNote: params.adminNote.trim().slice(0, 500),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `claims/${params.claim.claimId}`);
  }

  if (params.decision === 'rejected') {
    await updateReportStatus(params.claim.reportId, 'open');
  }

  await createNotification({
    userId: params.claim.claimantId,
    title: params.decision === 'approved' ? 'Claim Approved — Ready for Handover' : 'Claim Declined',
    message:
      params.decision === 'approved'
        ? `Your verification for "${params.claim.itemName}" was approved. Coordinate secure campus handover and confirm return.`
        : `Your claim for "${params.claim.itemName}" was declined.${params.adminNote ? ` Note: ${params.adminNote}` : ''}`,
    type: 'claim',
    relatedId: params.claim.claimId,
  });
}

export async function confirmClaimReturned(claim: ItemClaim): Promise<void> {
  const batch = writeBatch(db);
  batch.update(doc(db, 'claims', claim.claimId), {
    status: 'returned',
    updatedAt: serverTimestamp(),
  });
  batch.update(doc(db, 'reports', claim.reportId), {
    status: 'returned',
    updatedAt: serverTimestamp(),
  });
  if (claim.matchId) {
    batch.update(doc(db, 'matches', claim.matchId), {
      status: 'resolved',
      updatedAt: serverTimestamp(),
    });
  }

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `claims/${claim.claimId}`);
  }

  await createNotification({
    userId: claim.claimantId,
    title: 'Item Marked Returned',
    message: `"${claim.itemName}" has been verified and marked returned in FINDIT.`,
    type: 'return',
    relatedId: claim.reportId,
  });
  await createNotification({
    userId: claim.reportOwnerId,
    title: 'Handover Completed',
    message: `"${claim.itemName}" handover is complete and archived.`,
    type: 'return',
    relatedId: claim.reportId,
  });
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), { read: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `notifications/${notificationId}`);
  }
}

export async function deleteNotification(notificationId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'notifications', notificationId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `notifications/${notificationId}`);
  }
}

export async function submitSupportTicket(params: {
  subject: string;
  category: SupportCategory;
  message: string;
}): Promise<string> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('You must be signed in to submit a support request.');

  const ticketId = generateId('TKT');
  try {
    await setDoc(doc(db, 'supportTickets', ticketId), {
      ticketId,
      userId: uid,
      subject: params.subject.trim().slice(0, 160),
      category: params.category,
      message: params.message.trim().slice(0, 1500),
      status: 'open',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `supportTickets/${ticketId}`);
  }

  return ticketId;
}

export async function updateSupportTicketStatus(
  ticketId: string,
  status: 'open' | 'in_review' | 'resolved'
): Promise<void> {
  try {
    await updateDoc(doc(db, 'supportTickets', ticketId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `supportTickets/${ticketId}`);
  }
}
