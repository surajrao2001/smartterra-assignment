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
        <section>
            <h4 className="mb-2 text-sm font-medium">Conversation</h4>
            <ul className="mb-3 max-h-40 space-y-2 overflow-y-auto">
                {edit.thread.length === 0 ? (
                    <li className="text-sm text-text-muted">
                        No messages yet.
                    </li>
                ) : (
                    edit.thread.map(msg => {
                        const author = SEED_USERS.find(
                            u => u.id === msg.authorId
                        );
                        return (
                            <li
                                key={msg.id}
                                className="rounded bg-surface-muted p-2 text-sm"
                            >
                                <span className="font-medium">
                                    {author?.name ?? msg.authorId}
                                </span>
                                <span className="ml-2 text-xs text-text-muted">
                                    {new Date(msg.timestamp).toLocaleString()}
                                </span>
                                <p className="mt-1">{msg.body}</p>
                            </li>
                        );
                    })
                )}
            </ul>
            <div className="flex gap-2">
                <input
                    className="flex-1 rounded border border-border px-2 py-1 text-sm"
                    placeholder="Post a message…"
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
                    className="rounded bg-primary px-3 py-1 text-sm text-white"
                >
                    Post
                </button>
            </div>
        </section>
    );
}
