import type { Role } from '../types/user';

export const CAN = {
    viewMap: (r: Role | undefined) => !!r,
    editProperties: (r: Role | undefined) => r === 'editor',
    addRemoveElements: (r: Role | undefined) => r === 'editor',
    assignFieldTask: (r: Role | undefined) => r === 'editor',
    fillFieldForm: (r: Role | undefined) => r === 'operator',
    submitForApproval: (r: Role | undefined) => r === 'editor',
    approveReject: (r: Role | undefined) => r === 'admin',
    publish: (r: Role | undefined) => r === 'admin',
    postToThread: (r: Role | undefined) => !!r,
} as const;

export type Permission = keyof typeof CAN;
