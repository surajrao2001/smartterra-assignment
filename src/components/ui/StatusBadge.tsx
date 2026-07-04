import type { EditStatus } from '../../types/edit';

const STATUS_CONFIG: Record<
    EditStatus,
    { label: string; className: string }
> = {
    draft: {
        label: 'Draft',
        className:
            'bg-surface-raised text-text-muted border-border',
    },
    assigned: {
        label: 'Assigned',
        className: 'bg-warning/20 text-warning border-warning/40',
    },
    field_submitted: {
        label: 'Field done',
        className: 'bg-accent/15 text-accent border-accent/30',
    },
    pending_approval: {
        label: 'Pending approval',
        className: 'bg-primary/20 text-primary border-primary/40',
    },
    approved: {
        label: 'Approved',
        className: 'bg-success/15 text-success border-success/30',
    },
    rejected: {
        label: 'Rejected',
        className: 'bg-danger/20 text-danger border-danger/40',
    },
};

export function StatusBadge({ status }: { status: EditStatus }) {
    const config = STATUS_CONFIG[status];
    return (
        <span
            className={`inline-flex shrink-0 items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${config.className}`}
        >
            {config.label}
        </span>
    );
}

export function ElementStatusBadge({ status }: { status: string }) {
    const isOpen =
        status === 'open' || status === 'active' || status === 'Open';
    return (
        <span
            className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium capitalize ${
                isOpen
                    ? 'border-success/40 bg-success/15 text-success'
                    : 'border-border bg-surface-raised text-text-muted'
            }`}
        >
            {status}
        </span>
    );
}
