// script à utiliser pour retrouver les sections utilisées dans les graphes de la bibliotheque
// ./scripts/mongoApp -f scripts-mongo/listJ3pSections.js -q > j3p.list
// pour compter par section faire ensuite
// awk '{print $1}' < j3p.list |sort|uniq -c
// ou bien
// awk '{print $1}' < j3p.list |sort|uniq -c|sed -e 's/^ *//; s/ /\t/'|sort -n -k1

/* global db print */
db.EntityRessource.find({'_data.type': 'j3p'}).sort({dateCreation: 1}).forEach(r => {
  const {g} = r._data.parametres
  if (g && g.length) {
    g.forEach((node) => {
      if (!Array.isArray(node) || node.length < 1) return
      const s = node[1]
      if (s && s !== 'fin') print(s, r._data.oid)
    })
  }
})
