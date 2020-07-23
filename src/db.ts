import * as knex from 'knex';
import * as knexfile from '../knexfile.js';

const env = process.env.NODE_ENV || 'development';

export default knex(knexfile[env]);
