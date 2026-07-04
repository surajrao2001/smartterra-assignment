import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NetworkCanvas } from '../components/map/NetworkCanvas';
import { EditDetailPanel } from '../components/panels/EditDetailPanel';
import { EditsListPanel } from '../components/panels/EditsListPanel';
import { ElementPropertiesPanel } from '../components/panels/ElementPropertiesPanel';
import { useAppStore } from '../store/useAppStore';
import { ROUTES } from '../routes/routePaths';

type Tab = 'properties' | 'edits' | 'detail';

export function EditorPage() {
    const currentUser = useAppStore(s => s.currentUser);
    const logout = useAppStore(s => s.logout);
    const showPendingOverlay = useAppStore(s => s.showPendingOverlay);
    const togglePendingOverlay = useAppStore(s => s.togglePendingOverlay);
    const navigate = useNavigate();

    const defaultTab: Tab =
        currentUser?.role === 'operator'
            ? 'edits'
            : currentUser?.role === 'admin'
              ? 'edits'
              : 'properties';
    const [tab, setTab] = useState<Tab>(defaultTab);

    const handleLogout = () => {
        logout();
        navigate(ROUTES.LOGIN, { replace: true });
    };

    if (!currentUser) return null;

    return (
        <div className="flex h-screen flex-col bg-surface text-text">
            <header className="flex items-center justify-between border-b border-border bg-surface-muted px-4 py-3">
                <div>
                    <h1 className="text-lg font-semibold text-primary">
                        Water Network Editor
                    </h1>
                    <p className="text-sm text-text-muted">
                        {currentUser.role === 'admin' &&
                            'Review pending edits and approve or reject'}
                        {currentUser.role === 'editor' &&
                            'Edit network elements and submit changes for approval'}
                        {currentUser.role === 'operator' &&
                            'Complete assigned field verification tasks'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1 text-sm">
                        <input
                            type="checkbox"
                            checked={showPendingOverlay}
                            onChange={togglePendingOverlay}
                        />
                        Pending overlay
                    </label>
                    <span className="text-sm">{currentUser.name}</span>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium capitalize text-primary">
                        {currentUser.role}
                    </span>
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="rounded border border-border px-3 py-1 text-sm hover:bg-surface-muted"
                    >
                        Logout
                    </button>
                </div>
            </header>
            <div className="flex flex-1 overflow-hidden">
                <div className="flex-1 border-r border-border">
                    <NetworkCanvas />
                </div>
                <aside className="flex w-96 flex-col border-l border-border bg-surface">
                    <nav className="flex border-b border-border">
                        {(
                            [
                                ['properties', 'Properties'],
                                ['edits', 'Edits'],
                                ['detail', 'Detail'],
                            ] as const
                        ).map(([key, label]) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setTab(key)}
                                className={`flex-1 px-3 py-2 text-sm ${
                                    tab === key
                                        ? 'border-b-2 border-primary font-medium text-primary'
                                        : 'text-text-muted hover:bg-surface-muted'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </nav>
                    <div className="flex-1 overflow-y-auto">
                        {tab === 'properties' && <ElementPropertiesPanel />}
                        {tab === 'edits' && <EditsListPanel />}
                        {tab === 'detail' && <EditDetailPanel />}
                    </div>
                </aside>
            </div>
        </div>
    );
}
