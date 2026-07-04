import { useState } from 'react';
import { SEED_USERS } from '../../data/seedUsers';
import { useAppStore } from '../../store/useAppStore';

export function ThreadPanel({ editId }: { editId: string }) {
    const edits = useAppStore(s => s.edits);
    const postThreadMessage = useAppStore(s => s.postThreadMessage);
    const [body, setBody] = useState('');

    const edit = edits[editId];
    if (!edit) return null;

    return (
        <section className="rounded-xl border border-border bg-surface-muted p-4">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
                Conversation
            </h4>
            <ul className="mb-3 max-h-48 space-y-2 overflow-y-auto">
                {edit.thread.length === 0 ? (
                    <li className="text-sm text-text-muted">
                        No messages yet — all roles can post here.
                    </li>
                ) : (
                    edit.thread.map(msg => {
                        const author = SEED_USERS.find(
                            u => u.id === msg.authorId
                        );
                        return (
                            <li
                                key={msg.id}
                                className="rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm"
                            >
                                <div className="flex items-baseline justify-between gap-2">
                                    <span className="font-medium text-text">
                                        {author?.name ?? msg.authorId}
                                    </span>
                                    <span className="text-[10px] text-text-muted">
                                        {new Date(
                                            msg.timestamp
                                        ).toLocaleString()}
                                    </span>
                                </div>
                                <p className="mt-1 text-text-muted">
                                    {msg.body}
                                </p>
                            </li>
                        );
                    })
                )}
            </ul>
            <div className="flex gap-2">
                <input
                    className="flex-1 rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text placeholder:text-text-muted"
                    placeholder="Add a comment…"
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === 'Enter' && body.trim()) {
                            postThreadMessage(editId, body);
                            setBody('');
                        }
                    }}
                />
                <button
                    type="button"
                    onClick={() => {
                        if (body.trim()) {
                            postThreadMessage(editId, body);
                            setBody('');
                        }
                    }}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
                >
                    Post
                </button>
            </div>
        </section>
    );
}
