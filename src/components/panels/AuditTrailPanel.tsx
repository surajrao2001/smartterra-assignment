import { SEED_USERS } from '../../data/seedUsers';
import type { Edit } from '../../types/edit';

const ACTION_LABELS: Record<string, string> = {
    created: 'Created',
    modified: 'Modified',
    assigned: 'Assigned field task',
    field_form_submitted: 'Field form submitted',
    submitted_for_approval: 'Submitted for approval',
    approved: 'Approved',
    rejected: 'Rejected',
    comment_posted: 'Comment posted',
};

export function AuditTrailPanel({ edit }: { edit: Edit }) {
    return (
        <section>
            <h4 className="mb-2 text-sm font-medium">Audit trail</h4>
            <ol className="relative border-l border-border pl-4">
                {edit.audit.map(entry => {
                    const actor = SEED_USERS.find(u => u.id === entry.actorId);
                    return (
                        <li key={entry.id} className="mb-3 text-sm">
                            <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-primary" />
                            <p className="font-medium">
                                {ACTION_LABELS[entry.action] ?? entry.action}
                            </p>
                            <p className="text-xs text-text-muted">
                                {actor?.name ?? entry.actorId} (
                                {entry.actorRole}) ·{' '}
                                {new Date(entry.timestamp).toLocaleString()}
                            </p>
                            {entry.detail && (
                                <p className="mt-0.5 text-xs">{entry.detail}</p>
                            )}
                        </li>
                    );
                })}
            </ol>
        </section>
    );
}
