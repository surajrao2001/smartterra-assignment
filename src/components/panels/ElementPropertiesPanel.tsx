import { useState } from 'react';
import type { AddElementMode, AddElementType } from '../../utils/elementFactory';
import { getAddElementHint } from '../../utils/elementFactory';
import { useActiveEdit } from '../../hooks/useActiveEdit';
import { useCan } from '../../hooks/useCan';
import { ElementStatusBadge, StatusBadge } from '../ui/StatusBadge';
import { useAppStore } from '../../store/useAppStore';
import { getEffectiveNetwork } from '../../store/networkOps';
import { getEditTitle } from '../../utils/editSummary';
import type { Edit } from '../../types/edit';
import type { NetworkElement } from '../../types/network';
import { FieldTaskForm } from './FieldTaskForm';

interface ElementPropertiesPanelProps {
    showAddForm?: boolean;
    addElementMode?: AddElementMode | null;
    onAddElementModeChange?: (mode: AddElementMode | null) => void;
    onAddFormClose?: () => void;
    onSelectEdit?: () => void;
}

export function ElementPropertiesPanel({
    showAddForm = false,
    addElementMode = null,
    onAddElementModeChange,
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
    const submitForApproval = useAppStore(s => s.submitForApproval);
    const activeEdit = useActiveEdit();

    const canEdit = useCan('editProperties');
    const canAddRemove = useCan('addRemoveElements');

    const changes = activeEdit?.changes ?? [];
    const effective = getEffectiveNetwork(publishedNetwork, changes);
    const element = selectedElementId
        ? effective.elements[selectedElementId]
        : null;

    const [addType, setAddType] = useState<AddElementType>(
        addElementMode?.type ?? 'junction'
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

    const elementTitle = element
        ? `${element.type.charAt(0).toUpperCase()}${element.type.slice(1)} ${element.id}`
        : null;

    return (
        <div className="space-y-6 p-6">
            {element ? (
                <section>
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-text">
                            {elementTitle}
                        </h2>
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
                <section className="rounded-xl border border-dashed border-border py-10 text-center">
                    <p className="text-sm text-text-muted">
                        Click any junction, pipe, valve, or reservoir on the
                        map to inspect and edit its properties.
                    </p>
                </section>
            )}

            {showAddForm && canAddRemove && addElementMode && (
                <AddElementForm
                    addType={addType}
                    addElementMode={addElementMode}
                    setAddType={type => {
                        setAddType(type);
                        onAddElementModeChange?.({ type });
                    }}
                    onCancel={onAddFormClose}
                />
            )}

            {canEdit && activeEdit && (
                <section className="border-t border-border pt-6">
                    <div className="mb-4 flex items-start justify-between gap-3">
                        <div>
                            <h3 className="text-sm font-semibold text-text">
                                Current draft edit
                            </h3>
                            <p className="mt-1 text-sm text-text-muted">
                                {getEditTitle(activeEdit)}
                            </p>
                        </div>
                        <StatusBadge status={activeEdit.status} />
                    </div>

                    {['draft', 'rejected'].includes(activeEdit.status) && (
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() =>
                                    setShowAssignForm(!showAssignForm)
                                }
                                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2.5 text-sm font-medium text-text transition hover:bg-surface-muted"
                            >
                                <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <rect
                                        x="3"
                                        y="3"
                                        width="18"
                                        height="18"
                                        rx="2"
                                    />
                                </svg>
                                Assign to operator
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    submitForApproval(activeEdit.id)
                                }
                                disabled={activeEdit.changes.length === 0}
                                className="flex-1 rounded-lg bg-primary px-3 py-2.5 text-sm font-medium text-white transition hover:bg-primary-hover disabled:opacity-40"
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
                <section className="border-t border-border pt-6">
                    <h3 className="mb-3 text-sm font-semibold text-text">
                        Other edits
                    </h3>
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
            className={`flex w-full items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left transition ${
                selected
                    ? 'border-primary/40 bg-primary/5'
                    : 'border-border bg-surface-muted hover:bg-surface-raised'
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
        isStatus?: boolean;
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
                isStatus: true,
                readOnly: !editable,
            }
        );
    } else if (element.type === 'pipe') {
        fields.push(
            {
                key: 'start',
                label: 'Start',
                value: element.start,
                readOnly: true,
            },
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
                isStatus: true,
                readOnly: !editable,
            }
        );
    }

    return (
        <div className="divide-y divide-border">
            {fields.map(f => (
                <div
                    key={f.key}
                    className="flex items-center justify-between gap-4 py-3"
                >
                    <span className="text-sm text-text-muted">{f.label}</span>
                    {f.isStatus ? (
                        <ElementStatusBadge status={String(f.value)} />
                    ) : editable &&
                      !f.readOnly &&
                      f.key !== 'start' &&
                      f.key !== 'end' ? (
                        <input
                            className="w-28 rounded-lg border border-border bg-surface-muted px-3 py-1.5 text-right text-sm text-text outline-none focus:border-primary"
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
                        <span className="text-sm font-medium text-text">
                            {f.value}
                            {f.suffix ? ` ${f.suffix}` : ''}
                        </span>
                    )}
                </div>
            ))}
        </div>
    );
}

function AddElementForm({
    addType,
    addElementMode,
    setAddType,
    onCancel,
}: {
    addType: AddElementType;
    addElementMode: AddElementMode;
    setAddType: (t: AddElementType) => void;
    onCancel?: () => void;
}) {
    return (
        <section className="rounded-xl border border-primary/30 bg-primary/5 p-4">
            <h4 className="mb-3 text-sm font-semibold text-text">
                Add new element
            </h4>
            <div className="space-y-3">
                <select
                    value={addType}
                    onChange={e =>
                        setAddType(e.target.value as AddElementType)
                    }
                    className="w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text"
                >
                    <option value="junction">Junction</option>
                    <option value="valve">Valve</option>
                    <option value="pipe">Pipe</option>
                </select>
                <p className="text-sm text-primary">
                    {getAddElementHint(addElementMode)}
                </p>
                <p className="text-xs text-text-muted">
                    New IDs are auto-generated as{' '}
                    <code className="text-text">J-xxxxxx</code>,{' '}
                    <code className="text-text">V-xxxxxx</code>, or{' '}
                    <code className="text-text">P-xxxxxx</code> (6 random
                    characters). Changes stay in your draft until admin
                    approves.
                </p>
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="w-full rounded-lg border border-border px-4 py-2 text-sm text-text-muted hover:bg-surface-muted"
                    >
                        Cancel
                    </button>
                )}
            </div>
        </section>
    );
}
