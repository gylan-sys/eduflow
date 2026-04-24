# Security Specification - EduFlow Manager

## 1. Data Invariants
- A **Session** must have a valid `studentId` and `teacherId`.
- **Attendance** must be linked to a valid `sessionId`.
- **Payment** records are strictly managed by `admin`.
- **ProgressReports** can only be created by the `teacher` assigned to the student or an `admin`.
- **Users** can only read their own profile, unless they are an `admin`.
- **Parents** can only see data (Students, Sessions, Attendance, Payments, Reports) related to their children.
- **Teachers** can only see data related to the students they teach.

## 2. The Dirty Dozen Payloads (Target: DENIED)
1. **ID Spoofing**: Attempt to create a student with a `parentId` that is not the current user (if teacher/parent).
2. **Role Escalation**: Attempt to update own user profile `role` to 'admin'.
3. **Ghost Session**: Create a session for a student/teacher that doesn't exist.
4. **Illegal Attendance**: Record attendance for a session the teacher isn't assigned to.
5. **PII Leak**: Parent attempting to `list` all users.
6. **Payment Manipulation**: Teacher/Parent attempting to mark a payment as 'paid'.
7. **Future Attendance**: Attendance dated in the future.
8. **Resource Exhaustion**: 1MB string in `notes` field.
9. **Shadow Delete**: Unauthorized user trying to delete a session.
10. **Report Forgery**: Parent trying to write a progress report.
11. **Orphaned Attendance**: Session deleted but attendance data remains accessible/writable.
12. **Status Skipping**: Moving session status directly from 'scheduled' to 'paid' (invalid state machine).

## 3. Test Cases (Summary)
- `admin` can CRUD everything.
- `teacher` can read their own students.
- `teacher` can write attendance for their sessions.
- `parent` can read their children's progress.
- `parent` CANNOT see other students' payments.
- `parent` CANNOT update attendance.
