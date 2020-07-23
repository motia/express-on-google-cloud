const knex = require('knex')
const bcrypt = require('bcrypt')
const knexConfig = require('../knexfile')


function makeid(length) {
   let result           = '';
   const characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
   const charactersLength = characters.length;
   for ( let i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result;
}

const username = process.argv[2];

if (!username) {
    throw new Error('Require username parameter');
}
const password = makeid(12);
const passwordHash = bcrypt.hashSync(password, process.env.SALT_ROUNDS || 10);

const connection = knex(knexConfig[process.env.NODE_ENV || 'development']);
connection('users')
  .insert({ username, password: passwordHash })
  .then(() => {
    console.log(`User ${username} created with random password`);
    console.log(password);
    connection.destroy();
});
