import { useState } from 'react';
import { nanoid } from 'nanoid';
import { useActiveEdit } from '../../hooks/useActiveEdit';
import { useCan } from '../../hooks/useCan';
import { useAppStore } from '../../store/useAppStore';
import { getEffectiveNetwork } from '../../store/networkOps';
import type { NetworkElement } from '../../types/network';

export function ElementPropertiesPanel() {
    const selectedElementId = useAppStore(s => s.selectedElementId);
    const publishedNetwork = useAppStore(s => s.publishedNetwork);
    const getOrCreateActiveDraft = useAppStore(s => s.getOrCreateActiveDraft);
    const modifyElementInEdit = useAppStore(s => s.modifyElementInEdit);
    const deleteElementInEdit = useAppStore(s => s.deleteElementInEdit);
    const addElementToEdit = useAppStore(s => s.addElementToEdit);
    const activeEdit = useActiveEdit();

    const canEdit = useCan('editProperties');
    const canAddRemove = useCan('addRemoveElements');

    const changes = activeEdit?.changes ?? [];
    const effective = getEffectiveNetwork(publishedNetwork, changes);

    const element = selectedElementId
        ? effective.elements[selectedElementId]
        : null;

    const [showAddForm, setShowAddForm] = useState(false);
    const [addType, setAddType] = useState<'junction' | 'valve' | 'pipe'>(
        'junction'
    );

    if (!element) {
        return (
            <div className="p-4 text-sm text-text-muted">
                <p className="mb-4">
                    Select an element on the map to view properties.
                </p>
                {canAddRemove && (
                    <div>
                        <button
                            type="button"
                            onClick={() => setShowAddForm(!showAddForm)}
                            className="rounded bg-primary px-3 py-1.5 text-sm text-white"
                        >
                            Add element
                        </button>
                        {showAddForm && (
                            <AddElementForm
                                addType={addType}
                                setAddType={setAddType}
                                onAdd={el => {
                                    const editId = getOrCreateActiveDraft();
                                    if (editId) addElementToEdit(editId, el);
                                    setShowAddForm(false);
                                }}
                            />
                        )}
                    </div>
                )}
            </div>
        );
    }

    const handleFieldChange = (key: string, value: string | number) => {
        if (!canEdit) return;
        const editId = getOrCreateActiveDraft();
        if (!editId) return;
        modifyElementInEdit(editId, element.id, {
            [key]: value,
        } as Partial<NetworkElement>);
    };

    const handleDelete = () => {
        if (!canAddRemove) return;
        const editId = getOrCreateActiveDraft();
        if (!editId) return;
        deleteElementInEdit(editId, element.id);
    };

    return (
        <div className="space-y-3 p-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold">
                    {element.type} — {element.id}
                </h3>
                {canAddRemove && (
                    <button
                        type="button"
                        onClick={handleDelete}
                        className="text-sm text-red-600 hover:underline"
                    >
                        Delete
                    </button>
                )}
            </div>
            {activeEdit && canEdit && (
                <p className="mb-3 rounded bg-surface-muted px-2 py-1 text-xs text-text-muted">
                    Editing in: {activeEdit.id} ({activeEdit.status})
                </p>
            )}
            <PropertyFields
                element={element}
                editable={canEdit}
                onChange={handleFieldChange}
            />
        </div>
    );
}

function PropertyFields({
    element,
    editable,
    onChange,
}: {
    element: NetworkElement;
    editable: boolean;
    onChange: (key: string, value: string | number) => void;
}) {
    const fields: { key: string; label: string; value: string | number }[] = [];

    if (element.type === 'junction') {
        fields.push(
            { key: 'elevation', label: 'Elevation', value: element.elevation },
            { key: 'demand', label: 'Demand', value: element.demand }
        );
    } else if (element.type === 'reservoir') {
        fields.push({ key: 'head', label: 'Head', value: element.head });
    } else if (element.type === 'valve') {
        fields.push(
            { key: 'valveType', label: 'Valve type', value: element.valveType },
            { key: 'diameter', label: 'Diameter', value: element.diameter },
            { key: 'setting', label: 'Setting', value: element.setting },
            { key: 'status', label: 'Status', value: element.status }
        );
    } else if (element.type === 'pipe') {
        fields.push(
            { key: 'start', label: 'Start', value: element.start },
            { key: 'end', label: 'End', value: element.end },
            { key: 'length', label: 'Length', value: element.length },
            { key: 'diameter', label: 'Diameter', value: element.diameter },
            { key: 'roughness', label: 'Roughness', value: element.roughness },
            { key: 'status', label: 'Status', value: element.status }
        );
    }

    return (
        <dl className="space-y-2">
            {fields.map(f => (
                <div key={f.key} className="grid grid-cols-2 gap-2 text-sm">
                    <dt className="text-text-muted">{f.label}</dt>
                    <dd>
                        {editable && f.key !== 'start' && f.key !== 'end' ? (
                            <input
                                className="w-full rounded border border-border px-2 py-1"
                                value={f.value}
                                onChange={e =>
                                    onChange(
                                        f.key,
                                        typeof f.value === 'number'
                                            ? Number(e.target.value)
                                            : e.target.value
                                    )
                                }
                            />
                        ) : (
                            f.value
                        )}
                    </dd>
                </div>
            ))}
        </dl>
    );
}

function AddElementForm({
    addType,
    setAddType,
    onAdd,
}: {
    addType: 'junction' | 'valve' | 'pipe';
    setAddType: (t: 'junction' | 'valve' | 'pipe') => void;
    onAdd: (el: NetworkElement) => void;
}) {
    const [start, setStart] = useState('J1');
    const [end, setEnd] = useState('J2');

    return (
        <div className="mt-3 space-y-2 rounded border border-border p-3">
            <select
                value={addType}
                onChange={e =>
                    setAddType(e.target.value as 'junction' | 'valve' | 'pipe')
                }
                className="w-full rounded border border-border px-2 py-1 text-sm"
            >
                <option value="junction">Junction</option>
                <option value="valve">Valve</option>
                <option value="pipe">Pipe</option>
            </select>
            <button
                type="button"
                className="w-full rounded bg-primary px-3 py-1.5 text-sm text-white"
                onClick={() => {
                    const id = `${addType === 'pipe' ? 'P' : addType === 'valve' ? 'V' : 'J'}-${nanoid(4)}`;
                    if (addType === 'junction') {
                        onAdd({
                            id,
                            type: 'junction',
                            coordinates: [77.595, 12.972],
                            elevation: 200,
                            demand: 0,
                        });
                    } else if (addType === 'valve') {
                        onAdd({
                            id,
                            type: 'valve',
                            coordinates: [77.595, 12.972],
                            valveType: 'PRV',
                            diameter: 200,
                            setting: 30,
                            status: 'active',
                        });
                    } else {
                        onAdd({
                            id,
                            type: 'pipe',
                            start,
                            end,
                            length: 200,
                            diameter: 250,
                            roughness: 130,
                            status: 'open',
                            coordinates: [],
                        });
                    }
                }}
            >
                Create {addType}
            </button>
            {addType === 'pipe' && (
                <div className="flex gap-2">
                    <input
                        className="flex-1 rounded border px-2 py-1 text-sm"
                        placeholder="Start ID"
                        value={start}
                        onChange={e => setStart(e.target.value)}
                    />
                    <input
                        className="flex-1 rounded border px-2 py-1 text-sm"
                        placeholder="End ID"
                        value={end}
                        onChange={e => setEnd(e.target.value)}
                    />
                </div>
            )}
        </div>
    );
}
