import type { NetworkElement } from './network';
import type { Role } from './user';

export type EditStatus =
    | 'draft'
    | 'assigned'
    | 'field_submitted'
    | 'pending_approval'
    | 'approved'
    | 'rejected';

export interface PropertyChange {
    elementId: string;
    changeType: 'add' | 'modify' | 'delete';
    before: Partial<NetworkElement> | null;
    after: Partial<NetworkElement> | null;
}

export interface FieldFormSubmission {
    observedValue: string;
    condition: 'good' | 'needs_attention' | 'critical' | string;
    notes: string;
    submittedBy: string;
    submittedAt: string;
}

export interface FieldTask {
    assignedTo: string;
    assignedBy: string;
    instructions: string;
    assignedAt: string;
    submission: FieldFormSubmission | null;
}

export interface AuditEntry {
    id: string;
    action:
        | 'created'
        | 'modified'
        | 'assigned'
        | 'field_form_submitted'
        | 'submitted_for_approval'
        | 'approved'
        | 'rejected'
        | 'comment_posted';
    actorId: string;
    actorRole: Role;
    timestamp: string;
    detail?: string;
}

export interface ThreadMessage {
    id: string;
    authorId: string;
    authorRole: Role;
    body: string;
    timestamp: string;
}

export interface Edit {
    id: string;
    status: EditStatus;
    createdBy: string;
    createdAt: string;
    changes: PropertyChange[];
    fieldTask: FieldTask | null;
    rejectionReason: string | null;
    thread: ThreadMessage[];
    audit: AuditEntry[];
}
