
exports.up = function(knex) {
    return knex.schema
        .createTable('uploads', function (table) {
            table.increments('id');
            table.string('path', 255).notNullable();
            table.string('name', 255).notNullable();
            table.integer('userId').unsigned().notNullable();

            table.foreign('userId').references('id').inTable('users');
        })
};

exports.down = function(knex) {
    knex.schema.dropTable('uploads');
};

