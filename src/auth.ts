import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import * as express from 'express';
import { findUserByUsername } from './db';

async function authenticateBasic(
    username: string,
    password: string,
    findUserByusernameCb: typeof findUserByUsername
): Promise<boolean> {
    const user = await findUserByusernameCb(username);
    return user ? await bcrypt.compare(password, user.password) : false;
}

function authenticateToken(
    req: express.Request,
    res: express.Response, 
    next: express.NextFunction
): void {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.status(401);
        res.end();
        return;
    }
    const [tokenType, token] = authHeader.split(' ');
    if (!tokenType || tokenType.toLowerCase() !== 'bearer') {
        res.status(401);
        res.end();
        return;
    }

    if (token == null) {
        res.status(401);
        res.end();
        return;
    }

    jwt.verify(token, process.env.TOKEN_SECRET || '', (err, user) => {
        if (err) {
            res.status(403).json({ error: 'Invalid auth token' });
            return;
        }
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore-inline
        req.user = user;
        next();
    });
}

function issueToken (username: string): string {
  return jwt.sign({ username }, process.env.TOKEN_SECRET || '', { expiresIn: 3600 });
}

export default {
    authenticateBasic,
    issueToken,
    authenticateToken
};
