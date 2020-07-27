import * as dotEnv from 'dotenv';
import app from './server';
import { join } from 'path';

dotEnv.config({ path: join(__dirname, '..', '/', '.env') }),

[
    'JWT_TOKEN_SECRET',
    'PROJECT_ID',
    'GS_I18N_OUTPUT_BUCKET',
    'GS_I18N_INPUT_BUCKET',
    'GS_UPLOADS_BUCKET',
].forEach(k => { if (!process.env[k]) {
    console.error('Missing env var ' + k);
    process.exit(1);
}});

if (process.env.IS_LOCAL && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    process.env.GOOGLE_APPLICATION_CREDENTIALS = join(__dirname, '../google.json');
}

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server is listening at ${PORT}`));
