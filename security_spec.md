# Security Specification — Tabla de Posiciones (Firestore)

## 1. Data Invariants
1. **Default Deny**: All Firestore paths not explicitly matched return `PERMISSION_DENIED`.
2. **Non-PII Public TV Display**: Smart TVs (`/` and `/conversion`) require zero-login passive read access ONLY to non-PII leaderboard records (`agents` where `isPublic == true && branch in ['Retención', 'Conversión']` and `board_events` where `isPublic == true`).
3. **Strict Write Authority (Verified Admin Only)**: All mutations (`create`, `update`, `delete`) on `agents`, `deposits`, and `board_events` MUST come from a verified Firebase Auth user (`request.auth.token.email_verified == true`) who is either the bootstrapped Super Admin (`juanesvalencia68@gmail.com`) or explicitly listed in `/admins/{uid}`.
4. **No Self-Assigned Roles**: Non-super-admin users can never write to `/admins/{uid}` to grant themselves privileges.
5. **PII Isolation**: Only `/admins/{uid}` stores `email`. `allow get` on `/admins/{uid}` is strictly limited to the document owner (`request.auth.uid == uid`) or Super Admin; `allow list` is restricted to Super Admin.
6. **Atomic Deposit + Agent Sync**: Creating a `/deposits/{depositId}` record MUST verify via `existsAfter()` that the target `/agents/{agentId}` exists in the same transaction/batch, and `createdByUid` must equal `request.auth.uid`.
7. **Temporal Integrity & Immutability**: `createdAt` must equal `request.time` on creation and remain immutable on updates (`incoming().createdAt == existing().createdAt`). `updatedAt` must equal `request.time` on every update.
8. **Strict Key & Size Guards (Anti-Update-Gap / Denial of Wallet)**: Every `create` checks `keys().hasAll(...) && keys().hasOnly(...)`; every `update` wraps with `isValid[Entity](incoming())` and uses `affectedKeys().hasOnly(...)`. Every string has `.size()` bounds; all IDs match `^[a-zA-Z0-9_\-]+$`.

---

## 2. The "Dirty Dozen" Payloads (Expected: `PERMISSION_DENIED`)

1. **Unauthenticated Agent Creation**: Anonymous/unauthenticated client creates `/agents/ag-hack` -> `PERMISSION_DENIED`.
2. **Shadow Field Injection on Agent Create**: Authenticated admin includes extra ghost field `{ ..., isVerified: true }` on `/agents/ag-1` -> `PERMISSION_DENIED` (`keys().hasOnly(...)`).
3. **Email Spoofing (Unverified Admin Email)**: User token has `email: "juanesvalencia68@gmail.com"` with `email_verified: false` attempting `/agents/ag-1` update -> `PERMISSION_DENIED`.
4. **Privilege Escalation (Self-Admin Write)**: Non-super-admin authenticated user creates `/admins/{myUid}` with `{ role: 'admin' }` -> `PERMISSION_DENIED`.
5. **PII Blanket Read on `/admins`**: Non-admin authenticated user calls `getDoc(doc(db, 'admins', 'otherUid'))` or `list('/admins')` -> `PERMISSION_DENIED`.
6. **Orphaned Deposit Write**: Admin creates `/deposits/dep-1` referencing non-existent `agentId: "ag-missing"` without updating/existing agent -> `PERMISSION_DENIED` (`existsAfter(...)`).
7. **Identity Spoofing on Deposit**: Admin creates `/deposits/dep-1` with `createdByUid: "someone-else"` != `request.auth.uid` -> `PERMISSION_DENIED`.
8. **Zero-Amount Deposit Bypass**: Admin submits deposit with `amount: 0` -> `PERMISSION_DENIED`.
9. **Client-Spoofed Timestamp**: Admin sets `createdAt: new Date(0)` instead of `serverTimestamp()` (`request.time`) -> `PERMISSION_DENIED`.
10. **Immutable Field Mutation**: Admin updates `/agents/ag-1` trying to alter `createdAt` or `id` -> `PERMISSION_DENIED`.
11. **ID Poisoning / Oversized String**: Request targets `/agents/${'a'.repeat(300)}` or sets `name: 'x'.repeat(200)` -> `PERMISSION_DENIED` (`isValidId`, `size() <= 80`).
12. **Unscoped List Query on `/agents` (Client Delegation Bypass)**: Public client attempts unfiltered collection scan without `isPublic == true` -> `PERMISSION_DENIED`.
