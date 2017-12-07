// ce contenu peut être copié dans un ~/.mongorc
// il est utilisé pour précharger ces fonctions utiles lorsque l'on ouvre un shell
// avec ./scripts/mongoApp

let aide = '\nCe shell ajoute plusieurs fonctions utiles pour sesalab: '
/* global db, printjson */
/**
 * Affiche en json doc._data si ça existe (doc sinon)
 * @param doc Un doc mongo
 */
const pe = (doc) => printjson(doc._data ? JSON.parse(doc._data) : doc)
aide += '\n  pe(doc) : Affiche en json doc._data si ça existe (doc sinon)'
/**
 * Raccourci pour find
 * @param {string} collection Nom de la collection
 * @param {string|object} criteria Si c'est une string la cherchera comme _id, sinon argument passé à find
 * @param {object} [filters] éventuel 2e argument de find
 */
const f = (collection, criteria, filters) => db.getCollection(collection).find(normCriteria(criteria), normFilters(filters))
aide += '\n  f(collectionName, criteria, filters) : alias de db[collectionName].find(criteria, filters)'
/**
 * Raccourci pour printjson après un find
 * @param collection
 * @param criteria
 * @param filters
 */
const p = (collection, criteria, filters) => f(collection, criteria, filters).limit(50).forEach(pe)
aide += '\n  p(collectionName, criteria, filters) : exécute f puis affiche les 50 premiers résultats (_data only, en clair)'
/**
 * Retourne un critère normé pour find
 * @param {string|object} criteria Si c'est une string la cherchera comme _id, sinon argument passé à find
 * @return {object} toujours un object
 */
const normCriteria = (criteria) => (typeof criteria === 'string') ? {_id: criteria} : criteria || {}
/**
 * Si filter est une string renvoie le filtre qui ne remontera que ce champ,
 * sinon renvoie filters (éventuellement undefined)
 * @param {string|object|undefined} filters
 * @return {object|undefined}
 */
const normFilters = (filters) => (typeof filters === 'string') ? {[filters]: true} : filters
/**
 * Recherche parmi Archive
 * @param criteria
 * @param filters
 */
const fa = (criteria, filters) => f('EntityArchive', criteria, filters)
aide += '\n  fa(criteria, filters) : alias de db.EntityArchive.find(criteria, filters)'
const pa = (criteria, filters) => p('EntityArchive', criteria, filters)
aide += '\n  pa(criteria, filters) : fa + print'
/**
 * Recherche les archives d'un rid
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
const par = (rid, criteria, filters) => far(rid, criteria, filters).limit(50).forEach(pe)
aide += '\n  par(rid, criteria, filters) : far + print'
/**
 * Recherche parmi Groupe
 * @param criteria
 * @param filters
 */
const fg = (criteria, filters) => f('EntityGroupe', criteria, filters)
aide += '\n  fg(criteria, filters) : alias de db.EntityGroupe.find(criteria, filters)'
const pg = (criteria, filters) => p('EntityGroupe', criteria, filters)
aide += '\n  pg(criteria, filters) : fg + print'
/**
 * Recherche parmi Utilisateur
 * @param criteria
 * @param filters
 */
const fu = (criteria, filters) => f('EntityPersonne', criteria, filters)
aide += '\n  fu(criteria, filters) : alias de db.EntityPersonne.find(criteria, filters)'
const pu = (criteria, filters) => p('EntityPersonne', criteria, filters)
aide += '\n  pu(criteria, filters) : fu + print'
/**
 * Recherche parmi Ressource
 * @param criteria
 * @param filters
 */
const fr = (criteria, filters) => f('EntityRessource', criteria, filters)
aide += '\n  fr(criteria, filters) : alias de db.EntityRessource.find(criteria, filters)'
const pr = (criteria, filters) => p('EntityRessource', criteria, filters)
aide += '\n  pr(criteria, filters) : fr + print'
/**
 * Recherche parmi les ressources du type demandé
 * @param {string} type
 * @param {object} [criteria]
 * @param {object} [filters]
 */
const frt = (type, criteria, filters) => {
  criteria = normCriteria(criteria)
  criteria.type = type
  return fr(criteria, filters)
}
aide += '\n  frt(type, criteria, filters) : alias de db.EntityRessource.find(criteria, filters) avec type imposé en critère'
const prt = (type, criteria, filters) => frt(type, criteria, filters).limit(50).forEach(pe)
aide += '\n  prt(type, criteria, filters) : frt + print'

aide += '\nTapez `aide` pour revoir cette liste\n'
print(aide)
