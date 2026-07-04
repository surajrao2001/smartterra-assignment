import { useState } from 'react';
import { SEED_USERS } from '../../data/seedUsers';
import { useAppStore } from '../../store/useAppStore';

interface FieldTaskFormProps {
    editId: string;
    compact?: boolean;
    onAssigned?: () => void;
}

export function FieldTaskForm({
    editId,
    compact = false,
    onAssigned,
}: FieldTaskFormProps) {
    const assignFieldTask = useAppStore(s => s.assignFieldTask);
    const [operatorId, setOperatorId] = useState(
        SEED_USERS.find(u => u.role === 'operator')?.id ?? ''
    );
    const [instructions, setInstructions] = useState('');

    const operators = SEED_USERS.filter(u => u.role === 'operator');

    const handleAssign = () => {
        assignFieldTask(editId, operatorId, instructions);
        onAssigned?.();
    };

    return (
        <section
            className={
                compact
                    ? 'space-y-2'
                    : 'rounded-xl border border-border bg-surface-muted p-4'
            }
        >
            {!compact && (
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
                    Assign field task
                </h4>
            )}
            <div className="space-y-2">
                <select
                    value={operatorId}
                    onChange={e => setOperatorId(e.target.value)}
                    className="w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text"
                >
                    {operators.map(op => (
                        <option key={op.id} value={op.id}>
                            {op.name}
                        </option>
                    ))}
                </select>
                <textarea
                    value={instructions}
                    onChange={e => setInstructions(e.target.value)}
                    placeholder="What should the operator verify on site?"
                    className="w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text placeholder:text-text-muted"
                    rows={compact ? 2 : 3}
                />
                <button
                    type="button"
                    onClick={handleAssign}
                    disabled={!instructions.trim()}
                    className="w-full rounded-lg border border-border py-2 text-xs font-medium text-text transition hover:bg-surface-raised disabled:opacity-40"
                >
                    Send to operator
                </button>
            </div>
        </section>
    );
}
