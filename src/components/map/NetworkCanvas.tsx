import { useMemo, useState } from 'react';
import { useActiveEdit } from '../../hooks/useActiveEdit';
import { useCan } from '../../hooks/useCan';
import { useAppStore } from '../../store/useAppStore';
import {
    createSvgProjection,
    getEffectiveNetwork,
    getNetworkBounds,
} from '../../store/networkOps';
import { isPipe, isPointElement } from '../../types/network';
import { ElementMarker } from './ElementMarker';
import { PipeLine } from './PipeLine';

export function NetworkCanvas() {
    const publishedNetwork = useAppStore(s => s.publishedNetwork);
    const selectedElementId = useAppStore(s => s.selectedElementId);
    const showPendingOverlay = useAppStore(s => s.showPendingOverlay);
    const setSelectedElement = useAppStore(s => s.setSelectedElement);
    const getOrCreateActiveDraft = useAppStore(s => s.getOrCreateActiveDraft);
    const insertJunctionOnPipe = useAppStore(s => s.insertJunctionOnPipe);
    const activeEdit = useActiveEdit();

    const canEdit = useCan('addRemoveElements');
    const [insertMode, setInsertMode] = useState(false);

    const pendingChanges = useMemo(() => {
        if (!showPendingOverlay || !activeEdit) return [];
        return activeEdit.changes;
    }, [showPendingOverlay, activeEdit]);

    const displayNetwork = useMemo(() => {
        if (pendingChanges.length > 0) {
            return getEffectiveNetwork(publishedNetwork, pendingChanges);
        }
        return publishedNetwork;
    }, [publishedNetwork, pendingChanges]);

    const pendingElementIds = useMemo(() => {
        const ids = new Set<string>();
        for (const c of pendingChanges) {
            ids.add(c.elementId);
        }
        return ids;
    }, [pendingChanges]);

    const projection = useMemo(() => {
        const bounds = getNetworkBounds(displayNetwork);
        return createSvgProjection(bounds);
    }, [displayNetwork]);

    const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
        if (!insertMode || !canEdit) return;

        const svg = e.currentTarget;
        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const svgPt = pt.matrixTransform(svg.getScreenCTM()?.inverse());

        const clickLngLat = projection.invert([svgPt.x, svgPt.y]);

        let nearestPipe: { id: string; dist: number } | null = null;
        for (const el of Object.values(displayNetwork.elements)) {
            if (!isPipe(el)) continue;
            const [a, b] = el.coordinates;
            const pa = projection.project(a);
            const pb = projection.project(b);
            const dist = pointToSegmentDist([svgPt.x, svgPt.y], pa, pb);
            if (dist < 10 && (!nearestPipe || dist < nearestPipe.dist)) {
                nearestPipe = { id: el.id, dist };
            }
        }

        if (!nearestPipe) return;

        const editId = getOrCreateActiveDraft();
        if (!editId) return;

        insertJunctionOnPipe(editId, nearestPipe.id, clickLngLat, {
            elevation: 200,
            demand: 0,
        });
        setInsertMode(false);
    };

    return (
        <div className="relative flex h-full flex-col">
            {canEdit && (
                <div className="flex gap-2 border-b border-border bg-surface-muted p-2">
                    <button
                        type="button"
                        onClick={() => setInsertMode(m => !m)}
                        className={`rounded px-3 py-1 text-sm ${
                            insertMode
                                ? 'bg-primary text-white'
                                : 'border border-border hover:bg-surface'
                        }`}
                    >
                        {insertMode
                            ? 'Click pipe to insert junction…'
                            : 'Insert junction on pipe'}
                    </button>
                </div>
            )}
            <svg
                viewBox={projection.viewBox}
                className="h-full w-full bg-surface"
                onClick={handleCanvasClick}
            >
                {Object.values(displayNetwork.elements).map(el => {
                    if (isPipe(el)) {
                        const coords = el.coordinates.map(c =>
                            projection.project(c)
                        );
                        return (
                            <PipeLine
                                key={el.id}
                                pipe={el}
                                projectedCoords={coords}
                                selected={selectedElementId === el.id}
                                pending={pendingElementIds.has(el.id)}
                                onSelect={setSelectedElement}
                            />
                        );
                    }
                    return null;
                })}
                {Object.values(displayNetwork.elements).map(el => {
                    if (isPointElement(el)) {
                        return (
                            <ElementMarker
                                key={el.id}
                                element={el}
                                projected={projection.project(el.coordinates)}
                                selected={selectedElementId === el.id}
                                pending={pendingElementIds.has(el.id)}
                                onSelect={setSelectedElement}
                            />
                        );
                    }
                    return null;
                })}
            </svg>
        </div>
    );
}

function pointToSegmentDist(
    p: [number, number],
    a: [number, number],
    b: [number, number]
): number {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]);
    let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const proj: [number, number] = [a[0] + t * dx, a[1] + t * dy];
    return Math.hypot(p[0] - proj[0], p[1] - proj[1]);
}
