import type {
    Junction,
    NetworkElement,
    NetworkState,
    Pipe,
    Reservoir,
} from '../types/network';
import { recomputePipeCoordinates } from './networkOps';

export const VANCOUVER_SEED_BBOX = {
    minLng: -123.065,
    maxLng: -123.058,
    minLat: 49.23,
    maxLat: 49.235,
} as const;

interface VancouverGeoJson {
    type: 'FeatureCollection';
    features: VancouverFeature[];
}

interface VancouverFeature {
    type: 'Feature';
    properties: Record<string, unknown>;
    geometry: {
        type: 'LineString' | 'Point';
        coordinates: [number, number] | [number, number][];
    };
}

export interface VancouverLoadOptions {
    bbox?: typeof VANCOUVER_SEED_BBOX;
    maxPipes?: number;
    addReservoir?: boolean;
}

function endpointKey(coord: [number, number]): string {
    return `${coord[0].toFixed(5)},${coord[1].toFixed(5)}`;
}

function lineIntersectsBbox(
    coords: [number, number][],
    bbox: typeof VANCOUVER_SEED_BBOX
): boolean {
    return coords.some(
        c =>
            c[0] >= bbox.minLng &&
            c[0] <= bbox.maxLng &&
            c[1] >= bbox.minLat &&
            c[1] <= bbox.maxLat
    );
}

function lineLengthMeters(coords: [number, number][]): number {
    let total = 0;
    for (let i = 1; i < coords.length; i++) {
        const dx = coords[i][0] - coords[i - 1][0];
        const dy = coords[i][1] - coords[i - 1][1];
        total += Math.sqrt(dx * dx + dy * dy) * 111000;
    }
    return Math.round(total);
}

function getOrCreateJunction(
    junctions: Map<string, Junction>,
    coord: [number, number]
): string {
    const key = endpointKey(coord);
    const existing = junctions.get(key);
    if (existing) return existing.id;

    const id = `J-${junctions.size + 1}`;
    junctions.set(key, {
        id,
        type: 'junction',
        coordinates: coord,
        elevation: 0,
        demand: 0,
    });
    return id;
}

export function vancouverMainsToNetwork(
    geojson: VancouverGeoJson,
    options: VancouverLoadOptions = {}
): NetworkState {
    const bbox = options.bbox ?? VANCOUVER_SEED_BBOX;
    const maxPipes = options.maxPipes ?? 100;
    const addReservoir = options.addReservoir ?? true;

    const junctions = new Map<string, Junction>();
    const elements: Record<string, NetworkElement> = {};
    let pipeCount = 0;

    for (const feature of geojson.features) {
        if (pipeCount >= maxPipes) break;
        if (feature.geometry.type !== 'LineString') continue;

        const coords = feature.geometry.coordinates as [number, number][];
        if (coords.length < 2) continue;
        if (!lineIntersectsBbox(coords, bbox)) continue;

        const startCoord = coords[0];
        const endCoord = coords[coords.length - 1];
        const startId = getOrCreateJunction(junctions, startCoord);
        const endId = getOrCreateJunction(junctions, endCoord);

        if (startId === endId) continue;

        pipeCount++;
        const diameter = Number(feature.properties.diameter_mm) || 200;
        const material = String(feature.properties.material ?? '');

        const pipe: Pipe = {
            id: `P-${pipeCount}`,
            type: 'pipe',
            start: startId,
            end: endId,
            length: lineLengthMeters(coords),
            diameter,
            roughness: material.includes('Cast Iron') ? 140 : 130,
            status: 'open',
            coordinates: coords,
        };

        elements[pipe.id] = pipe;
    }

    for (const junction of junctions.values()) {
        elements[junction.id] = junction;
    }

    if (addReservoir && junctions.size > 0) {
        const firstJunction = Object.values(elements).find(
            (e): e is Junction => e.type === 'junction'
        );
        if (firstJunction) {
            const reservoir: Reservoir = {
                id: 'R1',
                type: 'reservoir',
                coordinates: [
                    firstJunction.coordinates[0] - 0.0004,
                    firstJunction.coordinates[1],
                ],
                head: 50,
            };
            elements[reservoir.id] = reservoir;

            pipeCount++;
            elements[`P-${pipeCount}`] = {
                id: `P-${pipeCount}`,
                type: 'pipe',
                start: reservoir.id,
                end: firstJunction.id,
                length: lineLengthMeters([
                    reservoir.coordinates,
                    firstJunction.coordinates,
                ]),
                diameter: 300,
                roughness: 130,
                status: 'open',
                coordinates: [
                    reservoir.coordinates,
                    firstJunction.coordinates,
                ],
            };
        }
    }

    return recomputePipeCoordinates({ elements });
}

export type { VancouverGeoJson };
