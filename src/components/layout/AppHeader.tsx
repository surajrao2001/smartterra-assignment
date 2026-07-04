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
        <header className="relative flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-6">
            <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-surface-raised text-text-muted">
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <path d="M3 9h18M9 21V9" />
                    </svg>
                </div>
                <h1 className="text-[15px] font-semibold text-text">
                    Water network editor
                </h1>
            </div>

            <div className="absolute left-1/2 flex -translate-x-1/2 items-center rounded-lg border border-border bg-surface-muted p-0.5">
                {ROLES.map(role => (
                    <span
                        key={role}
                        className={`rounded-md px-4 py-1.5 text-xs font-medium capitalize ${
                            currentUser.role === role
                                ? 'bg-surface-raised text-text shadow-sm'
                                : 'text-text-muted'
                        }`}
                    >
                        {role}
                    </span>
                ))}
            </div>

            <div className="flex items-center gap-3">
                <UserAvatar name={currentUser.name} />
                <button
                    type="button"
                    onClick={handleLogout}
                    className="text-xs text-text-muted transition hover:text-text"
                    title="Log out"
                >
                    Log out
                </button>
            </div>
        </header>
    );
}
