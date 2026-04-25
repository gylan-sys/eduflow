# Security Specification - EduFlow Manager

## Data Invariants
1. A session, payment, or report cannot exist without a valid student ID.
2. Parents can only access data related to their linked child (studentId).
3. Teachers can manage sessions, students, and reports but not settings or all users.
4. Admins have full access.
5. Users cannot change their own roles.

## Dirty Dozen Payloads

1. **Identity Spoofing**: Attempt to create a user profile with a different UID than current auth.
2. **Privilege Escalation**: Attempt to update own role to 'admin'.
3. **Ghost Student**: Attempt to create a student without a name.
4. **Foreign Payment**: A parent attempting to view payment records of another child.
5. **Unauthorized Report**: A parent attempting to create or edit a report.
6. **System field poisoning**: Attempt to manually set `createdAt` instead of using server timestamp.
7. **Cross-Tenant Access**: A teacher attempting to delete another teacher's report (if strict ownership is enforced).
8. **Admin Lockout**: Attempt to delete all admin records if an admin collection existed (not applicable here as we check auth).
9. **Setting Hijack**: Anonymous user attempting to change app settings.
10. **ID Poisoning**: Attempting to use a 2MB string as a student ID.
11. **PII Leak**: Authenticated user attempting to list all users' private details (if they are not admin).
12. **Status Shortcutting**: Attempting to move a session from 'scheduled' to 'completed' without being the teacher.

## Test Runner (Conceptual) - firestore.rules.test.ts
(This file would use @firebase/rules-unit-testing to verify the above payloads are denied).
