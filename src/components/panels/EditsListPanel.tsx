import { useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import type { Edit, EditStatus } from '../../types/edit';

const STATUS_LABELS: Record<EditStatus, string> = {
    draft: 'Draft',
    assigned: 'Assigned',
    field_submitted: 'Field submitted',
    pending_approval: 'Pending approval',
    approved: 'Approved',
    rejected: 'Rejected',
};

export function EditsListPanel() {
    const edits = useAppStore(s => s.edits);
    const currentUser = useAppStore(s => s.currentUser);
    const selectedEditId = useAppStore(s => s.selectedEditId);
    const setSelectedEdit = useAppStore(s => s.setSelectedEdit);
    const createDraftEdit = useAppStore(s => s.createDraftEdit);

    const editList = Object.values(edits).sort(
        (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const filtered = filterEditsForRole(
        editList,
        currentUser?.id,
        currentUser?.role
    );

    useEffect(() => {
        if (selectedEditId || filtered.length === 0) return;
        if (currentUser?.role === 'operator' || currentUser?.role === 'admin') {
            setSelectedEdit(filtered[0].id);
        }
    }, [filtered, selectedEditId, currentUser?.role, setSelectedEdit]);

    const emptyMessage =
        currentUser?.role === 'operator'
            ? 'No field tasks assigned to you yet. An editor must assign a task first.'
            : currentUser?.role === 'admin'
              ? 'No edits awaiting review. Editors submit changes for approval here.'
              : 'No edits yet. Modify the map or click New draft to start.';

    return (
        <div className="p-4">
            <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold">Edits</h3>
                {currentUser?.role === 'editor' && (
                    <button
                        type="button"
                        onClick={() => {
                            const id = createDraftEdit();
                            setSelectedEdit(id);
                        }}
                        className="rounded bg-primary px-2 py-1 text-xs text-white"
                    >
                        New draft
                    </button>
                )}
            </div>
            {filtered.length === 0 ? (
                <p className="text-sm text-text-muted">{emptyMessage}</p>
            ) : (
                <ul className="space-y-2">
                    {filtered.map(edit => (
                        <li key={edit.id}>
                            <button
                                type="button"
                                onClick={() => setSelectedEdit(edit.id)}
                                className={`w-full rounded border px-3 py-2 text-left text-sm ${
                                    selectedEditId === edit.id
                                        ? 'border-primary bg-primary/5'
                                        : 'border-border hover:bg-surface-muted'
                                }`}
                            >
                                <div className="flex justify-between">
                                    <span className="font-medium">
                                        {edit.id}
                                    </span>
                                    <StatusBadge status={edit.status} />
                                </div>
                                <p className="text-xs text-text-muted">
                                    {edit.changes.length} change(s) ·{' '}
                                    {new Date(edit.createdAt).toLocaleString()}
                                </p>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

function StatusBadge({ status }: { status: EditStatus }) {
    const colors: Record<EditStatus, string> = {
        draft: 'bg-slate-100 text-slate-700',
        assigned: 'bg-blue-100 text-blue-700',
        field_submitted: 'bg-indigo-100 text-indigo-700',
        pending_approval: 'bg-amber-100 text-amber-800',
        approved: 'bg-green-100 text-green-700',
        rejected: 'bg-red-100 text-red-700',
    };
    return (
        <span className={`rounded-full px-2 py-0.5 text-xs ${colors[status]}`}>
            {STATUS_LABELS[status]}
        </span>
    );
}

function filterEditsForRole(
    edits: Edit[],
    userId?: string,
    role?: string
): Edit[] {
    if (role === 'admin') {
        return edits
            .filter(
                e =>
                    e.status === 'pending_approval' ||
                    e.status === 'approved' ||
                    e.status === 'rejected'
            )
            .sort((a, b) => {
                if (a.status === 'pending_approval') return -1;
                if (b.status === 'pending_approval') return 1;
                return (
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
                );
            });
    }
    if (role === 'operator') {
        return edits.filter(
            e =>
                e.fieldTask?.assignedTo === userId &&
                (e.status === 'assigned' || e.status === 'field_submitted')
        );
    }
    if (role === 'editor') {
        return edits.filter(e => e.createdBy === userId);
    }
    return edits;
}
