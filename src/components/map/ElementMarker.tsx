import type { PointElement } from '../../types/network';

interface ElementMarkerProps {
    element: PointElement;
    projected: [number, number];
    selected: boolean;
    pending?: boolean;
    onSelect: (id: string) => void;
}

export function ElementMarker({
    element,
    projected,
    selected,
    pending = false,
    onSelect,
}: ElementMarkerProps) {
    const [x, y] = projected;
    const isValve = element.type === 'valve';
    const isReservoir = element.type === 'reservoir';

    let fill = '#64748b';
    if (selected) fill = '#4d9fff';
    else if (pending) fill = '#fb923c';
    else if (isReservoir) fill = '#4d9fff';

    const label = pending
        ? `${element.id} (new, pending)`
        : element.id;

    return (
        <g
            style={{ cursor: 'pointer' }}
            onClick={e => {
                e.stopPropagation();
                onSelect(element.id);
            }}
        >
            {pending && (
                <circle
                    cx={x}
                    cy={y}
                    r={12}
                    fill="none"
                    stroke="#fb923c"
                    strokeWidth={1.5}
                    strokeDasharray="3 2"
                />
            )}
            {isValve ? (
                <polygon
                    points={`${x},${y - 8} ${x + 8},${y} ${x},${y + 8} ${x - 8},${y}`}
                    fill={fill}
                    stroke={selected ? '#fff' : '#2a3040'}
                    strokeWidth={1.5}
                />
            ) : (
                <circle
                    cx={x}
                    cy={y}
                    r={selected ? 9 : 7}
                    fill={fill}
                    stroke={selected ? '#fff' : '#2a3040'}
                    strokeWidth={1.5}
                />
            )}
            <text
                x={x}
                y={y - 14}
                textAnchor="middle"
                fontSize={10}
                fontWeight={500}
                fill={pending ? '#fb923c' : '#8b95a8'}
            >
                {label}
            </text>
        </g>
    );
}
