import filteredMains from './vancouver-mains-filtered.json';
import type { NetworkState } from '../types/network';
import {
    vancouverMainsToNetwork,
    type VancouverGeoJson,
} from '../store/vancouverMainsOps';
import type { GeoJsonFeatureCollection } from '../store/networkOps';
import { geoJsonToNetwork } from '../store/networkOps';

// Set false to use the assignment PDF sample network instead
const USE_VANCOUVER_OPEN_DATA = false;

const PDF_SAMPLE_GEOJSON: GeoJsonFeatureCollection = {
    type: 'FeatureCollection' as const,
    features: [
        {
            type: 'Feature' as const,
            properties: {
                id: 'R1',
                type: 'reservoir',
                head: 250,
            },
            geometry: {
                type: 'Point' as const,
                coordinates: [77.593, 12.97],
            },
        },
        {
            type: 'Feature' as const,
            properties: {
                id: 'J1',
                type: 'junction',
                elevation: 210,
                demand: 5,
            },
            geometry: {
                type: 'Point' as const,
                coordinates: [77.5946, 12.9716],
            },
        },
        {
            type: 'Feature' as const,
            properties: {
                id: 'J2',
                type: 'junction',
                elevation: 208,
                demand: 8,
            },
            geometry: {
                type: 'Point' as const,
                coordinates: [77.5966, 12.9726],
            },
        },
        {
            type: 'Feature' as const,
            properties: {
                id: 'J3',
                type: 'junction',
                elevation: 205,
                demand: 3,
            },
            geometry: {
                type: 'Point' as const,
                coordinates: [77.5986, 12.9736],
            },
        },
        {
            type: 'Feature' as const,
            properties: {
                id: 'V1',
                type: 'valve',
                valveType: 'PRV',
                diameter: 250,
                setting: 40,
                status: 'active',
            },
            geometry: {
                type: 'Point' as const,
                coordinates: [77.5976, 12.9731],
            },
        },
        {
            type: 'Feature' as const,
            properties: {
                id: 'P1',
                type: 'pipe',
                start: 'R1',
                end: 'J1',
                length: 500,
                diameter: 300,
                roughness: 130,
                status: 'open',
            },
            geometry: {
                type: 'LineString' as const,
                coordinates: [
                    [77.593, 12.97],
                    [77.5946, 12.9716],
                ],
            },
        },
        {
            type: 'Feature' as const,
            properties: {
                id: 'P2',
                type: 'pipe',
                start: 'J1',
                end: 'J2',
                length: 350,
                diameter: 250,
                roughness: 130,
                status: 'open',
            },
            geometry: {
                type: 'LineString' as const,
                coordinates: [
                    [77.5946, 12.9716],
                    [77.5966, 12.9726],
                ],
            },
        },
        {
            type: 'Feature' as const,
            properties: {
                id: 'P3',
                type: 'pipe',
                start: 'J2',
                end: 'J3',
                length: 300,
                diameter: 250,
                roughness: 130,
                status: 'open',
            },
            geometry: {
                type: 'LineString' as const,
                coordinates: [
                    [77.5966, 12.9726],
                    [77.5986, 12.9736],
                ],
            },
        },
    ],
};

export function createSeedNetwork(): NetworkState {
    if (USE_VANCOUVER_OPEN_DATA) {
        return vancouverMainsToNetwork(
            filteredMains as unknown as VancouverGeoJson,
            {
                maxPipes: 100,
            }
        );
    }
    return geoJsonToNetwork(PDF_SAMPLE_GEOJSON);
}
