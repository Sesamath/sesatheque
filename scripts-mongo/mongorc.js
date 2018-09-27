// ce contenu peut être copié dans un ~/.mongorc
// il est utilisé pour précharger ces fonctions utiles lorsque l'on ouvre un shell
// avec ./scripts/mongoApp

let aide = '\nCe shell ajoute plusieurs fonctions utiles pour sesalab: '
/* global db print printjson */
/* eslint-disable no-unused-vars */

// des helpers
aide += '\n\nCes fonctions peuvent aussi être utile dans un find().forEach(e => …)'

const printData = (entity) => printjson(entity._data)
aide += '\n  printData(entity) => affiche entity._data'

const printIndexes = (entity) => {
  delete entity._data
  printjson(entity)
}
aide += '\n  printIndexes(entity) => affiche entity sans _data'
const printAll = (entity) => {
  const data = entity._data
  delete entity._data
  printjson({indexes: entity, data})
}
aide += '\n  printAll(entity) => print {indexes, data} (pretty)'

/**
 * Retourne un critère normé pour find
 * @param {string|object} criteria Si c'est une string la cherchera comme _id, sinon argument passé à find
 * @return {object}
 */
const normCriteria = (criteria) => (typeof criteria === 'string' ? {_id: criteria} : criteria) || {}
/**
 * Si filter est une string renvoie le filtre qui ne remontera que ce champ,
 * sinon renvoie filters (éventuellement undefined)
 * @param {string|object|undefined} filters
 * @return {object|undefined}
 */
const normFilters = (filters) => (typeof filters === 'string') ? {[filters]: true} : filters

aide += '\n\nFonctions génériques'
/**
 * Raccourci pour find
 * @param {string} collection Nom de la collection
 * @param {string|object} criteria Si c'est une string la cherchera comme _id, sinon argument passé à find
 * @param {object} [filters] éventuel 2e argument de find
 */
const find = (collection, criteria, filters) => db.getCollection(collection).find(normCriteria(criteria), normFilters(filters))
aide += '\n  find(collectionName, criteria, filters) : alias de db[collectionName].find(criteria, filters)'
/**
 * Raccourci pour printjson après un find
 * @param collection
 * @param criteria
 * @param filters
 */
const data = (collection, criteria, filters) => find(collection, criteria, filters).limit(50).forEach(printData)
aide += '\n  data(collectionName, criteria, filters) : exécute find puis affiche les 50 premiers résultats (_data only, en clair)'

const all = (collection, criteria, filters) => find(collection, criteria, filters).limit(50).forEach(printAll)
aide += '\n  all(collectionName, criteria, filters) : exécute find puis affiche les 50 premiers résultats ({indexes, data})'

const indexes = (collection, criteria, filters) => find(collection, criteria, filters).limit(50).forEach(printIndexes)
aide += '\n  index(collectionName, criteria, filters) : exécute find puis affiche les 50 premiers résultats ({indexes, data})'

aide += '\n\nLeurs déclinaisons sur nos collections'

/**
 * Recherche parmi Archive
 * @param criteria
 * @param filters
 */
const fa = (criteria, filters) => find('EntityArchive', criteria, filters)
aide += '\n  fa(criteria, filters) : alias de db.EntityArchive.find(criteria, filters)'
const da = (criteria, filters) => data('EntityArchive', criteria, filters)
aide += '\n  da(criteria, filters) : fa + printData'
const ia = (criteria, filters) => indexes('EntityArchive', criteria, filters)
aide += '\n  ia(criteria, filters) : fa + printIndexes'
const aa = (criteria, filters) => all('EntityArchive', criteria, filters)
aide += '\n  aa(criteria, filters) : fa + printAll'

/**
 * Recherche les archives d'un rid particulier
 * @param rid
 * @param criteria
 * @param filters
 */
const far = (rid, criteria, filters) => {
  criteria = normCriteria(criteria)
  criteria.rid = rid
  return fa(criteria, filters)
}
aide += '\n  far(rid, criteria, filters) : alias de db.EntityArchive.find(criteria, filters) avec rid imposé en critère'
const dar = (rid, criteria, filters) => far(rid, criteria, filters).limit(50).forEach(printData)
aide += '\n  dar(rid, criteria, filters) : far + printData'
const iar = (rid, criteria, filters) => far(rid, criteria, filters).limit(50).forEach(printIndexes)
aide += '\n  iar(rid, criteria, filters) : far + printIndexes'
const aar = (rid, criteria, filters) => far(rid, criteria, filters).limit(50).forEach(printAll)
aide += '\n  aar(rid, criteria, filters) : far + printAll'

/**
 * Recherche parmi Groupe
 * @param criteria
 * @param filters
 */
const fg = (criteria, filters) => find('EntityGroupe', criteria, filters)
aide += '\n  fg(criteria, filters) : alias de db.EntityGroupe.find(criteria, filters)'
const dg = (criteria, filters) => data('EntityGroupe', criteria, filters)
aide += '\n  dg(criteria, filters) : fg + printData'
const ig = (criteria, filters) => indexes('EntityGroupe', criteria, filters)
aide += '\n  ig(criteria, filters) : fg + printIndexes'
const ag = (criteria, filters) => all('EntityGroupe', criteria, filters)
aide += '\n  ag(criteria, filters) : fg + printAll'

/**
 * Recherche parmi Utilisateur
 * @param criteria
 * @param filters
 */
const fu = (criteria, filters) => find('EntityPersonne', criteria, filters)
aide += '\n  fu(criteria, filters) : alias de db.EntityPersonne.find(criteria, filters)'
const du = (criteria, filters) => data('EntityPersonne', criteria, filters)
aide += '\n  du(criteria, filters) : fu + printData'
const iu = (criteria, filters) => indexes('EntityPersonne', criteria, filters)
aide += '\n  iu(criteria, filters) : fu + printIndexes'
const au = (criteria, filters) => all('EntityPersonne', criteria, filters)
aide += '\n  au(criteria, filters) : fu + printAll'
/**
 * Recherche parmi Ressource
 * @param criteria
 * @param filters
 */
const fr = (criteria, filters) => find('EntityRessource', criteria, filters)
aide += '\n  fr(criteria, filters) : alias de db.EntityRessource.find(criteria, filters)'
const dr = (criteria, filters) => data('EntityRessource', criteria, filters)
aide += '\n  dr(criteria, filters) : fr + printData'
const ir = (criteria, filters) => indexes('EntityRessource', criteria, filters)
aide += '\n  ir(criteria, filters) : fr + printIndexes'
const ar = (criteria, filters) => all('EntityRessource', criteria, filters)
aide += '\n  ar(criteria, filters) : fr + printAll'
/**
 * Recherche parmi les ressources du type demandé
 * @param {string} type
 * @param {object} [criteria]
 * @param {object} [filters]
 */
const frt = (type, criteria, filters) => {
  criteria = normCriteria(criteria)
  criteria['_data.type'] = type
  return fr(criteria, filters)
}
aide += '\n  frt(type, criteria, filters) : alias de db.EntityRessource.find(criteria, filters) avec type imposé en critère'
const drt = (type, criteria, filters) => frt(type, criteria, filters).limit(50).forEach(printData)
aide += '\n  prt(type, criteria, filters) : frt + printData'
const irt = (type, criteria, filters) => frt(type, criteria, filters).limit(50).forEach(printIndexes)
aide += '\n  irt(type, criteria, filters) : frt + printIndexes'
const art = (type, criteria, filters) => frt(type, criteria, filters).limit(50).forEach(printAll)
aide += '\n  art(type, criteria, filters) : frt + printAll'

aide += '\nTapez `aide` pour revoir cette liste\n'
print(aide)
