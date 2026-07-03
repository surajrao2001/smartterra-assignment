import { useNavigate } from 'react-router-dom';
import { SEED_USERS } from '../../data/seedUsers';
import { ROUTES } from '../../routes/routePaths';
import { useAppStore } from '../../store/useAppStore';

export function LoginScreen() {
    const login = useAppStore(s => s.login);
    const navigate = useNavigate();

    const handleLogin = (userId: string) => {
        login(userId);
        navigate(ROUTES.APP, { replace: true });
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-surface-muted p-4">
            <div className="w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-sm">
                <h1 className="mb-1 text-xl font-semibold text-primary">
                    Water Network Editor
                </h1>
                <p className="mb-6 text-sm text-text-muted">
                    Select a user to log in. No password required.
                </p>
                <div className="space-y-2">
                    {SEED_USERS.map(user => (
                        <button
                            key={user.id}
                            type="button"
                            onClick={() => handleLogin(user.id)}
                            className="flex w-full items-center justify-between rounded border border-border px-4 py-3 text-left hover:bg-surface-muted"
                        >
                            <span className="font-medium">{user.name}</span>
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs capitalize text-primary">
                                {user.role}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
