/**
 * Nos paramètres locaux, dont connexion à la base de données, que l'on conserve hors git
 *
 * Dans un fichier js (et pas json) pour pouvoir mettre des commentaires
 * @see http://knexjs.org/#Installation-client pour la syntaxe de entities.database
 */
module.exports = {
  entities : {
    database: {
      /* pour mysql */
      client: "mysql",
      connection: {
        host: "xxx",
        port: "3306",
        user: "xxx",
        password: "xxx",
        database: "xxx",
        debug: ['ComQueryPacket']
      }
      /* pour pgsql * /
       client    : "pg",
       connection: {
       host    : "xxx",
       port    : "5432",
       user    : "xxx",
       password: "xxx",
       database: "xxx"
       } /* */
    }
  },
  server : {
    port:process.env.PORT || 3001
  },
  memcache : '127.0.0.1:11211'
};
