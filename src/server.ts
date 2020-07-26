import * as express from 'express';
import * as morgan from 'morgan';
import auth from './auth';
import uploads from './uploads';
import {translate} from './translate';
import * as multer from 'multer';
import {parse as parseUrl, format} from 'url';
import unfurl from './unfurl/unfurl';
import { findUserByUsername } from './db';

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
            password,
            findUserByUsername
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

function getLangFromQuery(query: typeof express.request.query)  {
    if (!query.lang) {
        return 'ja';
    }
    let lang = query.lang;
    if (Array.isArray(query.lang === 'string')) {
        lang = query.lang[0];
    }
    const allowedLangs = 
    ['af','sq','am','ar','hy','az','eu','be','bn','bs','bg','ca','ceb','zh-CN','zh','zh-TW','co','hr','cs','da','nl','en','eo','et','fi','fr','fy','gl','ka','de','el','gu','ht','ha','haw','he','iw','hi','hmn','hu','is','ig','id','ga','it','ja','jv','kn','kk','km','rw','ko','ku','ky','lo','la','lv','lt','lb','mk','mg','ms','ml','mt','mi','mr','mn','my','ne','no','ny','or','ps','fa','pl','pt','pa','ro','ru','sm','gd','sr','st','sn','sd','si','sk','sl','so','es','su','sw','sv','tl','tg','ta','tt','te','th','tr','tk','uk','ur','ug','uz','vi','cy','xh','yi','yo','zu'];

    if (typeof lang === 'string' && allowedLangs.includes(lang)) {
        return lang;
    }

    return 'ja';
};


app.get('/translate/*', auth.authenticateToken, parseUrlParam, async function (req, res, next) {
    const url = req.params.url;
    const lang = getLangFromQuery(req.query);

    try {
        const html = await translate(url, lang);
        res.status(200)
            .header('content-type', 'application/html')
            .end(html);
    } catch (e) {
        next(e);
    }
});

export default app;
