import { SEED_USERS } from '../../data/seedUsers';
import { Guard } from '../layout/Guard';
import { StatusBadge } from '../ui/StatusBadge';
import { useAppStore } from '../../store/useAppStore';
import { getEditTitle } from '../../utils/editSummary';
import { ApprovalControls } from './ApprovalControls';
import { AuditTrailPanel } from './AuditTrailPanel';
import { FieldFormEntry } from './FieldFormEntry';
import { FieldTaskForm } from './FieldTaskForm';
import { ThreadPanel } from './ThreadPanel';

export function EditDetailPanel() {
    const selectedEditId = useAppStore(s => s.selectedEditId);
    const edits = useAppStore(s => s.edits);
    const resumeRejectedEdit = useAppStore(s => s.resumeRejectedEdit);
    const submitForApproval = useAppStore(s => s.submitForApproval);
    const currentUser = useAppStore(s => s.currentUser);

    const edit = selectedEditId ? edits[selectedEditId] : null;

    if (!edit) {
        return (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                <p className="text-sm text-text-muted">
                    Select an edit from the Properties tab or Edits queue to
                    view its thread, audit trail, and workflow actions.
                </p>
            </div>
        );
    }

    const creator = SEED_USERS.find(u => u.id === edit.createdBy);

    return (
        <div className="space-y-4 p-4">
            <section className="rounded-xl border border-border bg-surface-muted p-4">
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <h3 className="text-sm font-semibold text-text">
                            {getEditTitle(edit)}
                        </h3>
                        <p className="mt-1 text-xs text-text-muted">
                            {edit.id} · by {creator?.name ?? edit.createdBy}
                        </p>
                    </div>
                    <StatusBadge status={edit.status} />
                </div>
                {edit.rejectionReason && (
                    <p className="mt-3 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                        Rejected: {edit.rejectionReason}
                    </p>
                )}
            </section>

            <section className="rounded-xl border border-border bg-surface-muted p-4">
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
                    Proposed changes
                </h4>
                {edit.changes.length === 0 ? (
                    <p className="text-sm text-text-muted">No changes yet.</p>
                ) : (
                    <ul className="space-y-2">
                        {edit.changes.map((c, i) => (
                            <li
                                key={`${c.elementId}-${i}`}
                                className="rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm"
                            >
                                <span className="font-medium capitalize text-text">
                                    {c.changeType}
                                </span>{' '}
                                <span className="text-text-muted">
                                    {c.elementId}
                                </span>
                                {c.changeType === 'modify' &&
                                    c.before &&
                                    c.after && (
                                        <DiffSnippet
                                            before={c.before}
                                            after={c.after}
                                        />
                                    )}
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {edit.status === 'rejected' && currentUser?.role === 'editor' && (
                <button
                    type="button"
                    onClick={() => resumeRejectedEdit(edit.id)}
                    className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-white hover:bg-primary-hover"
                >
                    Resume editing
                </button>
            )}

            <Guard permission="assignFieldTask">
                {(edit.status === 'draft' || edit.status === 'rejected') && (
                    <FieldTaskForm editId={edit.id} />
                )}
            </Guard>

            <Guard permission="submitForApproval">
                {['draft', 'field_submitted', 'rejected'].includes(
                    edit.status
                ) && (
                    <button
                        type="button"
                        onClick={() => submitForApproval(edit.id)}
                        disabled={edit.changes.length === 0}
                        className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-40"
                    >
                        Submit for approval
                    </button>
                )}
            </Guard>

            <Guard permission="fillFieldForm">
                {edit.status === 'assigned' &&
                    edit.fieldTask?.assignedTo === currentUser?.id && (
                        <FieldFormEntry editId={edit.id} />
                    )}
            </Guard>

            {edit.fieldTask?.submission && (
                <section className="rounded-xl border border-border bg-surface-muted p-4">
                    <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
                        Field submission
                    </h4>
                    <dl className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <dt className="text-xs text-text-muted">
                                Observed
                            </dt>
                            <dd className="mt-0.5 text-text">
                                {edit.fieldTask.submission.observedValue}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs text-text-muted">
                                Condition
                            </dt>
                            <dd className="mt-0.5 capitalize text-text">
                                {edit.fieldTask.submission.condition.replace(
                                    '_',
                                    ' '
                                )}
                            </dd>
                        </div>
                        <div className="col-span-2">
                            <dt className="text-xs text-text-muted">Notes</dt>
                            <dd className="mt-0.5 text-text">
                                {edit.fieldTask.submission.notes || '—'}
                            </dd>
                        </div>
                    </dl>
                </section>
            )}

            <Guard permission="approveReject">
                {edit.status === 'pending_approval' && (
                    <ApprovalControls editId={edit.id} />
                )}
            </Guard>

            <ThreadPanel editId={edit.id} />
            <AuditTrailPanel edit={edit} />
        </div>
    );
}

function DiffSnippet({
    before,
    after,
}: {
    before: Record<string, unknown>;
    after: Record<string, unknown>;
}) {
    const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
    const diffs: string[] = [];
    for (const k of keys) {
        if (k === 'id' || k === 'type' || k === 'coordinates') continue;
        if (before[k] !== after[k]) {
            diffs.push(`${k}: ${String(before[k])} → ${String(after[k])}`);
        }
    }
    if (diffs.length === 0) return null;
    return (
        <p className="mt-1 text-xs text-text-muted">{diffs.join(', ')}</p>
    );
}
