import { useState } from 'react';
import { SEED_USERS } from '../../data/seedUsers';
import { useAppStore } from '../../store/useAppStore';

export function FieldTaskForm({ editId }: { editId: string }) {
    const assignFieldTask = useAppStore(s => s.assignFieldTask);
    const [operatorId, setOperatorId] = useState(
        SEED_USERS.find(u => u.role === 'operator')?.id ?? ''
    );
    const [instructions, setInstructions] = useState('');

    const operators = SEED_USERS.filter(u => u.role === 'operator');

    return (
        <section className="rounded border border-border p-3">
            <h4 className="mb-2 text-sm font-medium">Assign field task</h4>
            <div className="space-y-2">
                <select
                    value={operatorId}
                    onChange={e => setOperatorId(e.target.value)}
                    className="w-full rounded border border-border px-2 py-1 text-sm"
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
                    placeholder="Instructions for the operator…"
                    className="w-full rounded border border-border px-2 py-1 text-sm"
                    rows={3}
                />
                <button
                    type="button"
                    onClick={() =>
                        assignFieldTask(editId, operatorId, instructions)
                    }
                    disabled={!instructions.trim()}
                    className="rounded bg-primary px-3 py-1.5 text-sm text-white disabled:opacity-50"
                >
                    Assign to operator
                </button>
            </div>
        </section>
    );
}
