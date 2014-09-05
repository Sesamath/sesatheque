/**
 * Parametres de connexion knex à la base Labomep (2013), seulement pour la tache importLabomep,
 */
module.exports = {
  client: "mysql",
  connection: {
    host: "sqlbibli",
    port: "3306",
    user: "xxx",
    password: "xxx",
    database: "labomep",
    debug: ['ComQueryPacket']
  }
};
