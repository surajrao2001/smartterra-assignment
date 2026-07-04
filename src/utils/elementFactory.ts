import { nanoid } from 'nanoid';
import { planarDistance } from '../store/networkOps';
import type {
    Junction,
    NetworkElement,
    NetworkState,
    Pipe,
    PointElement,
    Valve,
} from '../types/network';
import { isPointElement } from '../types/network';

export type AddElementType = 'junction' | 'valve' | 'pipe';

export interface AddElementMode {
    type: AddElementType;
    pipeStartId?: string;
}

/** IDs: J-xxxxxx, V-xxxxxx, P-xxxxxx (6-char nanoid, same as pipe split) */
export function generateElementId(type: AddElementType): string {
    const prefix = type === 'pipe' ? 'P' : type === 'valve' ? 'V' : 'J';
    return `${prefix}-${nanoid(6)}`;
}

export function createJunction(coordinates: [number, number]): Junction {
    return {
        id: generateElementId('junction'),
        type: 'junction',
        coordinates,
        elevation: 200,
        demand: 0,
    };
}

export function createValve(coordinates: [number, number]): Valve {
    return {
        id: generateElementId('valve'),
        type: 'valve',
        coordinates,
        valveType: 'PRV',
        diameter: 200,
        setting: 30,
        status: 'active',
    };
}

export function createPipeBetweenNodes(
    network: NetworkState,
    startId: string,
    endId: string
): Pipe | null {
    const startEl = network.elements[startId];
    const endEl = network.elements[endId];
    if (
        !startEl ||
        !endEl ||
        !isPointElement(startEl) ||
        !isPointElement(endEl)
    ) {
        return null;
    }

    return {
        id: generateElementId('pipe'),
        type: 'pipe',
        start: startId,
        end: endId,
        length: planarDistance(startEl.coordinates, endEl.coordinates),
        diameter: 250,
        roughness: 130,
        status: 'open',
        coordinates: [startEl.coordinates, endEl.coordinates],
    };
}

export function getAddElementHint(mode: AddElementMode): string {
    if (mode.type === 'junction') {
        return 'Click the map to place a junction…';
    }
    if (mode.type === 'valve') {
        return 'Click the map to place a valve…';
    }
    if (!mode.pipeStartId) {
        return 'Click the start node for the new pipe…';
    }
    return `Start: ${mode.pipeStartId} — click the end node…`;
}
