import { readFileSync } from 'fs';
import { join } from 'path';
import swaggerUi from 'swagger-ui-express';
import { load } from 'js-yaml';

const yamlPath = join(__dirname, '../../docs/openapi.yaml');

let swaggerDocument: Record<string, unknown>;

try {
  const yamlContent = readFileSync(yamlPath, 'utf8');
  swaggerDocument = load(yamlContent) as Record<string, unknown>;
} catch (err) {
  const message =
    err instanceof Error ? err.message : String(err);
  console.error(`Failed to load or parse OpenAPI spec from ${yamlPath}: ${message}`);
  process.exit(1);
}

export { swaggerDocument };
export const swaggerServe = swaggerUi.serve;

export const swaggerSetup = swaggerUi.setup(swaggerDocument as swaggerUi.JsonObject, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Grade Tracker API Docs',
});
