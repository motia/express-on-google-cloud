'use strict';

const {join} = require('path');
const bcrypt = require('bcrypt');
require('dotenv').config({path: join(__dirname, '..', '.env')});

if (process.env.IS_LOCAL) {
   process.env.GOOGLE_APPLICATION_CREDENTIALS = join(__dirname, '../google.json');
}

const {Firestore} = require('@google-cloud/firestore');

// Create a new client
const firestore = new Firestore();

function makeid(length) {
   let result           = '';
   const characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
   const charactersLength = characters.length;
   for ( let i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result;
}

const username = (process.argv[2] || '').trim();

if (!username) {
    throw new Error('Require username parameter');
}
const password = makeid(12);

const passwordHash = bcrypt.hashSync(password, process.env.SALT_ROUNDS || 10);

firestore.collection('users').add({username, password: passwordHash}).then(async () => {
   console.log(`User# ${username} created with random password`);
   console.log(password);
}).catch(e => {
   console.error(e);
});
