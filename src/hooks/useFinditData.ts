import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase/client';
import {
  ItemClaim,
  ItemReport,
  SmartMatch,
  SupportTicket,
  UserNotification,
} from '../types/findit';

function getMillis(ts: { toMillis?: () => number } | undefined): number {
  return ts && typeof ts.toMillis === 'function' ? ts.toMillis() : 0;
}

export function useFinditData() {
  const { user, isAdmin, authReady } = useAuth();
  const [reports, setReports] = useState<ItemReport[]>([]);
  const [matches, setMatches] = useState<SmartMatch[]>([]);
  const [claims, setClaims] = useState<ItemClaim[]>([]);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authReady) return;
    if (!user) {
      setReports([]);
      setMatches([]);
      setClaims([]);
      setNotifications([]);
      setTickets([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const uid = user.uid;

    // 1. Public Reports (real-time)
    const reportsQuery = query(
      collection(db, 'reports'),
      where('status', 'in', ['open', 'matched', 'claim_pending', 'returned', 'closed'])
    );
    const unsubReports = onSnapshot(
      reportsQuery,
      (snap) => {
        const list = snap.docs
          .map((d) => d.data() as ItemReport)
          .sort((a, b) => getMillis(b.createdAt) - getMillis(a.createdAt));
        setReports(list);
        setLoading(false);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'reports')
    );

    // 2. User Matches (split queries to honor Zero-Trust Firestore rules)
    const matchMap = new Map<string, SmartMatch>();
    const syncMatches = () => {
      setMatches(
        Array.from(matchMap.values()).sort((a, b) => b.confidenceScore - a.confidenceScore)
      );
    };

    const unsubMatchesLost = onSnapshot(
      query(collection(db, 'matches'), where('lostReporterId', '==', uid)),
      (snap) => {
        snap.docs.forEach((d) => matchMap.set(d.id, d.data() as SmartMatch));
        syncMatches();
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'matches')
    );

    const unsubMatchesFound = onSnapshot(
      query(collection(db, 'matches'), where('foundReporterId', '==', uid)),
      (snap) => {
        snap.docs.forEach((d) => matchMap.set(d.id, d.data() as SmartMatch));
        syncMatches();
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'matches')
    );

    // 3. Claims (claimant, report owner, or all if admin)
    const claimMap = new Map<string, ItemClaim>();
    const syncClaims = () => {
      setClaims(
        Array.from(claimMap.values()).sort(
          (a, b) => getMillis(b.createdAt) - getMillis(a.createdAt)
        )
      );
    };

    const unsubClaims: Array<() => void> = [];
    if (isAdmin) {
      unsubClaims.push(
        onSnapshot(
          collection(db, 'claims'),
          (snap) => {
            claimMap.clear();
            snap.docs.forEach((d) => claimMap.set(d.id, d.data() as ItemClaim));
            syncClaims();
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'claims')
        )
      );
    } else {
      unsubClaims.push(
        onSnapshot(
          query(collection(db, 'claims'), where('claimantId', '==', uid)),
          (snap) => {
            snap.docs.forEach((d) => claimMap.set(d.id, d.data() as ItemClaim));
            syncClaims();
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'claims')
        ),
        onSnapshot(
          query(collection(db, 'claims'), where('reportOwnerId', '==', uid)),
          (snap) => {
            snap.docs.forEach((d) => claimMap.set(d.id, d.data() as ItemClaim));
            syncClaims();
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'claims')
        )
      );
    }

    // 4. Notifications
    const unsubNotifs = onSnapshot(
      query(collection(db, 'notifications'), where('userId', '==', uid)),
      (snap) => {
        const list = snap.docs
          .map((d) => d.data() as UserNotification)
          .sort((a, b) => getMillis(b.createdAt) - getMillis(a.createdAt));
        setNotifications(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'notifications')
    );

    // 5. Support Tickets
    const ticketQuery = isAdmin
      ? collection(db, 'supportTickets')
      : query(collection(db, 'supportTickets'), where('userId', '==', uid));
    const unsubTickets = onSnapshot(
      ticketQuery,
      (snap) => {
        const list = snap.docs
          .map((d) => d.data() as SupportTicket)
          .sort((a, b) => getMillis(b.createdAt) - getMillis(a.createdAt));
        setTickets(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'supportTickets')
    );

    return () => {
      unsubReports();
      unsubMatchesLost();
      unsubMatchesFound();
      unsubClaims.forEach((fn) => fn());
      unsubNotifs();
      unsubTickets();
    };
  }, [authReady, user, isAdmin]);

  return {
    reports,
    matches,
    claims,
    notifications,
    tickets,
    loading,
  };
}
