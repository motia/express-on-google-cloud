// Update with your config settings.

module.exports = {
  test: {
    client: 'sqlite3',
    connection: {
      filename: './databases/test.sqlite3'
    }
  },

  development: {
    client: 'sqlite3',
    connection: {
      filename: './databases/dev.sqlite3'
    }
  },

  staging: {
    client: 'sqlite3',
    connection: {
      filename: './databases/staging.sqlite3'
    }
  },

  production: {
    client: 'sqlite3',
    connection: {
      filename: './databases/production.sqlite3'
    }
  }

};
