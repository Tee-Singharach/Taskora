import type { Request, User } from './types'

/**
 * Department-based access control — single source of truth.
 *
 * A request's `department` is the *destination* department that handles it.
 * Visibility & approval are scoped to that department.
 *
 * - admin   : everything
 * - manager : requests routed to their department
 * - officer : requests routed to their department
 * - staff   : only requests they filed
 */
export function canViewRequest(user: User | undefined, r: Request): boolean {
  if (!user) return false
  switch (user.role) {
    case 'admin':   return true
    case 'manager': return r.department === user.dept
    case 'officer': return r.department === user.dept
    case 'staff':   return r.requesterId === user.id
    default:        return false
  }
}

/** Approve/reject: only the designated approver of the request's department (admin may act on any). */
export function canApprove(user: User | undefined, r: Request): boolean {
  if (!user) return false
  if (r.status !== 'waiting_approval') return false
  if (user.role === 'admin') return true
  return user.role === 'manager' && r.department === user.dept && r.approverId === user.id
}

export function visibleRequests(user: User | undefined, requests: Request[]): Request[] {
  return requests.filter(r => canViewRequest(user, r))
}

/** The manager who approves requests for a given department. */
export function deptApprover(users: User[], dept: string): User | undefined {
  return users.find(u => u.role === 'manager' && u.dept === dept)
}

/** Officers in a department — eligible to take / be assigned its requests. */
export function sameDeptOfficers(users: User[], dept: string): User[] {
  return users.filter(u => u.role === 'officer' && u.dept === dept)
}

/** Soft-delete: admin can delete anything; requester can delete only their own open request. */
export function canDelete(user: User | undefined, r: Request): boolean {
  if (!user) return false
  if (user.role === 'admin') return true
  return user.id === r.requesterId && r.status === 'open'
}
