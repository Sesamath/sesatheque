// Configuration de la base de données
module.exports = {
  root : __dirname+'/..',
  entities : {
    database : require(root + "/../../_private/dbconfig"),
  },
  renderer : {
    cache : false
  },
  layout : {
    data: __dirname+'/../../data',
    cache: __dirname+'/../../data/cache'
  }
}
