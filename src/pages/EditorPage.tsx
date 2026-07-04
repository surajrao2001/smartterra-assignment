import { useState } from 'react';
import { AppHeader } from '../components/layout/AppHeader';
import { NetworkCanvas } from '../components/map/NetworkCanvas';
import { EditDetailPanel } from '../components/panels/EditDetailPanel';
import { EditsListPanel } from '../components/panels/EditsListPanel';
import { ElementPropertiesPanel } from '../components/panels/ElementPropertiesPanel';
import type { AddElementMode } from '../utils/elementFactory';

type Tab = 'properties' | 'edits' | 'thread';

const TABS: { id: Tab; label: string }[] = [
    { id: 'properties', label: 'Properties' },
    { id: 'edits', label: 'Edits queue' },
    { id: 'thread', label: 'Thread / audit' },
];

export function EditorPage() {
    const [tab, setTab] = useState<Tab>('properties');
    const [showAddForm, setShowAddForm] = useState(false);
    const [addElementMode, setAddElementMode] = useState<AddElementMode | null>(
        null
    );

    const openAddElement = () => {
        setTab('properties');
        setShowAddForm(true);
        setAddElementMode({ type: 'junction' });
    };

    const closeAddElement = () => {
        setShowAddForm(false);
        setAddElementMode(null);
    };

    return (
        <div className="flex h-screen flex-col bg-bg text-text">
            <AppHeader />
            <div className="flex min-h-0 flex-1">
                <div className="flex min-w-0 flex-1 flex-col">
                    <NetworkCanvas
                        onAddElement={openAddElement}
                        addElementMode={addElementMode}
                        onAddElementModeChange={setAddElementMode}
                        onAddElementComplete={closeAddElement}
                    />
                </div>
                <aside className="flex w-[480px] shrink-0 flex-col border-l border-border bg-surface">
                    <nav className="flex shrink-0 border-b border-border px-2">
                        {TABS.map(({ id, label }) => (
                            <button
                                key={id}
                                type="button"
                                onClick={() => setTab(id)}
                                className={`flex-1 px-3 py-3.5 text-sm font-medium transition ${
                                    tab === id
                                        ? 'border-b-2 border-text text-text'
                                        : 'border-b-2 border-transparent text-text-muted hover:text-text'
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
                                addElementMode={addElementMode}
                                onAddElementModeChange={setAddElementMode}
                                onAddFormClose={closeAddElement}
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
