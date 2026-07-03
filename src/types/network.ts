export type ElementStatus = 'open' | 'closed' | 'active' | 'inactive';

export interface BaseElement {
    id: string;
    type: 'junction' | 'pipe' | 'valve' | 'reservoir' | 'tank';
}

export interface Junction extends BaseElement {
    type: 'junction';
    coordinates: [number, number];
    elevation: number;
    demand: number;
}

export interface Reservoir extends BaseElement {
    type: 'reservoir';
    coordinates: [number, number];
    head: number;
}

export interface Tank extends BaseElement {
    type: 'tank';
    coordinates: [number, number];
    elevation: number;
    capacity?: number;
}

export interface Valve extends BaseElement {
    type: 'valve';
    coordinates: [number, number];
    valveType: 'PRV' | 'PSV' | 'TCV' | string;
    diameter: number;
    setting: number;
    status: 'active' | 'inactive';
}

export interface Pipe extends BaseElement {
    type: 'pipe';
    start: string;
    end: string;
    length: number;
    diameter: number;
    roughness: number;
    status: 'open' | 'closed';
    coordinates: [number, number][];
}

export type NetworkElement = Junction | Reservoir | Tank | Valve | Pipe;

export type PointElement = Junction | Reservoir | Tank | Valve;

export interface NetworkState {
    elements: Record<string, NetworkElement>;
}

export function isPipe(element: NetworkElement): element is Pipe {
    return element.type === 'pipe';
}

export function isPointElement(
    element: NetworkElement
): element is PointElement {
    return element.type !== 'pipe';
}
