/* global db print printjson ObjectId */

print('Supression des clés vides')
let result = db.EntityRessource.updateMany({cle: ''}, {$unset: {cle: '', _data: {cle: ''}}})
print(`${result.modifiedCount} propriétés cle supprimées (elles étaient vides)`)

print('suppression des clés des ressources publiques')
result = db.EntityRessource.updateMany({publie: true, restriction: 0}, {$unset: {cle: '', _data: {cle: ''}}})
print(`${result.modifiedCount} propriétés cle supprimées (ressources publiques)`)

// les doublons de clés
let nb = 0
let agCursor = db.EntityRessource.aggregate([
  {
    $group: {
      _id: {cle: '$cle'},
      count: {$sum: 1}
    }
  }, {
    $match: {count: {$gt: 1}}
  }
])
while (agCursor.hasNext()) {
  const result = agCursor.next()
  const cle = result._id.cle
  if (cle !== null) {
    print(`${result.count} doublons pour la clé ${cle}`)
    nb++
    // faut aller chercher toutes les copies qui ont conservé la même clé, et en mettre une autre
    const rCursor = db.EntityRessource.find({cle})
    while (rCursor.hasNext()) {
      const ressource = rCursor.next()
      ressource.cle = ObjectId().valueOf()
      print(`pour ${ressource._id} on met la clé ${ressource.cle}`)
      ressource._data.cle = ressource.cle
      db.EntityRessource.save(ressource)
    }
  }
}
if (nb === 0) print('Aucun doublon de clé')

// il faut aller remplir tous les rid vides…
// on doit récupérer notre baseId, mais on a pas de require…
