import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import { createSeedNetwork } from '../data/seedNetwork';
import { SEED_USERS } from '../data/seedUsers';
import type {
    AuditEntry,
    Edit,
    FieldFormSubmission,
    FieldTask,
    PropertyChange,
} from '../types/edit';
import type { Junction, NetworkElement, NetworkState } from '../types/network';
import { isPipe } from '../types/network';
import type { User } from '../types/user';
import {
    applyChangesToNetwork,
    cascadeDeleteChanges,
    getEffectiveNetwork,
    splitPipeAtPoint,
} from './networkOps';
import { CAN } from './permissions';

const STORE_KEY = 'water-network-editor-store';

interface AppState {
    currentUser: User | null;
    publishedNetwork: NetworkState;
    edits: Record<string, Edit>;
    selectedElementId: string | null;
    selectedEditId: string | null;
    showPendingOverlay: boolean;

    login: (userId: string) => void;
    logout: () => void;
    setSelectedElement: (id: string | null) => void;
    setSelectedEdit: (id: string | null) => void;
    togglePendingOverlay: () => void;
    setShowPendingOverlay: (value: boolean) => void;

    createDraftEdit: () => string;
    getOrCreateActiveDraft: () => string | null;
    addElementToEdit: (editId: string, element: NetworkElement) => void;
    modifyElementInEdit: (
        editId: string,
        elementId: string,
        patch: Partial<NetworkElement>
    ) => void;
    deleteElementInEdit: (editId: string, elementId: string) => void;
    insertJunctionOnPipe: (
        editId: string,
        pipeId: string,
        clickPoint: [number, number],
        junctionProps: Omit<Junction, 'id' | 'type' | 'coordinates'>
    ) => void;
    assignFieldTask: (
        editId: string,
        operatorId: string,
        instructions: string
    ) => void;
    submitForApproval: (editId: string) => void;
    submitFieldForm: (
        editId: string,
        submission: Omit<FieldFormSubmission, 'submittedBy' | 'submittedAt'>
    ) => void;
    approveEdit: (editId: string) => void;
    rejectEdit: (editId: string, reason: string) => void;
    postThreadMessage: (editId: string, body: string) => void;
    resumeRejectedEdit: (editId: string) => void;
}

function createAuditEntry(
    action: AuditEntry['action'],
    actor: User,
    detail?: string
): AuditEntry {
    return {
        id: nanoid(),
        action,
        actorId: actor.id,
        actorRole: actor.role,
        timestamp: new Date().toISOString(),
        detail,
    };
}

function getUserById(userId: string): User | undefined {
    return SEED_USERS.find(u => u.id === userId);
}

function requireUser(get: () => AppState): User | null {
    return get().currentUser;
}

function updateEdit(
    edits: Record<string, Edit>,
    editId: string,
    updater: (edit: Edit) => Edit
): Record<string, Edit> {
    const edit = edits[editId];
    if (!edit) return edits;
    return { ...edits, [editId]: updater(edit) };
}

export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            currentUser: null,
            publishedNetwork: createSeedNetwork(),
            edits: {},
            selectedElementId: null,
            selectedEditId: null,
            showPendingOverlay: false,

            login: userId => {
                const user = getUserById(userId);
                if (user) set({ currentUser: user });
            },

            logout: () =>
                set({
                    currentUser: null,
                    selectedElementId: null,
                    selectedEditId: null,
                }),

            setSelectedElement: id => set({ selectedElementId: id }),
            setSelectedEdit: id => set({ selectedEditId: id }),
            togglePendingOverlay: () =>
                set(s => ({ showPendingOverlay: !s.showPendingOverlay })),
            setShowPendingOverlay: value => set({ showPendingOverlay: value }),

            createDraftEdit: () => {
                const user = requireUser(get);
                if (!user || !CAN.editProperties(user.role)) {
                    console.warn('RBAC: only editor can create edits');
                    return '';
                }

                const editId = `edit-${nanoid(8)}`;
                const edit: Edit = {
                    id: editId,
                    status: 'draft',
                    createdBy: user.id,
                    createdAt: new Date().toISOString(),
                    changes: [],
                    fieldTask: null,
                    rejectionReason: null,
                    thread: [],
                    audit: [
                        createAuditEntry('created', user, 'Draft edit created'),
                    ],
                };

                set(s => ({
                    edits: { ...s.edits, [editId]: edit },
                    selectedEditId: editId,
                }));

                return editId;
            },

            getOrCreateActiveDraft: () => {
                const { edits, currentUser } = get();
                if (!currentUser || !CAN.editProperties(currentUser.role))
                    return null;

                const existing = Object.values(edits).find(
                    e =>
                        e.createdBy === currentUser.id &&
                        (e.status === 'draft' || e.status === 'rejected')
                );
                if (existing) {
                    set({ selectedEditId: existing.id });
                    return existing.id;
                }

                return get().createDraftEdit();
            },

            addElementToEdit: (editId, element) => {
                const user = requireUser(get);
                if (!user || !CAN.addRemoveElements(user.role)) {
                    console.warn('RBAC: only editor can add elements');
                    return;
                }

                const { edits } = get();
                const edit = edits[editId];
                if (
                    !edit ||
                    (edit.status !== 'draft' && edit.status !== 'rejected')
                ) {
                    console.warn('RBAC: edit not editable');
                    return;
                }

                const change: PropertyChange = {
                    elementId: element.id,
                    changeType: 'add',
                    before: null,
                    after: { ...element },
                };

                set({
                    edits: updateEdit(edits, editId, e => ({
                        ...e,
                        changes: [...e.changes, change],
                        audit: [
                            ...e.audit,
                            createAuditEntry(
                                'modified',
                                user,
                                `Added ${element.type} ${element.id}`
                            ),
                        ],
                    })),
                    selectedElementId: element.id,
                    showPendingOverlay: true,
                });
            },

            modifyElementInEdit: (editId, elementId, patch) => {
                const user = requireUser(get);
                if (!user || !CAN.editProperties(user.role)) {
                    console.warn('RBAC: only editor can modify elements');
                    return;
                }

                const { edits, publishedNetwork } = get();
                const edit = edits[editId];
                if (
                    !edit ||
                    (edit.status !== 'draft' && edit.status !== 'rejected')
                ) {
                    console.warn('RBAC: edit not editable');
                    return;
                }

                const effective = getEffectiveNetwork(
                    publishedNetwork,
                    edit.changes
                );
                const current = effective.elements[elementId];
                if (!current) return;

                const existingChangeIdx = edit.changes.findIndex(
                    c => c.elementId === elementId && c.changeType !== 'delete'
                );

                const before =
                    existingChangeIdx >= 0 &&
                    edit.changes[existingChangeIdx].changeType === 'add'
                        ? null
                        : { ...current };

                const after = { ...current, ...patch } as NetworkElement;
                const change: PropertyChange = {
                    elementId,
                    changeType:
                        existingChangeIdx >= 0 &&
                        edit.changes[existingChangeIdx].changeType === 'add'
                            ? 'add'
                            : 'modify',
                    before,
                    after,
                };

                const newChanges = [...edit.changes];
                if (existingChangeIdx >= 0) {
                    newChanges[existingChangeIdx] = change;
                } else {
                    newChanges.push(change);
                }

                set({
                    edits: updateEdit(edits, editId, e => ({
                        ...e,
                        changes: newChanges,
                        audit: [
                            ...e.audit,
                            createAuditEntry(
                                'modified',
                                user,
                                `Modified ${elementId}`
                            ),
                        ],
                    })),
                });
            },

            deleteElementInEdit: (editId, elementId) => {
                const user = requireUser(get);
                if (!user || !CAN.addRemoveElements(user.role)) {
                    console.warn('RBAC: only editor can delete elements');
                    return;
                }

                const { edits, publishedNetwork } = get();
                const edit = edits[editId];
                if (
                    !edit ||
                    (edit.status !== 'draft' && edit.status !== 'rejected')
                ) {
                    console.warn('RBAC: edit not editable');
                    return;
                }

                const effective = getEffectiveNetwork(
                    publishedNetwork,
                    edit.changes
                );
                const cascade = cascadeDeleteChanges(effective, elementId);

                const filteredChanges = edit.changes.filter(
                    c => !cascade.some(cd => cd.elementId === c.elementId)
                );

                set({
                    edits: updateEdit(edits, editId, e => ({
                        ...e,
                        changes: [...filteredChanges, ...cascade],
                        audit: [
                            ...e.audit,
                            createAuditEntry(
                                'modified',
                                user,
                                `Deleted ${elementId} (+ connected pipes)`
                            ),
                        ],
                    })),
                    selectedElementId:
                        get().selectedElementId === elementId
                            ? null
                            : get().selectedElementId,
                });
            },

            insertJunctionOnPipe: (
                editId,
                pipeId,
                clickPoint,
                junctionProps
            ) => {
                const user = requireUser(get);
                if (!user || !CAN.addRemoveElements(user.role)) {
                    console.warn('RBAC: only editor can insert junctions');
                    return;
                }

                const { edits, publishedNetwork } = get();
                const edit = edits[editId];
                if (
                    !edit ||
                    (edit.status !== 'draft' && edit.status !== 'rejected')
                ) {
                    console.warn('RBAC: edit not editable');
                    return;
                }

                const effective = getEffectiveNetwork(
                    publishedNetwork,
                    edit.changes
                );
                const pipe = effective.elements[pipeId];
                if (!pipe || !isPipe(pipe)) return;

                const result = splitPipeAtPoint(
                    pipe,
                    effective,
                    clickPoint,
                    junctionProps
                );
                if (!result) return;

                const filteredChanges = edit.changes.filter(
                    c => c.elementId !== pipeId
                );

                set({
                    edits: updateEdit(edits, editId, e => ({
                        ...e,
                        changes: [...filteredChanges, ...result.changes],
                        audit: [
                            ...e.audit,
                            createAuditEntry(
                                'modified',
                                user,
                                `Split pipe ${pipeId} at new junction ${result.junction.id}`
                            ),
                        ],
                    })),
                    selectedElementId: result.junction.id,
                    showPendingOverlay: true,
                });
            },

            assignFieldTask: (editId, operatorId, instructions) => {
                const user = requireUser(get);
                if (!user || !CAN.assignFieldTask(user.role)) {
                    console.warn('RBAC: only editor can assign field tasks');
                    return;
                }

                const { edits } = get();
                const edit = edits[editId];
                if (
                    !edit ||
                    (edit.status !== 'draft' && edit.status !== 'rejected')
                ) {
                    console.warn(
                        'RBAC: edit must be draft or rejected to assign'
                    );
                    return;
                }

                const fieldTask: FieldTask = {
                    assignedTo: operatorId,
                    assignedBy: user.id,
                    instructions,
                    assignedAt: new Date().toISOString(),
                    submission: null,
                };

                set({
                    edits: updateEdit(edits, editId, e => ({
                        ...e,
                        status: 'assigned',
                        fieldTask,
                        audit: [
                            ...e.audit,
                            createAuditEntry(
                                'assigned',
                                user,
                                `Assigned to operator ${operatorId}`
                            ),
                        ],
                    })),
                });
            },

            submitForApproval: editId => {
                const user = requireUser(get);
                if (!user || !CAN.submitForApproval(user.role)) {
                    console.warn('RBAC: only editor can submit for approval');
                    return;
                }

                const { edits } = get();
                const edit = edits[editId];
                if (
                    !edit ||
                    !['draft', 'field_submitted', 'rejected'].includes(
                        edit.status
                    )
                ) {
                    console.warn(
                        'RBAC: edit not ready for approval submission'
                    );
                    return;
                }

                set({
                    edits: updateEdit(edits, editId, e => ({
                        ...e,
                        status: 'pending_approval',
                        rejectionReason: null,
                        audit: [
                            ...e.audit,
                            createAuditEntry(
                                'submitted_for_approval',
                                user,
                                'Submitted for admin review'
                            ),
                        ],
                    })),
                });
            },

            submitFieldForm: (editId, submission) => {
                const user = requireUser(get);
                if (!user || !CAN.fillFieldForm(user.role)) {
                    console.warn('RBAC: only operator can submit field form');
                    return;
                }

                const { edits } = get();
                const edit = edits[editId];
                if (!edit || edit.status !== 'assigned' || !edit.fieldTask) {
                    console.warn('RBAC: no assigned field task');
                    return;
                }

                if (edit.fieldTask.assignedTo !== user.id) {
                    console.warn('RBAC: task not assigned to this operator');
                    return;
                }

                const fullSubmission: FieldFormSubmission = {
                    ...submission,
                    submittedBy: user.id,
                    submittedAt: new Date().toISOString(),
                };

                set({
                    edits: updateEdit(edits, editId, e => ({
                        ...e,
                        status: 'field_submitted',
                        fieldTask: e.fieldTask
                            ? { ...e.fieldTask, submission: fullSubmission }
                            : null,
                        audit: [
                            ...e.audit,
                            createAuditEntry(
                                'field_form_submitted',
                                user,
                                `Observed: ${submission.observedValue}, Condition: ${submission.condition}`
                            ),
                        ],
                    })),
                });
            },

            approveEdit: editId => {
                const user = requireUser(get);
                if (!user || !CAN.approveReject(user.role)) {
                    console.warn('RBAC: only admin can approve edits');
                    return;
                }

                const { edits, publishedNetwork } = get();
                const edit = edits[editId];
                if (!edit || edit.status !== 'pending_approval') {
                    console.warn('RBAC: edit not in pending_approval state');
                    return;
                }

                const merged = applyChangesToNetwork(
                    publishedNetwork,
                    edit.changes
                );

                set({
                    publishedNetwork: merged,
                    edits: updateEdit(edits, editId, e => ({
                        ...e,
                        status: 'approved',
                        audit: [
                            ...e.audit,
                            createAuditEntry(
                                'approved',
                                user,
                                'Edit approved and published'
                            ),
                        ],
                    })),
                });
            },

            rejectEdit: (editId, reason) => {
                const user = requireUser(get);
                if (!user || !CAN.approveReject(user.role)) {
                    console.warn('RBAC: only admin can reject edits');
                    return;
                }

                const { edits } = get();
                const edit = edits[editId];
                if (!edit || edit.status !== 'pending_approval') {
                    console.warn('RBAC: edit not in pending_approval state');
                    return;
                }

                set({
                    edits: updateEdit(edits, editId, e => ({
                        ...e,
                        status: 'rejected',
                        rejectionReason: reason,
                        audit: [
                            ...e.audit,
                            createAuditEntry('rejected', user, reason),
                        ],
                    })),
                });
            },

            postThreadMessage: (editId, body) => {
                const user = requireUser(get);
                if (!user || !CAN.postToThread(user.role)) {
                    console.warn('RBAC: must be logged in to post');
                    return;
                }

                const { edits } = get();
                const edit = edits[editId];
                if (!edit) return;

                const message = {
                    id: nanoid(),
                    authorId: user.id,
                    authorRole: user.role,
                    body,
                    timestamp: new Date().toISOString(),
                };

                set({
                    edits: updateEdit(edits, editId, e => ({
                        ...e,
                        thread: [...e.thread, message],
                        audit: [
                            ...e.audit,
                            createAuditEntry(
                                'comment_posted',
                                user,
                                body.slice(0, 80)
                            ),
                        ],
                    })),
                });
            },

            resumeRejectedEdit: editId => {
                const user = requireUser(get);
                if (!user || !CAN.editProperties(user.role)) return;

                const { edits } = get();
                const edit = edits[editId];
                if (!edit || edit.status !== 'rejected') return;

                set({
                    edits: updateEdit(edits, editId, e => ({
                        ...e,
                        status: 'draft',
                        rejectionReason: null,
                    })),
                });
            },
        }),
        {
            name: STORE_KEY,
            partialize: state => ({
                currentUser: state.currentUser,
                publishedNetwork: state.publishedNetwork,
                edits: state.edits,
            }),
        }
    )
);

export { SEED_USERS };
