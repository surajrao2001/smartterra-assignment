import type { EditStatus } from '../../types/edit';

const STATUS_CONFIG: Record<
    EditStatus,
    { label: string; className: string }
> = {
    draft: {
        label: 'Draft',
        className: 'bg-surface-raised text-text-muted border-border',
    },
    assigned: {
        label: 'Assigned',
        className: 'bg-warning/15 text-warning border-warning/30',
    },
    field_submitted: {
        label: 'Field done',
        className: 'bg-accent/15 text-accent border-accent/30',
    },
    pending_approval: {
        label: 'Pending approval',
        className: 'bg-primary/15 text-primary border-primary/30',
    },
    approved: {
        label: 'Approved',
        className: 'bg-success/15 text-success border-success/30',
    },
    rejected: {
        label: 'Rejected',
        className: 'bg-danger/15 text-danger border-danger/30',
    },
};

export function StatusBadge({ status }: { status: EditStatus }) {
    const config = STATUS_CONFIG[status];
    return (
        <span
            className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${config.className}`}
        >
            {config.label}
        </span>
    );
}
