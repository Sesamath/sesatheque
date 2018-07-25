/* global db print */

// pas de require dans un shell mongo, on copie / colle les deux fonctions
function getNormalizedName (nom, strict = true) {
  if (!nom || typeof nom !== 'string' || nom === 'undefined') {
    if (strict) throw Error('nom invalide')
    else return ''
  }
  const cleaned = toAscii(nom.toLowerCase()) // minuscules sans accents
    .replace(/[^a-z0-9]/g, ' ') // sans caractères autres que a-z0-9
    .replace(/  +/g, ' ').trim() // on vire les espaces en double + les éventuels de début et fin
  if (cleaned) return cleaned
  if (strict) throw Error(`nom ${nom} invalide`)
  return ''
}
function toAscii (string) {
  function reducer (acc, r) {
    return acc.replace(r[0], r[1])
  }
  if (typeof string === 'string') {
    // si c'est déjà sans accent on retourne
    if (/^[\w]*$/.test(string)) return string
    // faut inspecter
    var toReplace = [
      [/[áàâäãå]/g, 'a'],
      [/[ÁÀÂÄÃÅ]/g, 'A'],
      ['ç', 'c'],
      ['Ç', 'C'],
      [/[éèêë]/g, 'e'],
      [/[ÉÈÊË]/g, 'E'],
      [/[íìîï]/g, 'i'],
      [/[ÍÌÎÏ]/g, 'I'],
      ['ñ', 'n'],
      ['Ñ', 'N'],
      [/[óòôöõ]/g, 'o'],
      [/[ÓÒÔÖÕ]/g, 'O'],
      [/[úùûü]/g, 'u'],
      [/[ÚÙÛÜ]/g, 'U'],
      [/[ýÿ]/g, 'y'],
      [/[ÝŸ]/g, 'Y'],
      ['æ', 'ae'],
      ['Æ', 'AE'],
      ['œ', 'oe'],
      ['Œ', 'OE']
    ]
    return toReplace.reduce(reducer, string)
  }
  console.error(new TypeError('not a string'), string)
  return ''
}

const dedup = (ar1, ar2) => Array.from(new Set(ar1.concat(ar2)))

const byNom = {}
const toDel = []
const toSave = new Set()

const cursor = db.EntityGroupe.find()
while (cursor.hasNext()) {
  const doc = cursor.next()
  // au cas où ce serait pas déjà le cas
  if (typeof doc._data === 'string') doc._data = JSON.parse(doc._data)
  const n = getNormalizedName(doc._data.nom)
  if (byNom[n]) {
    print(`${n} en double (${doc._data.nom})`)
    // c'est un doublon, faut fusionner les gestionnaires
    const old = byNom[n]
    old._data.gestionnaires = dedup(old._data.gestionnaires, doc._data.gestionnaires)
    // on prend aussi l'oid le plus récent si l'ancien est numérique
    if (Number.isInteger(Number(old._id)) && !Number.isInteger(Number(doc._id))) {
      toDel.push(old._id)
      old._id = doc._id
      old._data.oid = String(doc._id)
    } else {
      toDel.push(doc._id)
    }
    toSave.add(n)
  } else {
    byNom[n] = doc
  }
}

if (toDel.length) {
  // on sauvegarde les modifs
  toSave.forEach(indexedName => {
    db.EntityGroupe.save(byNom[indexedName])
    print(`${indexedName} sauvegardé`)
  })
  // et on efface les doublons
  db.EntityGroupe.remove({_id: {$in: toDel}})
  print(`${toDel.length} groupes en double effacés`)
} else {
  print('Il n’y avait pas de groupe en double')
}
