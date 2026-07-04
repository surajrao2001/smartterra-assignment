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
    const mid = projectedCoords[0]
        ? [
              (projectedCoords[0][0] + projectedCoords[1][0]) / 2,
              (projectedCoords[0][1] + projectedCoords[1][1]) / 2,
          ]
        : null;

    let stroke = '#4a5568';
    let strokeWidth = 2.5;
    let dashArray: string | undefined;

    if (selected) {
        stroke = '#4d9fff';
        strokeWidth = 3.5;
    } else if (pending) {
        stroke = '#fb923c';
        strokeWidth = 2.5;
        dashArray = '6 4';
    } else if (pipe.status === 'closed') {
        stroke = '#64748b';
        dashArray = '4 4';
    }

    return (
        <g>
            <polyline
                points={points}
                fill="none"
                stroke="transparent"
                strokeWidth={14}
                style={{ cursor: 'pointer' }}
                onClick={e => {
                    e.stopPropagation();
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
                    y={mid[1] - 8}
                    textAnchor="middle"
                    fontSize={11}
                    fontWeight={500}
                    fill="#4d9fff"
                >
                    {pipe.id} selected
                </text>
            )}
        </g>
    );
}
