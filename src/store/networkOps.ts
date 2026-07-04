import { nanoid } from 'nanoid';
import type { PropertyChange } from '../types/edit';
import type {
    Junction,
    NetworkElement,
    NetworkState,
    Pipe,
    PointElement,
} from '../types/network';
import { isPipe, isPointElement } from '../types/network';

export interface GeoJsonFeatureCollection {
    type: 'FeatureCollection';
    features: GeoJsonFeature[];
}

interface GeoJsonFeature {
    type: 'Feature';
    properties: Record<string, unknown>;
    geometry: {
        type: 'Point' | 'LineString';
        coordinates: [number, number] | [number, number][];
    };
}

export interface NetworkBounds {
    minLng: number;
    maxLng: number;
    minLat: number;
    maxLat: number;
}

export interface SvgProjection {
    viewBox: string;
    project: (lngLat: [number, number]) => [number, number];
}

const SVG_PADDING = 40;

export function geoJsonToNetwork(
    geojson: GeoJsonFeatureCollection
): NetworkState {
    const elements: Record<string, NetworkElement> = {};

    for (const feature of geojson.features) {
        const props = feature.properties;
        const id = String(props.id);

        if (feature.geometry.type === 'Point') {
            const coords = feature.geometry.coordinates as [number, number];
            const type = String(props.type);

            if (type === 'junction') {
                elements[id] = {
                    id,
                    type: 'junction',
                    coordinates: coords,
                    elevation: Number(props.elevation),
                    demand: Number(props.demand),
                };
            } else if (type === 'reservoir') {
                elements[id] = {
                    id,
                    type: 'reservoir',
                    coordinates: coords,
                    head: Number(props.head),
                };
            } else if (type === 'tank') {
                elements[id] = {
                    id,
                    type: 'tank',
                    coordinates: coords,
                    elevation: Number(props.elevation),
                    capacity: props.capacity
                        ? Number(props.capacity)
                        : undefined,
                };
            } else if (type === 'valve') {
                elements[id] = {
                    id,
                    type: 'valve',
                    coordinates: coords,
                    valveType: String(props.valveType),
                    diameter: Number(props.diameter),
                    setting: Number(props.setting),
                    status: props.status as 'active' | 'inactive',
                };
            }
        } else if (feature.geometry.type === 'LineString') {
            const coords = feature.geometry.coordinates as [number, number][];
            elements[id] = {
                id,
                type: 'pipe',
                start: String(props.start),
                end: String(props.end),
                length: Number(props.length),
                diameter: Number(props.diameter),
                roughness: Number(props.roughness),
                status: props.status as 'open' | 'closed',
                coordinates: coords,
            };
        }
    }

    return { elements: recomputePipeCoordinates({ elements }).elements };
}

export function recomputePipeCoordinates(network: NetworkState): NetworkState {
    const elements = { ...network.elements };

    for (const element of Object.values(elements)) {
        if (!isPipe(element)) continue;

        const startEl = elements[element.start];
        const endEl = elements[element.end];

        if (
            startEl &&
            isPointElement(startEl) &&
            endEl &&
            isPointElement(endEl)
        ) {
            elements[element.id] = {
                ...element,
                coordinates: [startEl.coordinates, endEl.coordinates],
            };
        }
    }

    return { elements };
}

export function getNetworkBounds(network: NetworkState): NetworkBounds {
    const coords: [number, number][] = [];

    for (const element of Object.values(network.elements)) {
        if (isPipe(element)) {
            coords.push(...element.coordinates);
        } else {
            coords.push(element.coordinates);
        }
    }

    const lngs = coords.map(c => c[0]);
    const lats = coords.map(c => c[1]);

    return {
        minLng: Math.min(...lngs),
        maxLng: Math.max(...lngs),
        minLat: Math.min(...lats),
        maxLat: Math.max(...lats),
    };
}

export interface FullSvgProjection extends SvgProjection {
    invert: (svgPoint: [number, number]) => [number, number];
    width: number;
    height: number;
}

export function createSvgProjection(
    bounds: NetworkBounds,
    width = 800,
    height = 600
): FullSvgProjection {
    const lngRange = bounds.maxLng - bounds.minLng || 0.001;
    const latRange = bounds.maxLat - bounds.minLat || 0.001;

    const innerWidth = width - SVG_PADDING * 2;
    const innerHeight = height - SVG_PADDING * 2;

    const project = (lngLat: [number, number]): [number, number] => {
        const x =
            SVG_PADDING + ((lngLat[0] - bounds.minLng) / lngRange) * innerWidth;
        const y =
            SVG_PADDING +
            (1 - (lngLat[1] - bounds.minLat) / latRange) * innerHeight;
        return [x, y];
    };

    const invert = (svgPoint: [number, number]): [number, number] => {
        const lng =
            bounds.minLng +
            ((svgPoint[0] - SVG_PADDING) / innerWidth) * lngRange;
        const lat =
            bounds.minLat +
            (1 - (svgPoint[1] - SVG_PADDING) / innerHeight) * latRange;
        return [lng, lat];
    };

    return {
        viewBox: `0 0 ${width} ${height}`,
        project,
        invert,
        width,
        height,
    };
}

export function planarDistance(
    a: [number, number],
    b: [number, number]
): number {
    const dx = a[0] - b[0];
    const dy = a[1] - b[1];
    return Math.sqrt(dx * dx + dy * dy) * 111000;
}

export function nearestPointOnSegment(
    point: [number, number],
    a: [number, number],
    b: [number, number]
): [number, number] {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const lenSq = dx * dx + dy * dy;

    if (lenSq === 0) return a;

    let t = ((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));

    return [a[0] + t * dx, a[1] + t * dy];
}

export function distanceToSegment(
    point: [number, number],
    a: [number, number],
    b: [number, number]
): number {
    const nearest = nearestPointOnSegment(point, a, b);
    const dx = point[0] - nearest[0];
    const dy = point[1] - nearest[1];
    return Math.sqrt(dx * dx + dy * dy);
}

export function getPointElement(
    network: NetworkState,
    id: string
): PointElement | undefined {
    const el = network.elements[id];
    return el && isPointElement(el) ? el : undefined;
}

export function getConnectedPipeIds(
    network: NetworkState,
    elementId: string
): string[] {
    return Object.values(network.elements)
        .filter(
            (el): el is Pipe =>
                isPipe(el) && (el.start === elementId || el.end === elementId)
        )
        .map(el => el.id);
}

export function cascadeDeleteChanges(
    network: NetworkState,
    elementId: string
): PropertyChange[] {
    const element = network.elements[elementId];
    if (!element) return [];

    const changes: PropertyChange[] = [];

    if (isPointElement(element)) {
        const connectedPipes = getConnectedPipeIds(network, elementId);
        for (const pipeId of connectedPipes) {
            const pipe = network.elements[pipeId];
            if (pipe) {
                changes.push({
                    elementId: pipeId,
                    changeType: 'delete',
                    before: { ...pipe },
                    after: null,
                });
            }
        }
    }

    changes.push({
        elementId,
        changeType: 'delete',
        before: { ...element },
        after: null,
    });

    return changes;
}

export interface SplitPipeResult {
    junction: Junction;
    pipe1: Pipe;
    pipe2: Pipe;
    changes: PropertyChange[];
}

export function splitPipeAtPoint(
    pipe: Pipe,
    network: NetworkState,
    clickPoint: [number, number],
    junctionProps: Omit<Junction, 'id' | 'type' | 'coordinates'>
): SplitPipeResult | null {
    const startEl = getPointElement(network, pipe.start);
    const endEl = getPointElement(network, pipe.end);
    if (!startEl || !endEl) return null;

    const splitCoords = nearestPointOnSegment(
        clickPoint,
        startEl.coordinates,
        endEl.coordinates
    );

    const junctionId = `J-${nanoid(6)}`;
    const junction: Junction = {
        id: junctionId,
        type: 'junction',
        coordinates: splitCoords,
        elevation: junctionProps.elevation,
        demand: junctionProps.demand,
    };

    const len1 = planarDistance(startEl.coordinates, splitCoords);
    const len2 = planarDistance(splitCoords, endEl.coordinates);

    const pipe1: Pipe = {
        id: `P-${nanoid(6)}`,
        type: 'pipe',
        start: pipe.start,
        end: junctionId,
        length: len1,
        diameter: pipe.diameter,
        roughness: pipe.roughness,
        status: pipe.status,
        coordinates: [startEl.coordinates, splitCoords],
    };

    const pipe2: Pipe = {
        id: `P-${nanoid(6)}`,
        type: 'pipe',
        start: junctionId,
        end: pipe.end,
        length: len2,
        diameter: pipe.diameter,
        roughness: pipe.roughness,
        status: pipe.status,
        coordinates: [splitCoords, endEl.coordinates],
    };

    const changes: PropertyChange[] = [
        {
            elementId: pipe.id,
            changeType: 'delete',
            before: { ...pipe },
            after: null,
        },
        {
            elementId: junctionId,
            changeType: 'add',
            before: null,
            after: { ...junction },
        },
        {
            elementId: pipe1.id,
            changeType: 'add',
            before: null,
            after: { ...pipe1 },
        },
        {
            elementId: pipe2.id,
            changeType: 'add',
            before: null,
            after: { ...pipe2 },
        },
    ];

    return { junction, pipe1, pipe2, changes };
}

export function applyChangesToNetwork(
    network: NetworkState,
    changes: PropertyChange[]
): NetworkState {
    const elements = { ...network.elements };

    for (const change of changes) {
        if (change.changeType === 'add' && change.after) {
            elements[change.elementId] = change.after as NetworkElement;
        } else if (change.changeType === 'modify' && change.after) {
            const existing = elements[change.elementId];
            if (existing) {
                elements[change.elementId] = {
                    ...existing,
                    ...change.after,
                } as NetworkElement;
            }
        } else if (change.changeType === 'delete') {
            delete elements[change.elementId];
        }
    }

    return recomputePipeCoordinates({ elements });
}

export function getEffectiveNetwork(
    published: NetworkState,
    changes: PropertyChange[]
): NetworkState {
    return applyChangesToNetwork(
        { elements: { ...published.elements } },
        changes
    );
}
