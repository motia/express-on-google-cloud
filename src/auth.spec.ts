import * as express from 'express';
import auth from './auth';
import { strictEqual, fail } from 'assert';
import db from './db';
import * as bcrypt from 'bcrypt';
import { promisify } from 'util';


describe('test authenticate', async function () {
    this.beforeAll(async () => {
        await db('users').delete();
        await db('users')
            .insert({ 
                username: 'username', password: 
                bcrypt.hashSync('correctpassword', process.env.SALT_ROUNDS || 10)
           });
    })


    it('authenticateBasic success', async function () {
        strictEqual(
            await auth.authenticateBasic('username', 'correctpassword').catch(fail),
            true
        )
    });

    it('authenticateBasic fails when email is wrong', async function () {
        strictEqual(
            await auth.authenticateBasic('username', 'wrongpassword').catch(fail),
            false
        )
    });

    it('authenticateBasic fails when password is wrong', async function () {
        strictEqual(
            await auth.authenticateBasic('xxx', 'wrongpassword').catch(fail),
            false
        )
    });

    this.afterAll(() => {
        db.destroy();
    })
});


describe('test issue token', function () {
    it('issue and verify token', async function () {
        const token = auth.issueToken('999');
        strictEqual(!!token, true);

        const req = { user: undefined, headers: { authorization: `bearer ${token}` } };

        try {
            await promisify(auth.authenticateToken)(
                req as express.Request,
                {} as express.Response
            );
            strictEqual(!!req.user, true);
            strictEqual((req.user as any).userId, '999');
        } catch (err) {
            fail('Should not fail');
        }
    });
});
