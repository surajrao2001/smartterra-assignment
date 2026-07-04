import { useNavigate } from 'react-router-dom';
import { UserAvatar } from '../ui/UserAvatar';
import { useAppStore } from '../../store/useAppStore';
import { ROUTES } from '../../routes/routePaths';
import type { Role } from '../../types/user';

const ROLES: Role[] = ['admin', 'editor', 'operator'];

export function AppHeader() {
    const currentUser = useAppStore(s => s.currentUser);
    const logout = useAppStore(s => s.logout);
    const navigate = useNavigate();

    if (!currentUser) return null;

    const handleLogout = () => {
        logout();
        navigate(ROUTES.LOGIN, { replace: true });
    };

    return (
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-5">
            <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary">
                    <svg
                        width="18"
                        height="18"
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
                <h1 className="text-[15px] font-semibold tracking-tight text-text">
                    Water network editor
                </h1>
            </div>

            <div className="flex items-center rounded-lg border border-border bg-surface-muted p-0.5">
                {ROLES.map(role => (
                    <span
                        key={role}
                        className={`rounded-md px-3 py-1 text-xs font-medium capitalize ${
                            currentUser.role === role
                                ? 'bg-surface-raised text-text shadow-sm'
                                : 'text-text-muted'
                        }`}
                    >
                        {role}
                    </span>
                ))}
            </div>

            <div className="flex items-center gap-4">
                <UserAvatar name={currentUser.name} />
                <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-muted transition hover:border-border hover:bg-surface-muted hover:text-text"
                >
                    Log out
                </button>
            </div>
        </header>
    );
}
