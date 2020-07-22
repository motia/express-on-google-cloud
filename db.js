const knex = require('knex')({
    client: 'sqlite',
    connection: {
        filename: './mydb.sqlite'
    },
    pool: { min: 0, max: 7 }
  });


module.exports = knex;