import { useEffect } from 'react';
import { StatusBadge } from '../ui/StatusBadge';
import { useAppStore } from '../../store/useAppStore';
import { getEditTitle } from '../../utils/editSummary';
import type { Edit, EditStatus } from '../../types/edit';

interface EditsListPanelProps {
    variant?: 'queue' | 'compact';
}

export function EditsListPanel({ variant = 'compact' }: EditsListPanelProps) {
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

    const emptyMessage = getEmptyMessage(currentUser?.role);

    return (
        <div className="p-6">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-semibold text-text">
                        {variant === 'queue' ? 'Edits queue' : 'Edits'}
                    </h3>
                    {variant === 'queue' && (
                        <p className="mt-0.5 text-xs text-text-muted">
                            {currentUser?.role === 'admin' &&
                                'Pending items need your review'}
                            {currentUser?.role === 'editor' &&
                                'Track drafts and submissions'}
                            {currentUser?.role === 'operator' &&
                                'Your assigned field tasks'}
                        </p>
                    )}
                </div>
                {currentUser?.role === 'editor' && (
                    <button
                        type="button"
                        onClick={() => {
                            const id = createDraftEdit();
                            setSelectedEdit(id);
                        }}
                        className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-hover"
                    >
                        New draft
                    </button>
                )}
            </div>

            {filtered.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-text-muted">
                    {emptyMessage}
                </div>
            ) : (
                <ul className="space-y-2">
                    {filtered.map(edit => (
                        <li key={edit.id}>
                            <button
                                type="button"
                                onClick={() => setSelectedEdit(edit.id)}
                                className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                                    selectedEditId === edit.id
                                        ? 'border-primary/40 bg-primary/5'
                                        : 'border-border bg-surface-muted hover:border-border hover:bg-surface-raised'
                                }`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-text">
                                            {getEditTitle(edit)}
                                        </p>
                                        <p className="mt-1 text-xs text-text-muted">
                                            {edit.changes.length} change(s) ·{' '}
                                            {formatDate(edit.createdAt)}
                                        </p>
                                    </div>
                                    <StatusBadge status={edit.status} />
                                </div>
                                {variant === 'queue' &&
                                    edit.status === 'pending_approval' &&
                                    currentUser?.role === 'admin' && (
                                        <p className="mt-2 text-xs text-primary">
                                            → Open Thread / audit tab to review
                                        </p>
                                    )}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

function getEmptyMessage(role?: string): string {
    if (role === 'operator')
        return 'No field tasks assigned yet. An editor must assign a task to you first.';
    if (role === 'admin')
        return 'No edits in the queue. Editors submit changes for your approval.';
    return 'No edits yet. Modify the map to start a draft, or click New draft.';
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
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
            .sort((a, b) => statusPriority(a.status) - statusPriority(b.status));
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

function statusPriority(status: EditStatus): number {
    if (status === 'pending_approval') return 0;
    if (status === 'rejected') return 1;
    return 2;
}
