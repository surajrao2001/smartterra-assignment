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
        <section className="rounded-xl border border-primary/30 bg-primary/5 p-4">
            <h4 className="mb-1 text-sm font-semibold text-text">
                Field verification
            </h4>
            <p className="mb-4 rounded-lg bg-surface-muted px-3 py-2 text-sm text-text-muted">
                {edit.fieldTask.instructions}
            </p>
            <div className="space-y-3">
                <div>
                    <label className="mb-1 block text-xs text-text-muted">
                        Observed value
                    </label>
                    <input
                        className="w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text"
                        placeholder="e.g. 248 mm"
                        value={observedValue}
                        onChange={e => setObservedValue(e.target.value)}
                    />
                </div>
                <div>
                    <label className="mb-1 block text-xs text-text-muted">
                        Condition
                    </label>
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
                        className="w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text"
                    >
                        <option value="good">Good</option>
                        <option value="needs_attention">Needs attention</option>
                        <option value="critical">Critical</option>
                    </select>
                </div>
                <div>
                    <label className="mb-1 block text-xs text-text-muted">
                        Notes
                    </label>
                    <textarea
                        className="w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text"
                        placeholder="Additional observations…"
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        rows={2}
                    />
                </div>
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
                    className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-40"
                >
                    Submit field report
                </button>
            </div>
        </section>
    );
}
