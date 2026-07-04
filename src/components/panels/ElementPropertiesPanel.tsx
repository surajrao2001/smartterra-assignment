import { useState } from 'react';
import { nanoid } from 'nanoid';
import { useActiveEdit } from '../../hooks/useActiveEdit';
import { useCan } from '../../hooks/useCan';
import { StatusBadge } from '../ui/StatusBadge';
import { useAppStore } from '../../store/useAppStore';
import { getEffectiveNetwork } from '../../store/networkOps';
import { getEditTitle } from '../../utils/editSummary';
import type { Edit } from '../../types/edit';
import type { NetworkElement } from '../../types/network';
import { FieldTaskForm } from './FieldTaskForm';

interface ElementPropertiesPanelProps {
    showAddForm?: boolean;
    onAddFormClose?: () => void;
    onSelectEdit?: () => void;
}

export function ElementPropertiesPanel({
    showAddForm = false,
    onAddFormClose,
    onSelectEdit,
}: ElementPropertiesPanelProps) {
    const selectedElementId = useAppStore(s => s.selectedElementId);
    const publishedNetwork = useAppStore(s => s.publishedNetwork);
    const edits = useAppStore(s => s.edits);
    const currentUser = useAppStore(s => s.currentUser);
    const selectedEditId = useAppStore(s => s.selectedEditId);
    const setSelectedEdit = useAppStore(s => s.setSelectedEdit);
    const getOrCreateActiveDraft = useAppStore(s => s.getOrCreateActiveDraft);
    const modifyElementInEdit = useAppStore(s => s.modifyElementInEdit);
    const deleteElementInEdit = useAppStore(s => s.deleteElementInEdit);
    const addElementToEdit = useAppStore(s => s.addElementToEdit);
    const submitForApproval = useAppStore(s => s.submitForApproval);
    const activeEdit = useActiveEdit();

    const canEdit = useCan('editProperties');
    const canAddRemove = useCan('addRemoveElements');

    const changes = activeEdit?.changes ?? [];
    const effective = getEffectiveNetwork(publishedNetwork, changes);
    const element = selectedElementId
        ? effective.elements[selectedElementId]
        : null;

    const [addType, setAddType] = useState<'junction' | 'valve' | 'pipe'>(
        'junction'
    );
    const [showAssignForm, setShowAssignForm] = useState(false);

    const otherEdits = Object.values(edits)
        .filter(e => {
            if (currentUser?.role === 'editor')
                return (
                    e.createdBy === currentUser.id && e.id !== activeEdit?.id
                );
            return false;
        })
        .sort(
            (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
        )
        .slice(0, 5);

    const handleFieldChange = (key: string, value: string | number) => {
        if (!canEdit || !element) return;
        const editId = getOrCreateActiveDraft();
        if (!editId) return;
        modifyElementInEdit(editId, element.id, {
            [key]: value,
        } as Partial<NetworkElement>);
    };

    return (
        <div className="space-y-4 p-4">
            {element ? (
                <section className="rounded-xl border border-border bg-surface-muted p-4">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-sm font-semibold capitalize text-text">
                            {element.type} {element.id}
                        </h3>
                        {canAddRemove && (
                            <button
                                type="button"
                                onClick={() => {
                                    const editId = getOrCreateActiveDraft();
                                    if (editId)
                                        deleteElementInEdit(
                                            editId,
                                            element.id
                                        );
                                }}
                                className="text-xs text-danger hover:underline"
                            >
                                Delete
                            </button>
                        )}
                    </div>
                    <PropertyFields
                        element={element}
                        editable={canEdit}
                        onChange={handleFieldChange}
                    />
                </section>
            ) : (
                <section className="rounded-xl border border-dashed border-border bg-surface-muted/50 p-4 text-center">
                    <p className="text-sm text-text-muted">
                        Click any junction, pipe, valve, or reservoir on the map
                        to inspect and edit its properties.
                    </p>
                </section>
            )}

            {showAddForm && canAddRemove && (
                <AddElementForm
                    addType={addType}
                    setAddType={setAddType}
                    onAdd={el => {
                        const editId = getOrCreateActiveDraft();
                        if (editId) addElementToEdit(editId, el);
                        onAddFormClose?.();
                    }}
                    onCancel={onAddFormClose}
                />
            )}

            {canEdit && activeEdit && (
                <section className="rounded-xl border border-border bg-surface-muted p-4">
                    <div className="mb-3 flex items-start justify-between gap-2">
                        <div>
                            <h4 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                                Current draft edit
                            </h4>
                            <p className="mt-1 text-sm text-text">
                                {getEditTitle(activeEdit)}
                            </p>
                        </div>
                        <StatusBadge status={activeEdit.status} />
                    </div>

                    {['draft', 'rejected'].includes(activeEdit.status) && (
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() =>
                                    setShowAssignForm(!showAssignForm)
                                }
                                className="flex-1 rounded-lg border border-border px-3 py-2 text-xs font-medium text-text transition hover:bg-surface-raised"
                            >
                                Assign to operator
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    submitForApproval(activeEdit.id)
                                }
                                disabled={activeEdit.changes.length === 0}
                                className="flex-1 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-white transition hover:bg-primary-hover disabled:opacity-40"
                            >
                                Submit for approval
                            </button>
                        </div>
                    )}

                    {showAssignForm &&
                        ['draft', 'rejected'].includes(activeEdit.status) && (
                            <div className="mt-3">
                                <FieldTaskForm
                                    editId={activeEdit.id}
                                    compact
                                    onAssigned={() => setShowAssignForm(false)}
                                />
                            </div>
                        )}
                </section>
            )}

            {otherEdits.length > 0 && (
                <section>
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
                        Other edits
                    </h4>
                    <ul className="space-y-2">
                        {otherEdits.map(edit => (
                            <OtherEditRow
                                key={edit.id}
                                edit={edit}
                                selected={selectedEditId === edit.id}
                                onSelect={() => {
                                    setSelectedEdit(edit.id);
                                    onSelectEdit?.();
                                }}
                            />
                        ))}
                    </ul>
                </section>
            )}
        </div>
    );
}

function OtherEditRow({
    edit,
    selected,
    onSelect,
}: {
    edit: Edit;
    selected: boolean;
    onSelect: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onSelect}
            className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left transition ${
                selected
                    ? 'border-primary/40 bg-primary/5'
                    : 'border-border bg-surface-muted hover:border-border hover:bg-surface-raised'
            }`}
        >
            <span className="truncate text-sm text-text">
                {getEditTitle(edit)}
            </span>
            <StatusBadge status={edit.status} />
        </button>
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
    const fields: {
        key: string;
        label: string;
        value: string | number;
        suffix?: string;
        readOnly?: boolean;
    }[] = [];

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
            {
                key: 'diameter',
                label: 'Diameter',
                value: element.diameter,
                suffix: 'mm',
            },
            { key: 'setting', label: 'Setting', value: element.setting },
            {
                key: 'status',
                label: 'Status',
                value: element.status,
                readOnly: !editable,
            }
        );
    } else if (element.type === 'pipe') {
        fields.push(
            { key: 'start', label: 'Start', value: element.start, readOnly: true },
            { key: 'end', label: 'End', value: element.end, readOnly: true },
            {
                key: 'diameter',
                label: 'Diameter',
                value: element.diameter,
                suffix: 'mm',
            },
            { key: 'roughness', label: 'Roughness', value: element.roughness },
            {
                key: 'status',
                label: 'Status',
                value: element.status,
                readOnly: !editable,
            }
        );
    }

    return (
        <dl className="space-y-3">
            {fields.map(f => (
                <div key={f.key}>
                    <dt className="mb-1 text-xs text-text-muted">{f.label}</dt>
                    <dd>
                        {editable && !f.readOnly && f.key !== 'start' && f.key !== 'end' ? (
                            <input
                                className="w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text outline-none focus:border-primary"
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
                        ) : f.key === 'status' ? (
                            <span
                                className={`text-sm font-medium capitalize ${
                                    String(f.value) === 'open' ||
                                    String(f.value) === 'active'
                                        ? 'text-success'
                                        : 'text-text-muted'
                                }`}
                            >
                                {String(f.value)}
                            </span>
                        ) : (
                            <span className="text-sm text-text">
                                {f.value}
                                {f.suffix ? ` ${f.suffix}` : ''}
                            </span>
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
    onCancel,
}: {
    addType: 'junction' | 'valve' | 'pipe';
    setAddType: (t: 'junction' | 'valve' | 'pipe') => void;
    onAdd: (el: NetworkElement) => void;
    onCancel?: () => void;
}) {
    const [start, setStart] = useState('J1');
    const [end, setEnd] = useState('J2');

    return (
        <section className="rounded-xl border border-border bg-surface-muted p-4">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
                Add new element
            </h4>
            <div className="space-y-2">
                <select
                    value={addType}
                    onChange={e =>
                        setAddType(
                            e.target.value as 'junction' | 'valve' | 'pipe'
                        )
                    }
                    className="w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text"
                >
                    <option value="junction">Junction</option>
                    <option value="valve">Valve</option>
                    <option value="pipe">Pipe</option>
                </select>
                {addType === 'pipe' && (
                    <div className="flex gap-2">
                        <input
                            className="flex-1 rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm"
                            placeholder="Start ID"
                            value={start}
                            onChange={e => setStart(e.target.value)}
                        />
                        <input
                            className="flex-1 rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm"
                            placeholder="End ID"
                            value={end}
                            onChange={e => setEnd(e.target.value)}
                        />
                    </div>
                )}
                <div className="flex gap-2">
                    <button
                        type="button"
                        className="flex-1 rounded-lg bg-primary py-2 text-sm font-medium text-white hover:bg-primary-hover"
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
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="rounded-lg border border-border px-4 py-2 text-sm text-text-muted"
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </div>
        </section>
    );
}
