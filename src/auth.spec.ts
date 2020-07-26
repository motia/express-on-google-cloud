import * as express from 'express';
import auth from './auth';
import { strictEqual, fail } from 'assert';
import * as bcrypt from 'bcrypt';
import { promisify } from 'util';


describe('test authenticate', async function () {
    const registeredUser = {
        username: 'username_saved_in_db',
        password: 'correctpassword',
    };
    const findRegisteredUser = async () => ({
        username: registeredUser.username,
        password: bcrypt.hashSync('correctpassword', process.env.SALT_ROUNDS || 10)
    });

    it('authenticateBasic success', async function () {
        try {
            await auth.authenticateBasic(registeredUser.username, registeredUser.password, findRegisteredUser).catch(fail);
        } catch(e) {
            console.error(e);
        }
        strictEqual(
            await auth.authenticateBasic(registeredUser.username, registeredUser.password, findRegisteredUser).catch(fail),
            true
        );
    });

    it('authenticateBasic fails when email is wrong', async function () {
        strictEqual(
            await auth.authenticateBasic(registeredUser.username, 'wrongpassword', findRegisteredUser).catch(fail),
            false
        );
    });

    it('authenticateBasic fails when password is wrong', async function () {
        strictEqual(
            await auth.authenticateBasic('unregistered_user', 'wrongpassword', async () => null).catch(fail),
            false
        );
    });
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
            strictEqual((req.user as any).username, '999');
        } catch (err) {
            fail('Should not fail');
        }
    });
});
