/**
 * Parametres de connexion knex à la base mepcol, seulement pour la tache importMEPS,
 */
module.exports = {
  client: "mysql",
  connection: {
    host: "sqlbibli",
    port: "3306",
    user: "xxx",
    password: "xxx",
    database: "mepcol",
    debug: ['ComQueryPacket']
  }
};