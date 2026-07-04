import type { PointElement } from '../../types/network';
import type { PropertyChange } from '../../types/edit';

interface ElementMarkerProps {
    element: PointElement;
    projected: [number, number];
    selected: boolean;
    pending?: boolean;
    pendingChangeType?: PropertyChange['changeType'];
    addPipeMode?: boolean;
    onSelect: (id: string) => void;
    onNodeAddClick?: (id: string) => void;
}

export function ElementMarker({
    element,
    projected,
    selected,
    pending = false,
    pendingChangeType,
    addPipeMode = false,
    onSelect,
    onNodeAddClick,
}: ElementMarkerProps) {
    const [x, y] = projected;
    const isValve = element.type === 'valve';
    const isReservoir = element.type === 'reservoir';
    const isPending = pending && !selected;
    const isPendingAdd = isPending && pendingChangeType === 'add';
    const isPendingModify =
        isPending &&
        (pendingChangeType === 'modify' || pendingChangeType === 'delete');

    let fill = 'var(--theme-node-default)';
    if (selected) fill = 'var(--theme-primary)';
    else if (isPendingAdd) fill = 'var(--theme-pending)';
    else if (isReservoir) fill = 'var(--theme-primary)';

    const radius = selected ? 9 : isPendingAdd ? 9 : 7;

    const label = isPendingAdd
        ? `${element.id} (new, pending)`
        : element.id;

    const labelFill = isPending
        ? 'var(--theme-pending)'
        : selected
          ? 'var(--theme-primary)'
          : 'var(--theme-text-muted)';

    return (
        <g
            style={{ cursor: addPipeMode ? 'crosshair' : 'pointer' }}
            onClick={e => {
                e.stopPropagation();
                if (addPipeMode && onNodeAddClick) {
                    onNodeAddClick(element.id);
                    return;
                }
                onSelect(element.id);
            }}
        >
            {isPendingModify && (
                <circle
                    cx={x}
                    cy={y}
                    r={10}
                    fill="none"
                    stroke="var(--theme-pending)"
                    strokeWidth={1.5}
                    strokeDasharray="4 3"
                />
            )}
            {isPendingAdd && (
                <circle
                    cx={x}
                    cy={y}
                    r={13}
                    fill="none"
                    stroke="var(--theme-pending)"
                    strokeWidth={1.5}
                    strokeOpacity={0.7}
                />
            )}
            {isValve ? (
                <polygon
                    points={`${x},${y - 8} ${x + 8},${y} ${x},${y + 8} ${x - 8},${y}`}
                    fill={
                        selected
                            ? 'var(--theme-primary)'
                            : isPending
                              ? 'var(--theme-map-bg)'
                              : 'var(--theme-node-default)'
                    }
                    stroke={
                        selected
                            ? '#fff'
                            : isPending
                              ? 'var(--theme-pending)'
                              : 'var(--theme-surface-raised)'
                    }
                    strokeWidth={1.5}
                    strokeDasharray={isPending && !selected ? '3 2' : undefined}
                />
            ) : isPendingModify && !selected ? (
                <circle
                    cx={x}
                    cy={y}
                    r={7}
                    fill="var(--theme-map-bg)"
                    stroke="var(--theme-pending)"
                    strokeWidth={1.5}
                    strokeDasharray="3 2"
                />
            ) : (
                <circle
                    cx={x}
                    cy={y}
                    r={radius}
                    fill={fill}
                    stroke={selected ? '#fff' : 'var(--theme-surface-raised)'}
                    strokeWidth={1.5}
                />
            )}
            <text
                x={x}
                y={y - 16}
                textAnchor="middle"
                fontSize={10}
                fontWeight={500}
                fill={labelFill}
            >
                {label}
            </text>
        </g>
    );
}
