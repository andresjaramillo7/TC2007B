import { readFileSync } from 'fs';
import https from 'https';
import app from './app';
import { config } from './config';

const keyPath = config.https.keyPath;
const certPath = config.https.certPath;

if (!keyPath) {
    console.error('TLS_KEY_PATH is not configured.');
    process.exit(1);
}
if (!certPath) {
    console.error('TLS_CERT_PATH is not configured.');
    process.exit(1);
}

let key: string;
let cert: string;

try {
    key = readFileSync(keyPath, 'utf8');
} catch {
    console.error(`Cannot read private-key file from "${keyPath}".`);
    process.exit(1);
}

try {
    cert = readFileSync(certPath, 'utf8');
} catch {
    console.error(`Cannot read certificate file from "${certPath}".`);
    process.exit(1);
}

try {
    https
        .createServer(
            {
                key,
                cert,
                minVersion: 'TLSv1.2',
                maxVersion: 'TLSv1.3',
            },
            app,
        )
        .listen(config.https.port, () => {
            console.log(`Server running on https://localhost:${config.https.port}`); // eslint-disable-line no-console
            console.log(`Environment: ${config.nodeEnv}`); // eslint-disable-line no-console
        });
} catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Failed to start HTTPS server: ${message}`); // eslint-disable-line no-console
    process.exit(1);
}
