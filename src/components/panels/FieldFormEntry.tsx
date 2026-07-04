import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';

export function FieldFormEntry({ editId }: { editId: string }) {
    const submitFieldForm = useAppStore(s => s.submitFieldForm);
    const edit = useAppStore(s => s.edits[editId]);

    const [observedValue, setObservedValue] = useState('');
    const [condition, setCondition] = useState<
        'good' | 'needs_attention' | 'critical'
    >('good');
    const [notes, setNotes] = useState('');

    if (!edit?.fieldTask) return null;

    return (
        <section className="rounded border border-blue-200 bg-blue-50 p-3">
            <h4 className="mb-2 text-sm font-medium">
                Field verification form
            </h4>
            <p className="mb-3 text-sm text-text-muted">
                {edit.fieldTask.instructions}
            </p>
            <div className="space-y-2">
                <input
                    className="w-full rounded border border-border px-2 py-1 text-sm"
                    placeholder="Observed value"
                    value={observedValue}
                    onChange={e => setObservedValue(e.target.value)}
                />
                <select
                    value={condition}
                    onChange={e =>
                        setCondition(
                            e.target.value as
                                | 'good'
                                | 'needs_attention'
                                | 'critical'
                        )
                    }
                    className="w-full rounded border border-border px-2 py-1 text-sm"
                >
                    <option value="good">Good</option>
                    <option value="needs_attention">Needs attention</option>
                    <option value="critical">Critical</option>
                </select>
                <textarea
                    className="w-full rounded border border-border px-2 py-1 text-sm"
                    placeholder="Notes"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={2}
                />
                <button
                    type="button"
                    onClick={() =>
                        submitFieldForm(editId, {
                            observedValue,
                            condition,
                            notes,
                        })
                    }
                    disabled={!observedValue.trim()}
                    className="rounded bg-primary px-3 py-1.5 text-sm text-white disabled:opacity-50"
                >
                    Submit field form
                </button>
            </div>
        </section>
    );
}
