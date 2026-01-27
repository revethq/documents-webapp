#!/usr/bin/env node

/**
 * Fetches the OpenAPI spec from the backend and removes SCIM-related content.
 * SCIM schemas contain a `$ref` property that conflicts with JSON Schema's $ref keyword.
 */

const fs = require('fs');
const path = require('path');

const BACKEND_URL = process.env.OPENAPI_URL || 'http://localhost:5051/openapi?format=json';
const OUTPUT_PATH = path.join(__dirname, '..', 'openapi.json');

async function fetchAndFilter() {
  console.log(`Fetching OpenAPI spec from ${BACKEND_URL}...`);

  const response = await fetch(BACKEND_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch OpenAPI spec: ${response.status} ${response.statusText}`);
  }

  const spec = await response.json();

  // Remove SCIM tags
  if (spec.tags) {
    spec.tags = spec.tags.filter(tag => !tag.name.startsWith('SCIM'));
  }

  // Remove SCIM paths
  if (spec.paths) {
    for (const path of Object.keys(spec.paths)) {
      if (path.includes('/scim')) {
        delete spec.paths[path];
      }
    }
  }

  // Remove SCIM schemas
  if (spec.components?.schemas) {
    for (const schema of Object.keys(spec.components.schemas)) {
      if (schema.startsWith('Scim')) {
        delete spec.components.schemas[schema];
      }
    }
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(spec, null, 2));
  console.log(`Filtered OpenAPI spec written to ${OUTPUT_PATH}`);
}

fetchAndFilter().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
