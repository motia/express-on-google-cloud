
import { Firestore } from '@google-cloud/firestore';

const firestore = new Firestore;

interface User {password: string, username: string}
export const findUserByUsername = async function (username: string): Promise<
    null | User
> {
    const snapshot = await firestore.collection('users').where('username', '==', username)
        .limit(1)    
        .get();
    if (snapshot.empty) {
        return null;
    }

    return snapshot.docs[0].data() as User;
};


interface UploadRecord {id: string, username: string, path: string, name: string}

export const createUploadRecord = async function(
    username: string,
    docData: {path: string, name: string}
): Promise<UploadRecord|null> {
    const docRef = await firestore.collection(`users/${username}/uploads`).add(docData);
    const data = (await docRef.get()).data() as UploadRecord;
    if (!data) {
        throw new Error()
    }
    return data ? { ...data, id: docRef.id } : null;
};

export const findUploadRecord = async function(
    {username, identifier}: {username: string, identifier: string}
):
    Promise<UploadRecord|null
> {
    return (await firestore
        .doc(`users/${username}/uploads/${identifier}`)
        .get()
    ).data() as UploadRecord;
};