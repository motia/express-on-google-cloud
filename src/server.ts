import * as express from 'express';
import auth from './auth';
import uploads from './uploads';
import {parse as parseUrl} from 'url';
import unfurl from './unfurl/unfurl';

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

app.get('/parse/:url', auth.authenticateToken, function (req, res, next) {
    const url = req.params.url;
    if (!url) {
        return res.status(400);
    }
    const parsedUrl = parseUrl(req.params.url);
    if (!parsedUrl.hostname) {
        return res.status(400).json({ error: 'Url should have a hostname' });
    }
    if (!parsedUrl.protocol) {
        parsedUrl.protocol = 'https:';
    }


    unfurl(parsedUrl.toString()).then(unfurled => {
        res.status(200).json(unfurled)
    }).catch(e => {
        next(e)
    })
});


app.get('/translate/:url', auth.authenticateToken, function (req, res, next) {
    const url = req.params.url;
    if (!url) {
        return res.status(400);
    }
    const parsedUrl = parseUrl(req.params.url);
    if (!parsedUrl.hostname) {
        return res.status(400).json({ error: 'Url should have a hostname' });
    }
    if (!parsedUrl.protocol) {
        parsedUrl.protocol = 'https:';
    }
    
    // TODO:
});


const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server is listening at ${PORT}`));
