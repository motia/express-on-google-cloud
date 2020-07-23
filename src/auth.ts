import knex from './db';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import * as express from 'express';

const TOKEN_SECRET = process.env.TOKEN_SECRET || (() => {
    throw new Error('env var TOKEN_SECRET must be set');
})() || '' 

function authenticateBasic(username: string, password: string) {
    return findUserByusername(username)
        .then((user) => {
            return bcrypt.compare(password, user.password)
        });
}

const findUserByusername = function (username: string) {
    return knex.queryBuilder()
        .select('id, username')
        .from('users')
        .where('username', username)
        .first();
};

function authenticateToken(
    req: express.Request,
    res: express.Response, 
    next: express.NextFunction
) {
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

    jwt.verify(token, TOKEN_SECRET, (err, user) => {
        if (err) {
            res.status(403)
            return
        }
        req.user = user as any as string;
        next()
    })
}

function issueToken (userId: string) {
  return jwt.sign(userId, TOKEN_SECRET, { expiresIn: '1800s' });
}

export default {
    authenticateBasic,
    issueToken,
    authenticateToken
}
