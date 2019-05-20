/**
 * Routes de l'api utilisées dans le front react:
 * @module apiRoutes
 */

/**
 * @callback routeGetter
 * @param {object} routeArgs les arguments de la route
 * @param {string} [baseUrl] Le fournir pour avoir des routes absolue (http…/api/), sinon les routes commenceront par /api/
 */

/**
 * Envelopper un getter pour fixer baseUrl si fourni
 * Pas utile si les routes sont uniquement utilisées dans le cadre
 * du front react mais pourrait servir dans sesatheque-client
 * @private
 * @param {routeGetter} getRoute
 * @param {string[]} [argsNeeded] La liste des arguments obligatoires (throw s'ils sont vides undefined)
 * @todo throw si un arg est une chaîne vide. Il faut d'abord s'assurer que le front ne le fait jamais
 * @returns {routeGetter}
 */
const makeGetter = (getRoute, argsNeeded = []) => (params, baseUrl) => {
  if (argsNeeded.length && !params) throw Error(`Il faut passer les paramètres ${argsNeeded.join(' et ')} pour obtenir cette route`)
  argsNeeded.forEach(arg => {
    if (params[arg] === undefined) throw Error(`${arg} est un argument obligatoire pour cette route`)
    // les autres valeurs falsy seront castées en string dans l'url
  })
  return (baseUrl ? `${baseUrl}api/` : '/api/') + getRoute(params)
}

const liste = ({search}) => `liste?${search}`
/**
 * Liste de ressource
 * @type {routeGetter}
 * @param {object} urlParams
 * @param {string} urlParams.search La queryString de la recherche (sans le ?)
 * @param {string} [baseUrl]
 */
export const getRessourceListUrl = makeGetter(liste, ['search'])

const checkPid = ({nom, pid}) => `personne/checkPid?nom=${encodeURIComponent(nom)}&pid=${pid}`
/**
 * Personne d'après son oid
 * @type {routeGetter}
 * @param {object} urlParams
 * @param {string} urlParams.pid
 * @param {string} [baseUrl]
 * @returns {string}
 */
export const getCheckPidUrl = makeGetter(checkPid, ['nom', 'pid'])

const groupesOuverts = () => `groupes/ouverts`
/**
 * Liste des groupes ouverts
 * @param {object} [urlParams] ignoré
 * @param {string} [baseUrl]
 * @type {routeGetter}
 */
export const getGroupesOuvertsUrl = makeGetter(groupesOuverts)

const groupesPublics = () => `groupes/publics`
/**
 * Liste des groupes publics
 * @param {object} [urlParams] ignoré
 * @param {string} [baseUrl]
 * @type {routeGetter}
 */
export const getGroupesPublicsUrl = makeGetter(groupesPublics)

const personneCurrent = () => `personne/current`
/**
 * User courant
 * @param {object} [urlParams] ignoré
 * @param {string} [baseUrl]
 * @type {routeGetter}
 */
export const getCurrentPersonneUrl = makeGetter(personneCurrent)

const clone = ({oid}) => `clone/${oid}`
/**
 * Cloner une ressource
 * @param {object} urlParams
 * @param {string} urlParams.oid
 * @param {string} [baseUrl]
 * @type {routeGetter}
 */
export const getRessourceCloneUrl = makeGetter(clone, ['oid'])

const ressourceUrl = ({oid, format}) => 'ressource' + (oid ? `/${oid}` : '') + (format ? `?format=${format}` : '')
/**
 * Récupérer ou modifier une ressource, avec oid pour GET & DELETE, sans pour POST
 * (toujours sur la route /ressource/ donc avec credentials)
 * @param {object} urlParams
 * @param {string} [urlParams.oid]
 * @param {string} [urlParams.format] passer full pour avoir la résolution des refs externes
 * @param {string} [baseUrl]
 * @type {routeGetter}
 */
export const getRessourceUrl = makeGetter(ressourceUrl)

const createAlias = ({baseId, oid}) => `createAlias/${baseId}/${oid}`
/**
 * Créer un alias d'une ressource (interne ou externe, suivant baseId)
 * (route utilisée par sesatheque-client mais pas le front react)
 * @param {object} urlParams
 * @param {string} urlParams.baseId
 * @param {string} urlParams.oid
 * @param {string} [baseUrl]
 * @type {routeGetter}
 */
export const getCreateAliasUrl = makeGetter(createAlias, ['baseId', 'oid'])

const forkAlias = ({oid}) => `forkAlias/${oid}`
/**
 * fork un alias pour en faire une ressource à part entière
 * @param {object} urlParams
 * @param {string} urlParams.oid
 * @param {string} [baseUrl]
 * @type {routeGetter}
 */
export const getForkAliasUrl = makeGetter(forkAlias, ['oid'])

const groupesPerso = () => `groupes/perso`
/**
 * Liste des groupes du user courant
 * @param {object} [urlParams] ignoré
 * @param {string} [baseUrl]
 * @type {routeGetter}
 */
export const getGroupesPersoUrl = makeGetter(groupesPerso)

const saveGroupe = () => `groupe`
/**
 * Modifier (ou créer) un groupe (POST)
 * @param {object} [urlParams] ignoré
 * @param {string} [baseUrl]
 * @type {routeGetter}
 */
export const getSaveGroupeUrl = makeGetter(saveGroupe)

const groupe = ({nom}) => `groupe/${encodeURIComponent(nom)}`
/**
 * groupe d'après son nom (GET ou DELETE)
 * @param {object} urlParams
 * @param {string} urlParams.nom
 * @param {string} [baseUrl]
 * @type {routeGetter}
 */
export const getGroupeUrl = makeGetter(groupe, ['nom'])

const groupeJoin = ({nom}) => `groupe/rejoindre/${encodeURIComponent(nom)}`
/**
 * Rejoindre un groupe (pour le user courant)
 * @param {object} urlParams
 * @param {string} urlParams.nom
 * @param {string} [baseUrl]
 * @type {routeGetter}
 */
export const getGroupeJoinUrl = makeGetter(groupeJoin, ['nom'])

const groupeFollow = ({nom}) => `groupe/suivre/${encodeURIComponent(nom)}`
/**
 * Suivre un groupe (pour le user courant)
 * @param {object} urlParams
 * @param {string} urlParams.nom
 * @param {string} [baseUrl]
 * @type {routeGetter}
 */
export const getGroupeFollowUrl = makeGetter(groupeFollow, ['nom'])

const groupeLeave = ({nom}) => `groupe/quitter/${encodeURIComponent(nom)}`
/**
 * Quitter un groupe (pour le user courant)
 * @param {object} urlParams
 * @param {string} urlParams.nom
 * @param {string} [baseUrl]
 * @type {routeGetter}
 */
export const getGroupeLeaveUrl = makeGetter(groupeLeave, ['nom'])

const groupeIgnore = ({nom}) => `groupe/ignorer/${encodeURIComponent(nom)}`
/**
 * Ne plus suivre un groupe (pour le user courant)
 * @param {object} urlParams
 * @param {string} urlParams.nom
 * @param {string} [baseUrl]
 * @type {routeGetter}
 */
export const getGroupeIgnoreUrl = makeGetter(groupeIgnore, ['nom'])
