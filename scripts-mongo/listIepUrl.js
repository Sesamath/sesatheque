// script à utiliser pour lister tous les xml sources
// ./scripts/mongoApp -f scripts-mongo/listJ3pSections.js -q > j3p.list
// pour compter par section faire ensuite
// awk '{print $1}' < j3p.list |sort|uniq -c
// ou bien
// awk '{print $1}' < j3p.list |sort|uniq -c|sed -e 's/^ *//; s/ /\t/'|sort -nr -k1

/* global db print */
db.EntityRessource.find({'_data.type': 'iep'}).sort({dateCreation: 1}).forEach(r => {
  if (r._data.parametres.url) print(r._data.parametres.url, r._id)
})
