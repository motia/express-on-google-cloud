const express = require('express');
const {authenticateToken, authenticateBasic, issueToken} = require('./auth')
const uploads = require('./uploads')

const app = express();

app.post('/login:/username/:password', async function(req, res) {
    const {username, password} = req.params;
    try {
        const authenitcated = await authenticateBasic(
            username,
            password
        );
        if (authenitcated) {
            res.status(200).json({ token: issueToken(username) })
        } else {
            res.status(401, {message: 'Invalid credentials'})
        }
    } catch (e) {
        next(e);
    }
});

app.post('/upload', authenticateToken, uploads.uploadEndpoint);
app.get('/download/:identifier', authenticateToken, uploads.downloadEndpoint);

const PORT = procss.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server is listening at ${PORT}`));
