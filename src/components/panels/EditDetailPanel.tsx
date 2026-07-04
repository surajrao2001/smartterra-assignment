import { SEED_USERS } from '../../data/seedUsers';
import { Guard } from '../layout/Guard';
import { useAppStore } from '../../store/useAppStore';
import { ApprovalControls } from './ApprovalControls';
import { AuditTrailPanel } from './AuditTrailPanel';
import { FieldFormEntry } from './FieldFormEntry';
import { FieldTaskForm } from './FieldTaskForm';
import { ThreadPanel } from './ThreadPanel';

export function EditDetailPanel() {
    const selectedEditId = useAppStore(s => s.selectedEditId);
    const edits = useAppStore(s => s.edits);
    const resumeRejectedEdit = useAppStore(s => s.resumeRejectedEdit);
    const currentUser = useAppStore(s => s.currentUser);

    const edit = selectedEditId ? edits[selectedEditId] : null;

    if (!edit) {
        return (
            <div className="p-4 text-sm text-text-muted">
                Select an edit to view details, changes, and workflow actions.
            </div>
        );
    }

    const creator = SEED_USERS.find(u => u.id === edit.createdBy);

    return (
        <div className="space-y-4 overflow-y-auto p-4">
            <div>
                <h3 className="font-semibold">{edit.id}</h3>
                <p className="text-sm text-text-muted">
                    By {creator?.name ?? edit.createdBy} · {edit.status}
                </p>
                {edit.rejectionReason && (
                    <p className="mt-2 rounded bg-red-50 p-2 text-sm text-red-700">
                        Rejected: {edit.rejectionReason}
                    </p>
                )}
            </div>

            <section>
                <h4 className="mb-2 text-sm font-medium">Proposed changes</h4>
                {edit.changes.length === 0 ? (
                    <p className="text-sm text-text-muted">No changes yet.</p>
                ) : (
                    <ul className="space-y-2">
                        {edit.changes.map((c, i) => (
                            <li
                                key={`${c.elementId}-${i}`}
                                className="rounded border border-border p-2 text-sm"
                            >
                                <span className="font-medium capitalize">
                                    {c.changeType}
                                </span>{' '}
                                {c.elementId}
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
                    className="rounded bg-primary px-3 py-1.5 text-sm text-white"
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
                ) && <SubmitForApprovalButton editId={edit.id} />}
            </Guard>

            <Guard permission="fillFieldForm">
                {edit.status === 'assigned' &&
                    edit.fieldTask?.assignedTo === currentUser?.id && (
                        <FieldFormEntry editId={edit.id} />
                    )}
            </Guard>

            {edit.fieldTask?.submission && (
                <section className="rounded border border-border p-3">
                    <h4 className="mb-2 text-sm font-medium">
                        Field submission
                    </h4>
                    <dl className="space-y-1 text-sm">
                        <div>
                            <dt className="text-text-muted">Observed</dt>
                            <dd>{edit.fieldTask.submission.observedValue}</dd>
                        </div>
                        <div>
                            <dt className="text-text-muted">Condition</dt>
                            <dd>{edit.fieldTask.submission.condition}</dd>
                        </div>
                        <div>
                            <dt className="text-text-muted">Notes</dt>
                            <dd>{edit.fieldTask.submission.notes}</dd>
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

function SubmitForApprovalButton({ editId }: { editId: string }) {
    const submitForApproval = useAppStore(s => s.submitForApproval);
    return (
        <button
            type="button"
            onClick={() => submitForApproval(editId)}
            className="rounded bg-amber-600 px-3 py-1.5 text-sm text-white"
        >
            Submit for approval
        </button>
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
    return <p className="mt-1 text-xs text-text-muted">{diffs.join(', ')}</p>;
}
