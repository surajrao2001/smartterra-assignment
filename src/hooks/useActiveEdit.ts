import { useAppStore } from '../store/useAppStore';
import type { Edit } from '../types/edit';

export function useActiveEdit(): Edit | null {
    const edits = useAppStore(s => s.edits);
    const selectedEditId = useAppStore(s => s.selectedEditId);
    const currentUser = useAppStore(s => s.currentUser);

    if (selectedEditId && edits[selectedEditId]) {
        return edits[selectedEditId];
    }

    if (!currentUser) return null;

    if (currentUser.role === 'editor') {
        return (
            Object.values(edits).find(
                e =>
                    e.createdBy === currentUser.id &&
                    (e.status === 'draft' || e.status === 'rejected')
            ) ?? null
        );
    }

    if (currentUser.role === 'operator') {
        return (
            Object.values(edits).find(
                e =>
                    e.fieldTask?.assignedTo === currentUser.id &&
                    e.status === 'assigned'
            ) ?? null
        );
    }

    return null;
}
