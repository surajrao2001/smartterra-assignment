import type { Pipe } from '../../types/network';

interface PipeLineProps {
    pipe: Pipe;
    projectedCoords: [number, number][];
    selected: boolean;
    pending?: boolean;
    onSelect: (id: string) => void;
}

export function PipeLine({
    pipe,
    projectedCoords,
    selected,
    pending = false,
    onSelect,
}: PipeLineProps) {
    const points = projectedCoords.map(c => c.join(',')).join(' ');

    return (
        <g>
            <polyline
                points={points}
                fill="none"
                stroke="transparent"
                strokeWidth={12}
                style={{ cursor: 'pointer' }}
                onClick={e => {
                    e.stopPropagation();
                    onSelect(pipe.id);
                }}
            />
            <polyline
                points={points}
                fill="none"
                stroke={
                    selected
                        ? '#2563eb'
                        : pending
                          ? '#f59e0b'
                          : pipe.status === 'closed'
                            ? '#94a3b8'
                            : '#334155'
                }
                strokeWidth={selected ? 4 : 3}
                strokeDasharray={pending ? '6 4' : undefined}
                style={{ pointerEvents: 'none' }}
            />
        </g>
    );
}
