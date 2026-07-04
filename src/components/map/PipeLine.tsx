import type { PropertyChange } from '../../types/edit';

interface PipeLineProps {
    pipe: { id: string; status: string };
    projectedCoords: [number, number][];
    selected: boolean;
    pending?: boolean;
    insertMode?: boolean;
    onSelect: (id: string) => void;
    onSplitClick?: (
        pipeId: string,
        e: React.MouseEvent<SVGPolylineElement>
    ) => void;
}

export function PipeLine({
    pipe,
    projectedCoords,
    selected,
    pending = false,
    insertMode = false,
    onSelect,
    onSplitClick,
}: PipeLineProps) {
    const points = projectedCoords.map(c => c.join(',')).join(' ');
    const mid = projectedCoords[0]
        ? [
              (projectedCoords[0][0] + projectedCoords[1][0]) / 2,
              (projectedCoords[0][1] + projectedCoords[1][1]) / 2,
          ]
        : null;

    let stroke = 'var(--theme-pipe-default)';
    let strokeWidth = 2.5;
    let dashArray: string | undefined;

    if (selected) {
        stroke = 'var(--theme-primary)';
        strokeWidth = 3;
    } else if (pending) {
        stroke = 'var(--theme-pending)';
        strokeWidth = 2.5;
        dashArray = '6 5';
    } else if (pipe.status === 'closed') {
        stroke = 'var(--theme-node-default)';
        dashArray = '4 4';
    }

    return (
        <g>
            <polyline
                points={points}
                fill="none"
                stroke="transparent"
                strokeWidth={16}
                style={{ cursor: insertMode ? 'crosshair' : 'pointer' }}
                onClick={e => {
                    e.stopPropagation();
                    if (insertMode && onSplitClick) {
                        onSplitClick(pipe.id, e);
                        return;
                    }
                    onSelect(pipe.id);
                }}
            />
            <polyline
                points={points}
                fill="none"
                stroke={stroke}
                strokeWidth={strokeWidth}
                strokeDasharray={dashArray}
                strokeLinecap="round"
                style={{ pointerEvents: 'none' }}
            />
            {selected && mid && (
                <text
                    x={mid[0]}
                    y={mid[1] - 10}
                    textAnchor="middle"
                    fontSize={11}
                    fontWeight={500}
                    fill="var(--theme-primary)"
                >
                    {pipe.id} selected
                </text>
            )}
        </g>
    );
}

export function buildPendingChangeMap(
    changes: PropertyChange[]
): Map<string, PropertyChange['changeType']> {
    const map = new Map<string, PropertyChange['changeType']>();
    for (const c of changes) map.set(c.elementId, c.changeType);
    return map;
}
