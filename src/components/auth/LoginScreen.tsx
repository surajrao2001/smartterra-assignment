import { useNavigate } from 'react-router-dom';
import { SEED_USERS } from '../../data/seedUsers';
import { ROUTES } from '../../routes/routePaths';
import { useAppStore } from '../../store/useAppStore';

const ROLE_HINTS: Record<string, string> = {
    admin: 'Review pending edits and approve or reject changes',
    editor: 'Edit the network map and submit changes for approval',
    operator: 'Complete assigned field verification tasks',
};

export function LoginScreen() {
    const login = useAppStore(s => s.login);
    const navigate = useNavigate();

    const handleLogin = (userId: string) => {
        login(userId);
        navigate(ROUTES.APP, { replace: true });
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-bg p-6">
            <div className="mb-8 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-primary">
                    <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <path d="M12 2L2 7l10 5 10-5-10-5z" />
                        <path d="M2 17l10 5 10-5" />
                        <path d="M2 12l10 5 10-5" />
                    </svg>
                </div>
                <h1 className="text-2xl font-semibold text-text">
                    Water network editor
                </h1>
                <p className="mt-2 text-sm text-text-muted">
                    Select a demo user to explore the approval workflow
                </p>
            </div>

            <div className="w-full max-w-md space-y-3">
                {SEED_USERS.map(user => (
                    <button
                        key={user.id}
                        type="button"
                        onClick={() => handleLogin(user.id)}
                        className="group w-full rounded-xl border border-border bg-surface p-4 text-left transition hover:border-primary/40 hover:bg-surface-muted"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-text">
                                    {user.name}
                                </p>
                                <p className="mt-0.5 text-xs text-text-muted">
                                    {ROLE_HINTS[user.role]}
                                </p>
                            </div>
                            <span className="rounded-full border border-border bg-surface-raised px-2.5 py-0.5 text-xs font-medium capitalize text-text-muted group-hover:border-primary/30 group-hover:text-primary">
                                {user.role}
                            </span>
                        </div>
                    </button>
                ))}
            </div>

            <p className="mt-8 text-xs text-text-muted">
                No password required — assignment demo only
            </p>
        </div>
    );
}
