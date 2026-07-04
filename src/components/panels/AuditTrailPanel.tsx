import { SEED_USERS } from '../../data/seedUsers';
import type { Edit } from '../../types/edit';

const ACTION_LABELS: Record<string, string> = {
    created: 'Edit created',
    modified: 'Network modified',
    assigned: 'Assigned to operator',
    field_form_submitted: 'Field form submitted',
    submitted_for_approval: 'Submitted for approval',
    approved: 'Approved & published',
    rejected: 'Rejected',
    comment_posted: 'Comment posted',
};

export function AuditTrailPanel({ edit }: { edit: Edit }) {
    return (
        <section className="rounded-xl border border-border bg-surface-muted p-4">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
                Audit trail
            </h4>
            <ol className="relative space-y-0 border-l border-border pl-4">
                {edit.audit.map(entry => {
                    const actor = SEED_USERS.find(u => u.id === entry.actorId);
                    return (
                        <li key={entry.id} className="relative pb-4 last:pb-0">
                            <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-surface-muted bg-primary" />
                            <p className="text-sm font-medium text-text">
                                {ACTION_LABELS[entry.action] ?? entry.action}
                            </p>
                            <p className="text-xs text-text-muted">
                                {actor?.name ?? entry.actorId} ·{' '}
                                {entry.actorRole} ·{' '}
                                {new Date(entry.timestamp).toLocaleString()}
                            </p>
                            {entry.detail && (
                                <p className="mt-0.5 text-xs text-text-muted">
                                    {entry.detail}
                                </p>
                            )}
                        </li>
                    );
                })}
            </ol>
        </section>
    );
}
