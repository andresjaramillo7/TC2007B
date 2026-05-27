import app from './app';
import { config } from './config';

app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`); // eslint-disable-line no-console
  console.log(`Environment: ${config.nodeEnv}`); // eslint-disable-line no-console
});
