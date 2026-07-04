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

interface NetworkCanvasProps {
    onAddElement?: () => void;
}

export function NetworkCanvas({ onAddElement }: NetworkCanvasProps) {
    const publishedNetwork = useAppStore(s => s.publishedNetwork);
    const selectedElementId = useAppStore(s => s.selectedElementId);
    const showPendingOverlay = useAppStore(s => s.showPendingOverlay);
    const togglePendingOverlay = useAppStore(s => s.togglePendingOverlay);
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
        for (const c of pendingChanges) ids.add(c.elementId);
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
            if (dist < 12 && (!nearestPipe || dist < nearestPipe.dist)) {
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

    const draftChangeCount = activeEdit?.changes.length ?? 0;

    return (
        <div className="flex h-full flex-col">
            <div className="flex shrink-0 items-center justify-between border-b border-border bg-surface px-4 py-2.5">
                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-text">
                        Published network
                    </span>
                    <span className="text-xs text-text-muted">
                        Vancouver open data (filtered bbox)
                    </span>
                    <label className="flex cursor-pointer items-center gap-1.5 text-xs text-text-muted">
                        <input
                            type="checkbox"
                            checked={showPendingOverlay}
                            onChange={togglePendingOverlay}
                            className="rounded border-border"
                        />
                        Show pending overlay
                    </label>
                </div>
                <div className="flex items-center gap-2">
                    {canEdit && (
                        <>
                            <button
                                type="button"
                                onClick={() => setInsertMode(m => !m)}
                                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                                    insertMode
                                        ? 'border-primary bg-primary/10 text-primary'
                                        : 'border-border text-text-muted hover:border-border hover:text-text'
                                }`}
                            >
                                {insertMode
                                    ? 'Click a pipe…'
                                    : 'Split pipe'}
                            </button>
                            <button
                                type="button"
                                onClick={onAddElement}
                                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text transition hover:bg-surface-muted"
                            >
                                Add element
                            </button>
                        </>
                    )}
                    {canEdit && activeEdit && draftChangeCount > 0 && (
                        <span className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white">
                            Draft edit · {draftChangeCount} change
                            {draftChangeCount !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>
            </div>

            <div className="relative min-h-0 flex-1 bg-map-bg">
                <svg
                    viewBox={projection.viewBox}
                    className="h-full w-full"
                    onClick={handleCanvasClick}
                >
                    {Object.values(displayNetwork.elements).map(el => {
                        if (!isPipe(el)) return null;
                        return (
                            <PipeLine
                                key={el.id}
                                pipe={el}
                                projectedCoords={el.coordinates.map(c =>
                                    projection.project(c)
                                )}
                                selected={selectedElementId === el.id}
                                pending={pendingElementIds.has(el.id)}
                                onSelect={setSelectedElement}
                            />
                        );
                    })}
                    {Object.values(displayNetwork.elements).map(el => {
                        if (!isPointElement(el)) return null;
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
                    })}
                </svg>
            </div>

            <div className="flex shrink-0 items-center gap-5 border-t border-border bg-surface px-4 py-2 text-xs text-text-muted">
                <span className="flex items-center gap-1.5">
                    <span className="inline-block h-0.5 w-5 rounded bg-primary" />
                    Selected pipe
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="inline-block h-0.5 w-5 rounded border border-dashed border-pending bg-pending/30" />
                    Pending change (unpublished)
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2 w-2 rounded-full bg-text-muted/50" />
                    Published element
                </span>
            </div>
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
