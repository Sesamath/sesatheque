// ce contenu peut être copié dans un ~/.mongorc
// il est utilisé pour précharger ces fonctions utiles lorsque l'on ouvre un shell
// avec ./scripts/mongoApp

/* global db, printjson */
/**
 * Affiche en json doc._data si ça existe (doc sinon)
 * @param doc Un doc mongo
 */
const pe = (doc) => printjson(doc._data ? JSON.parse(doc._data) : doc)
/**
 * Raccourci pour find
 * @param {string} collection Nom de la collection
 * @param {string|object} criteria Si c'est une string la cherchera comme _id, sinon argument passé à find
 * @param {object} [filters] éventuel 2e argument de find
 */
const f = (collection, criteria, filters) => db.getCollection(collection).find(normCriteria(criteria), normFilters(filters))
/**
 * Raccourci pour print
 * @param collection
 * @param criteria
 * @param filters
 */
const p = (collection, criteria, filters) => f(criteria, filters).limit(50).forEach(pe)

/**
 * Retourne un critère normé pour find
 * @param {string|object} criteria Si c'est une string la cherchera comme _id, sinon argument passé à find
 * @return {object}
 */
const normCriteria = (criteria) => (typeof criteria === 'string') ? {_id: criteria} : criteria || {}
const normFilters = (filters) => (typeof filters === 'string') ? {[filters]: true} : filters
/**
 * Recherche parmi Groupe
 * @param criteria
 * @param filters
 */
const fg = (criteria, filters) => f('EntityGroupe', criteria, filters)
const pg = (criteria, filters) => f('EntityGroupe', criteria, filters)
/**
 * Recherche parmi Résultat
 * @param criteria
 * @param filters
 */
const fr = (criteria, filters) => f('EntityRessource', criteria, filters)
const pr = (criteria, filters) => f('EntityRessource', criteria, filters)
/**
 * Recherche parmi Utilisateur
 * @param criteria
 * @param filters
 */
const fu = (criteria, filters) => f('EntityPersonne', criteria, filters)
const pu = (criteria, filters) => f('EntityPersonne', criteria, filters)
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
const prt = (type, criteria, filters) => frt(type, criteria, filters).limit(50).forEach(pe)
