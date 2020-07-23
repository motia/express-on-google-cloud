import * as express from 'express';
import auth from './auth';
import uploads from './uploads';

const app = express();

app.post('/login:/username/:password', async function(req, res, next) {
    const {username, password} = req.params;
    try {
        const authenitcated = await auth.authenticateBasic(
            username,
            password
        );
        if (authenitcated) {
            res.status(200).json({ token: auth.issueToken(username) })
        } else {
            res.status(401).json({ message: 'Invalid credentials' })
        }
    } catch (e) {
        next(e);
    }
});

app.post('/upload', auth.authenticateToken, uploads.uploadEndpoint);
app.get('/download/:identifier', auth.authenticateToken, uploads.downloadEndpoint);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server is listening at ${PORT}`));
