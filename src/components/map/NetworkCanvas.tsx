import { useEffect, useMemo, useState } from 'react';
import { useActiveEdit } from '../../hooks/useActiveEdit';
import { useCan } from '../../hooks/useCan';
import { useAppStore } from '../../store/useAppStore';
import {
    createSvgProjection,
    getEffectiveNetwork,
    getNetworkBounds,
} from '../../store/networkOps';
import { isPipe, isPointElement } from '../../types/network';
import type { AddElementMode } from '../../utils/elementFactory';
import {
    createJunction,
    createPipeBetweenNodes,
    createValve,
    getAddElementHint,
} from '../../utils/elementFactory';
import { ElementMarker } from './ElementMarker';
import { buildPendingChangeMap, PipeLine } from './PipeLine';

interface NetworkCanvasProps {
    onAddElement?: () => void;
    addElementMode: AddElementMode | null;
    onAddElementModeChange: (mode: AddElementMode | null) => void;
    onAddElementComplete?: () => void;
}

export function NetworkCanvas({
    onAddElement,
    addElementMode,
    onAddElementModeChange,
    onAddElementComplete,
}: NetworkCanvasProps) {
    const publishedNetwork = useAppStore(s => s.publishedNetwork);
    const selectedElementId = useAppStore(s => s.selectedElementId);
    const showPendingOverlay = useAppStore(s => s.showPendingOverlay);
    const togglePendingOverlay = useAppStore(s => s.togglePendingOverlay);
    const setSelectedElement = useAppStore(s => s.setSelectedElement);
    const getOrCreateActiveDraft = useAppStore(s => s.getOrCreateActiveDraft);
    const insertJunctionOnPipe = useAppStore(s => s.insertJunctionOnPipe);
    const addElementToEdit = useAppStore(s => s.addElementToEdit);
    const activeEdit = useActiveEdit();

    const canEdit = useCan('addRemoveElements');
    const [insertMode, setInsertMode] = useState(false);

    useEffect(() => {
        if (addElementMode) setInsertMode(false);
    }, [addElementMode]);

    const pendingChanges = useMemo(() => {
        if (!showPendingOverlay || !activeEdit) return [];
        return activeEdit.changes;
    }, [showPendingOverlay, activeEdit]);

    const pendingChangeMap = useMemo(
        () => buildPendingChangeMap(pendingChanges),
        [pendingChanges]
    );

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

    const mapModeActive = insertMode || !!addElementMode;

    const addElementToDraft = (element: Parameters<typeof addElementToEdit>[1]) => {
        const editId = getOrCreateActiveDraft();
        if (!editId) return false;
        addElementToEdit(editId, element);
        onAddElementModeChange(null);
        onAddElementComplete?.();
        return true;
    };

    const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
        if (!canEdit) return;

        if (addElementMode) {
            if (addElementMode.type === 'pipe') return;

            const clickLngLat = clientToLngLat(
                e.currentTarget,
                e.clientX,
                e.clientY,
                projection
            );
            if (!clickLngLat) return;

            const element =
                addElementMode.type === 'junction'
                    ? createJunction(clickLngLat)
                    : createValve(clickLngLat);
            addElementToDraft(element);
            return;
        }

        if (!insertMode) return;

        const svg = e.currentTarget;
        const clickLngLat = clientToLngLat(svg, e.clientX, e.clientY, projection);
        if (!clickLngLat) return;

        const nearestPipe = findNearestPipe(
            displayNetwork,
            svg,
            e.clientX,
            e.clientY,
            projection
        );

        if (!nearestPipe) return;

        splitPipeAt(nearestPipe.id, clickLngLat);
    };

    const handlePipeSplitClick = (
        pipeId: string,
        e: React.MouseEvent<SVGPolylineElement>
    ) => {
        if (!insertMode || !canEdit) return;

        const svg = e.currentTarget.ownerSVGElement;
        if (!svg) return;

        const clickLngLat = clientToLngLat(svg, e.clientX, e.clientY, projection);
        if (!clickLngLat) return;

        splitPipeAt(pipeId, clickLngLat);
    };

    const handleNodeAddClick = (nodeId: string) => {
        if (!addElementMode || addElementMode.type !== 'pipe' || !canEdit) {
            return;
        }

        if (!addElementMode.pipeStartId) {
            onAddElementModeChange({
                type: 'pipe',
                pipeStartId: nodeId,
            });
            setSelectedElement(nodeId);
            return;
        }

        if (addElementMode.pipeStartId === nodeId) return;

        const pipe = createPipeBetweenNodes(
            displayNetwork,
            addElementMode.pipeStartId,
            nodeId
        );
        if (!pipe) return;

        addElementToDraft(pipe);
    };

    const splitPipeAt = (pipeId: string, clickLngLat: [number, number]) => {
        const editId = getOrCreateActiveDraft();
        if (!editId) return;

        insertJunctionOnPipe(editId, pipeId, clickLngLat, {
            elevation: 200,
            demand: 0,
        });
        setInsertMode(false);
    };

    const draftChangeCount = activeEdit?.changes.length ?? 0;

    return (
        <div className="flex h-full flex-col">
            <div className="flex shrink-0 items-center justify-between px-5 py-3">
                <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-text">
                        Published network
                    </span>
                    {activeEdit && activeEdit.changes.length > 0 && (
                        <label className="flex cursor-pointer items-center gap-2 text-xs text-text-muted">
                            <input
                                type="checkbox"
                                checked={showPendingOverlay}
                                onChange={togglePendingOverlay}
                                className="rounded border-border accent-primary"
                            />
                            Show pending overlay
                        </label>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {canEdit && (
                        <>
                            {addElementMode && (
                                <span className="text-xs text-primary">
                                    {getAddElementHint(addElementMode)}
                                </span>
                            )}
                            {insertMode && !addElementMode && (
                                <span className="text-xs text-primary">
                                    Click a pipe to insert junction…
                                </span>
                            )}
                            <button
                                type="button"
                                onClick={() => {
                                    onAddElementModeChange(null);
                                    onAddElementComplete?.();
                                    setInsertMode(m => !m);
                                }}
                                className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                                    insertMode
                                        ? 'border-primary/50 bg-primary/10 text-primary'
                                        : 'border-border text-text-muted hover:border-border hover:text-text'
                                }`}
                            >
                                Split pipe
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setInsertMode(false);
                                    onAddElement?.();
                                }}
                                className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition ${
                                    addElementMode
                                        ? 'border-primary/50 bg-primary/10 text-primary'
                                        : 'border-border text-text hover:bg-surface-muted'
                                }`}
                            >
                                <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path d="M12 5v14M5 12h14" />
                                </svg>
                                Add element
                            </button>
                        </>
                    )}
                    {canEdit && activeEdit && draftChangeCount > 0 && (
                        <span className="rounded-lg bg-primary px-3.5 py-2 text-xs font-medium text-white">
                            Draft edit · {draftChangeCount} change
                            {draftChangeCount !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col px-5 pb-3">
                <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl border border-[var(--theme-map-border)] bg-map-bg">
                    <svg
                        viewBox={projection.viewBox}
                        className={`h-full w-full ${mapModeActive ? 'cursor-crosshair' : ''}`}
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
                                    insertMode={insertMode}
                                    onSelect={setSelectedElement}
                                    onSplitClick={handlePipeSplitClick}
                                />
                            );
                        })}
                        {Object.values(displayNetwork.elements).map(el => {
                            if (!isPointElement(el)) return null;
                            return (
                                <ElementMarker
                                    key={el.id}
                                    element={el}
                                    projected={projection.project(
                                        el.coordinates
                                    )}
                                    selected={
                                        selectedElementId === el.id ||
                                        addElementMode?.pipeStartId === el.id
                                    }
                                    pending={pendingElementIds.has(el.id)}
                                    pendingChangeType={pendingChangeMap.get(
                                        el.id
                                    )}
                                    addPipeMode={
                                        addElementMode?.type === 'pipe'
                                    }
                                    onSelect={setSelectedElement}
                                    onNodeAddClick={handleNodeAddClick}
                                />
                            );
                        })}
                    </svg>
                </div>
            </div>

            <div className="flex shrink-0 items-center gap-6 border-t border-border px-5 py-2.5 text-xs text-text-muted">
                <span className="flex items-center gap-2">
                    <span className="inline-block h-1 w-6 rounded-full bg-primary" />
                    Selected pipe
                </span>
                <span className="flex items-center gap-2">
                    <svg width="24" height="4" aria-hidden>
                        <line
                            x1="0"
                            y1="2"
                            x2="24"
                            y2="2"
                            stroke="var(--theme-pending)"
                            strokeWidth="2.5"
                            strokeDasharray="6 5"
                            strokeLinecap="round"
                        />
                    </svg>
                    Pending change (unpublished)
                </span>
            </div>
        </div>
    );
}

function clientToLngLat(
    svg: SVGSVGElement,
    clientX: number,
    clientY: number,
    projection: ReturnType<typeof createSvgProjection>
): [number, number] | null {
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM()?.inverse();
    if (!ctm) return null;
    const svgPt = pt.matrixTransform(ctm);
    return projection.invert([svgPt.x, svgPt.y]);
}

function findNearestPipe(
    network: ReturnType<typeof getEffectiveNetwork>,
    svg: SVGSVGElement,
    clientX: number,
    clientY: number,
    projection: ReturnType<typeof createSvgProjection>
): { id: string; dist: number } | null {
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM()?.inverse();
    if (!ctm) return null;
    const svgPt = pt.matrixTransform(ctm);
    const click: [number, number] = [svgPt.x, svgPt.y];

    let nearestPipe: { id: string; dist: number } | null = null;
    for (const el of Object.values(network.elements)) {
        if (!isPipe(el)) continue;
        const projected = el.coordinates.map(c => projection.project(c));
        for (let i = 0; i < projected.length - 1; i += 1) {
            const dist = pointToSegmentDist(
                click,
                projected[i],
                projected[i + 1]
            );
            if (dist < 14 && (!nearestPipe || dist < nearestPipe.dist)) {
                nearestPipe = { id: el.id, dist };
            }
        }
    }
    return nearestPipe;
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
