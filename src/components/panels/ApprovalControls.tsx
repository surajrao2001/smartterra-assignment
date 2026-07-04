import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';

export function ApprovalControls({ editId }: { editId: string }) {
    const approveEdit = useAppStore(s => s.approveEdit);
    const rejectEdit = useAppStore(s => s.rejectEdit);
    const [reason, setReason] = useState('');
    const [showReject, setShowReject] = useState(false);

    return (
        <section className="rounded-xl border border-warning/30 bg-warning/5 p-4">
            <h4 className="mb-3 text-sm font-semibold text-text">
                Admin review
            </h4>
            <p className="mb-4 text-xs text-text-muted">
                Approving merges this edit into the published network for all
                roles.
            </p>
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={() => approveEdit(editId)}
                    className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-medium text-white hover:bg-primary-hover"
                >
                    Approve & publish
                </button>
                <button
                    type="button"
                    onClick={() => setShowReject(!showReject)}
                    className="flex-1 rounded-lg border border-danger/40 py-2.5 text-sm font-medium text-danger hover:bg-danger/10"
                >
                    Reject
                </button>
            </div>
            {showReject && (
                <div className="mt-3 space-y-2">
                    <textarea
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        placeholder="Reason for rejection (visible to editor)…"
                        className="w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text"
                        rows={2}
                    />
                    <button
                        type="button"
                        onClick={() => rejectEdit(editId, reason)}
                        disabled={!reason.trim()}
                        className="w-full rounded-lg bg-danger py-2 text-sm font-medium text-white disabled:opacity-40"
                    >
                        Confirm rejection
                    </button>
                </div>
            )}
        </section>
    );
}
