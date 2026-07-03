import type { PointElement } from '../../types/network';

const TYPE_COLORS: Record<string, string> = {
    junction: '#2563eb',
    valve: '#7c3aed',
    reservoir: '#059669',
    tank: '#0891b2',
};

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
    const color = TYPE_COLORS[element.type] ?? '#64748b';
    const r = selected ? 9 : 7;

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
                    r={r + 4}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    strokeDasharray="3 2"
                />
            )}
            <circle
                cx={x}
                cy={y}
                r={r}
                fill={color}
                stroke={selected ? '#0f172a' : '#fff'}
                strokeWidth={selected ? 2 : 1.5}
            />
            <text
                x={x}
                y={y - 12}
                textAnchor="middle"
                fontSize={10}
                fill="#475569"
            >
                {element.id}
            </text>
        </g>
    );
}
