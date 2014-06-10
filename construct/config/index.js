// Configuration de la base de données
module.exports = {
  root : __dirname+'/..',
  entities : {
    database : {
      client: 'sqlite3',
      connection: {
        filename : __dirname+'/../../data/mydb.sqlite'
      }
    },
  },
  renderer : {
    cache : false
  },
  layout : {
    data: __dirname+'/../../data',
    cache: __dirname+'/../../data/cache'
  }
}
