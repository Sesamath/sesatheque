/* global db print ObjectId */

print('Supression des clés vides')
// https://docs.mongodb.com/manual/reference/method/db.collection.updateMany/
let result = db.EntityRessource.updateMany({cle: ''}, {$unset: {cle: '', '_data.cle': ''}})
print(`${result.modifiedCount} propriétés cle supprimées (elles étaient vides)`)

print('suppression des clés des ressources publiques')
result = db.EntityRessource.updateMany({publie: true, restriction: 0}, {$unset: {cle: '', '_data.cle': ''}})
print(`${result.modifiedCount} propriétés cle supprimées (ressources publiques)`)

// les doublons de clés
let nb = 0
// https://docs.mongodb.com/manual/reference/method/db.collection.aggregate/
db.EntityRessource.aggregate([
  {
    $group: {
      _id: {cle: '$cle'},
      count: {$sum: 1}
    }
  }, {
    $match: {count: {$gt: 1}}
  }
]).forEach(result => {
  const cle = result._id.cle
  if (cle !== null) {
    print(`${result.count} doublons pour la clé ${cle}`)
    nb++
    // faut aller chercher toutes les copies qui ont conservé la même clé, et en mettre une autre
    const rCursor = db.EntityRessource.find({cle})
    while (rCursor.hasNext()) {
      const ressource = rCursor.next()
      // https://docs.mongodb.com/manual/reference/method/ObjectId.valueOf/#ObjectId.valueOf
      ressource.cle = ObjectId().valueOf()
      print(`pour ${ressource._id} on met la clé ${ressource.cle}`)
      ressource._data.cle = ressource.cle
      db.EntityRessource.save(ressource)
    }
  }
})
if (nb === 0) print('Aucun doublon de clé')

// il faut aller remplir tous les rid vides…
// on doit récupérer notre baseId, mais on a pas de require… on va regarder en base
let cursor = db.EntityRessource.find()
let baseId
while (cursor.hasNext() && !baseId) {
  const r = cursor.next()
  if (r.rid) {
    baseId = r.rid.substr(0, r.rid.indexOf('/'))
    print(`On a trouvé baseId=${baseId}`)
  }
}
nb = 0
const setRid = (r) => {
  nb++
  const rid = `${baseId}/${r.oid}`
  delete r.rid
  r._data.rid = rid
  db.EntityRessource.save(r)
}
db.EntityRessource.find({rid: {$in: ['', null]}}).forEach(setRid)
db.EntityRessource.find({'_data.rid': {$in: ['', null]}}).forEach(setRid)
print(`${nb} ressources sans rid corrigées`)
