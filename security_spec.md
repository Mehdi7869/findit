# FINDIT Security Specification

## 1. Data Invariants
1. **Identity Integrity**: Users can only create `users/{userId}` and `users/{userId}/private/info` documents where `uid == request.auth.uid`. Users can only register with `role` in `['student', 'faculty']` and can never self-escalate to admin.
2. **PII Isolation**: Private contact info (`email`, `phone`, `campusId`) lives strictly in `users/{userId}/private/info` and is readable only by the owner or an admin (`admins/{uid}` or verified bootstrapped admin email `mehndihussain28@gmail.com`).
3. **Sensitive Report Secrets Isolation**: Secret verification details (`additionalDetails`, `contactPreference`) for lost/found items live in `reports/{reportId}/private/secrets`, readable only by the report author or an admin. Public item browsing reads only `reports/{reportId}`.
4. **Verified User Writes**: Creating or updating `reports`, `matches`, `claims`, `notifications`, and `supportTickets` requires `request.auth.token.email_verified == true`.
5. **Immutable Ownership & Temporal Integrity**: `reporterId`, `claimantId`, `createdAt` are immutable; `createdAt == request.time` and `updatedAt == request.time` are enforced server-side.
6. **Terminal State Locking**: Once a `report` reaches `status == 'returned'` or `status == 'closed'`, or a `claim` reaches `status == 'returned'` or `status == 'rejected'`, non-admin edits are rejected.
7. **Strict Query Enforcement**: `allow list` on `claims`, `matches`, `notifications`, and `supportTickets` evaluates `resource.data` against `request.auth.uid` (or `isAdmin()`) to prevent unauthorized scraping.

## 2. Adversarial Test Matrix ("Dirty Dozen")
1. Self-assigning `role: 'admin'` in `users/{uid}` -> DENIED.
2. Reading another user's `users/{otherUid}/private/info` -> DENIED.
3. Reading another user's `reports/{id}/private/secrets` -> DENIED.
4. Writing a `report` with spoofed `reporterId != request.auth.uid` -> DENIED.
5. Writing a `report` with unverified email (`email_verified: false`) -> DENIED.
6. Injecting a shadow field (`isVerified: true`) into `reports` or `claims` -> DENIED (`hasOnly` check).
7.Spoofing `createdAt` to a past timestamp -> DENIED (`== request.time`).
8. Updating an existing `claim` directly from `pending` to `approved` as a non-admin claimant -> DENIED.
9. Updating a `claim` that is already in terminal state `returned` as a non-admin -> DENIED.
10. Listing all `notifications` without `where('userId', '==', uid)` -> DENIED.
11. Listing all `claims` without being claimant, owner, or admin -> DENIED.
12. Creating an oversized 2000-character ID or 50KB description -> DENIED (`isValidId` and `.size()` limits).
