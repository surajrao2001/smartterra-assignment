import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';

export function ApprovalControls({ editId }: { editId: string }) {
    const approveEdit = useAppStore(s => s.approveEdit);
    const rejectEdit = useAppStore(s => s.rejectEdit);
    const [reason, setReason] = useState('');
    const [showReject, setShowReject] = useState(false);

    return (
        <section className="rounded border border-amber-200 bg-amber-50 p-3">
            <h4 className="mb-2 text-sm font-medium">Admin review</h4>
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={() => approveEdit(editId)}
                    className="rounded bg-green-600 px-3 py-1.5 text-sm text-white"
                >
                    Approve & publish
                </button>
                <button
                    type="button"
                    onClick={() => setShowReject(!showReject)}
                    className="rounded border border-red-300 px-3 py-1.5 text-sm text-red-700"
                >
                    Reject
                </button>
            </div>
            {showReject && (
                <div className="mt-2 space-y-2">
                    <textarea
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        placeholder="Rejection reason…"
                        className="w-full rounded border border-border px-2 py-1 text-sm"
                        rows={2}
                    />
                    <button
                        type="button"
                        onClick={() => rejectEdit(editId, reason)}
                        disabled={!reason.trim()}
                        className="rounded bg-red-600 px-3 py-1.5 text-sm text-white disabled:opacity-50"
                    >
                        Confirm rejection
                    </button>
                </div>
            )}
        </section>
    );
}
