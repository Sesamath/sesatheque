/**
 * Nos paramètres de connexion à la base de données, hors git
 *
 * Dans un fichier js (et pas json) pour pouvoir mettre des commentaires
 * @see http://knexjs.org/#Installation-client
 */
module.exports = {
  client: "mysql",
  connection: {
    host: "sqlbibli",
    port: "3306",
    user: "xxx",
    password: "yyy",
    database: "bibliotheque"
  }
};
