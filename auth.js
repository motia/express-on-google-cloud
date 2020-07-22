const knex = require('./db');

function authenticateBasic(username, password) {
    return findUserByusername(username)
        .then((user) => {
            return bcrypt.compare(password, user.password)
        });
}

const findUserByusername = function(username) {
    return knex.queryBuilder()
        .select('id, username')
        .from('users')
        .where('username', username)
        .first();
};

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401);
    }
    const [tokenType, token] = authHeader.split(' ');
    if (!tokenType || tokenType.toLowerCase() !== 'bearer') {
        return res.status(401);
    }

    if (token == null) {
        return res.status(401);
    }

    jwt.verify(token, process.env.TOKEN_SECRET, (err, user) => {
        if (err) {
            res.status(403)
            return
        }
        req.user = user
        next()
    })
}

function issueToken (userId) {
  return jwt.sign(userId, process.env.TOKEN_SECRET, { expiresIn: '1800s' });
}

module.exports = {
    authenticateBasic,
    issueToken,
    authenticateToken
}
