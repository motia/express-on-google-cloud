import * as express from 'express';
import * as morgan from 'morgan';
import auth from './auth';
import uploads from './uploads';
import * as multer from 'multer';
import {parse as parseUrl, format} from 'url';
import unfurl from './unfurl/unfurl';

const app = express();
app.use(morgan('dev'));

app.use(function (err, req, res, next) {
    console.error(err);
    res.status(500).json({error: 'Something broke!'});
});

app.post('/login/:username/:password', async function(req, res, next) {
    const {username, password} = req.params;
    try {
        const authenitcated = await auth.authenticateBasic(
            username,
            password
        );
        if (authenitcated) {
            res.status(200).json({ token: auth.issueToken(username) });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (e) {
        next(e);
    }
});

app.post('/upload', auth.authenticateToken, multer().single('file'), uploads.uploadEndpoint);
app.get('/download/:identifier', auth.authenticateToken, uploads.downloadEndpoint);

function parseUrlParam(req: express.Request, res: express.Response, next: express.NextFunction) {
    const url = req.params[0];
    if (!url) {
        return res.status(404).json({ error: 'Missing url param' });
    }
    const parsedUrl = parseUrl(url);
    if (!parsedUrl.hostname) {
        return res.status(400).json({ error: 'Url should have a hostname' });
    }
    if (!parsedUrl.protocol) {
        parsedUrl.protocol = 'https:';
    }

    req.params.url = format(parsedUrl);
    next();
}
app.get('/parse/*', auth.authenticateToken, parseUrlParam, function (req, res, next) {
    unfurl(req.params.url).then(unfurled => {
        res.status(200).json(unfurled);
    }).catch(e => {
        next(e);
    });
});


app.get('/translate/*', auth.authenticateToken, parseUrlParam, function (req, res) {
    const url = req.params.url;
    // TODO:
    res.status(412).json({error: 'not implemented'});
});


export default app;
