import * as dotEnv from 'dotenv';
import app from './server';
import { join } from 'path';

dotEnv.config({ path: join(__dirname, '..', '/', '.env') }),

[
    'TOKEN_SECRET',
    'GOOGLE_CLOUD_PROJECT_ID',
    'GS_I18N_OUTPUT_BUCKET',
    'GS_I18N_INPUT_BUCKET',
    'GS_UPLOADS_BUCKET',
].forEach(k => { if (!process.env[k]) {
    console.error('Missing env var ' + k);
    process.exit(1);
}});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server is listening at ${PORT}`));
