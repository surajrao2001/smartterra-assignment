// Place full export at src/data/water-distribution-mains.geojson, then: npm run data:filter-vancouver
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const SOURCE = path.join(root, 'src/data/water-distribution-mains.geojson');
const OUTPUT = path.join(root, 'src/data/vancouver-mains-filtered.json');

const BBOX = {
    minLng: -123.065,
    maxLng: -123.058,
    minLat: 49.23,
    maxLat: 49.235,
};

const MAX_FEATURES = 120;

function lineIntersectsBbox(coords) {
    return coords.some(
        c =>
            c[0] >= BBOX.minLng &&
            c[0] <= BBOX.maxLng &&
            c[1] >= BBOX.minLat &&
            c[1] <= BBOX.maxLat
    );
}

if (!fs.existsSync(SOURCE)) {
    console.error(`Missing source file: ${SOURCE}`);
    console.error(
        'Download water-distribution-mains GeoJSON from Vancouver open data first.'
    );
    process.exit(1);
}

console.log('Reading full GeoJSON (this may take a few seconds)…');
const geojson = JSON.parse(fs.readFileSync(SOURCE, 'utf8'));

const filtered = geojson.features
    .filter(
        f =>
            f.geometry?.type === 'LineString' &&
            lineIntersectsBbox(f.geometry.coordinates)
    )
    .slice(0, MAX_FEATURES);

const out = {
    type: 'FeatureCollection',
    features: filtered,
};

fs.writeFileSync(OUTPUT, JSON.stringify(out));
console.log(
    `Wrote ${filtered.length} features to ${path.relative(root, OUTPUT)}`
);
