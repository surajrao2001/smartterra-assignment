import { useState } from 'react';
import { AppHeader } from '../components/layout/AppHeader';
import { NetworkCanvas } from '../components/map/NetworkCanvas';
import { EditDetailPanel } from '../components/panels/EditDetailPanel';
import { EditsListPanel } from '../components/panels/EditsListPanel';
import { ElementPropertiesPanel } from '../components/panels/ElementPropertiesPanel';

type Tab = 'properties' | 'edits' | 'thread';

const TABS: { id: Tab; label: string }[] = [
    { id: 'properties', label: 'Properties' },
    { id: 'edits', label: 'Edits queue' },
    { id: 'thread', label: 'Thread / audit' },
];

export function EditorPage() {
    const [tab, setTab] = useState<Tab>('properties');
    const [showAddForm, setShowAddForm] = useState(false);

    const openAddElement = () => {
        setTab('properties');
        setShowAddForm(true);
    };

    return (
        <div className="flex h-screen flex-col bg-bg text-text">
            <AppHeader />
            <div className="flex min-h-0 flex-1">
                <div className="flex min-w-0 flex-1 flex-col">
                    <NetworkCanvas onAddElement={openAddElement} />
                </div>
                <aside className="flex w-[380px] shrink-0 flex-col border-l border-border bg-surface">
                    <nav className="flex shrink-0 border-b border-border">
                        {TABS.map(({ id, label }) => (
                            <button
                                key={id}
                                type="button"
                                onClick={() => setTab(id)}
                                className={`flex-1 px-2 py-3 text-xs font-medium transition ${
                                    tab === id
                                        ? 'border-b-2 border-primary text-primary'
                                        : 'text-text-muted hover:text-text'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </nav>
                    <div className="min-h-0 flex-1 overflow-y-auto">
                        {tab === 'properties' && (
                            <ElementPropertiesPanel
                                showAddForm={showAddForm}
                                onAddFormClose={() => setShowAddForm(false)}
                                onSelectEdit={() => setTab('thread')}
                            />
                        )}
                        {tab === 'edits' && <EditsListPanel variant="queue" />}
                        {tab === 'thread' && <EditDetailPanel />}
                    </div>
                </aside>
            </div>
        </div>
    );
}
