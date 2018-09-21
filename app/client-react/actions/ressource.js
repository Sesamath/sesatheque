import {DELETE, GET, POST} from '../utils/httpMethods'
import {addNotification} from './notifications'
import getUrls from 'sesatheque-client/src/getUrls'
import {baseUrl} from '../../server/config'
import {
  getRessourceCloneUrl,
  getRessourceUrl,
  getForkAliasUrl
} from '../apiRoutes'

/**
 * Retourne l'action de type SET_RESSOURCE pour affecter une ressource dans le store
 * @param ressource
 * @return {{type: string, ressource: Ressource}}
 */
const setRessource = (ressource) => {
  ressource._urls = getUrls(ressource, baseUrl)
  return {
    type: 'SET_RESSOURCE',
    ressource
  }
}

/**
 * Retourne l'action de type CLEAR_RESSOURCE pour retirer la ressource du store
 * @return {{type: string}}
 */
const clearRessource = () => ({
  type: 'CLEAR_RESSOURCE'
})

/**
 * Retourne l'actionCreator qui supprime la ressource
 * @param {string} oid
 * @returns {promisedThunk} qui supprime puis dispatch clearRessource & redirect
 */
export const cloneRessource = (
  oid,
  success = () => {}
) => (dispatch) => {
  const requestSuccess = ({oid}) => {
    dispatch(addNotification({
      level: 'info',
      message: 'La ressource a été dupliquée'
    }))

    if (!oid) throw Error('La réponse n’est pas au format attendu')

    return success(oid)
  }
  const requestError = (error) => dispatch(addNotification({
    level: 'error',
    message: `La duplication a échouée : ${error.message}`
  }))

  // ça c'est une anomalie du controleur, ça devrait être /ressource/clone/:oid, vu que les routes risquent de changer on laisse
  return GET(getRessourceCloneUrl({oid}))
    .then(requestSuccess, requestError)
}

/**
 * Retourne l'actionCreator qui supprime la ressource
 * @param {string} oid
 * @returns {promisedThunk} qui supprime puis dispatch clearRessource & redirect
 */
export const deleteRessource = (
  oid,
  success = () => {}
) => (dispatch) => {
  const requestSuccess = () => {
    dispatch(addNotification({
      level: 'info',
      message: 'La ressource a été supprimée'
    }))
    dispatch(clearRessource())
    return success()
  }
  const requestError = (error) => dispatch(addNotification({
    level: 'error',
    message: `La suppression a échoué : ${error.message}`
  }))

  return DELETE(getRessourceUrl({oid}))
    .then(requestSuccess, requestError)
}

/**
 * @callback promisedThunk
 * @param dispatch
 * @param getState
 * @return {Promise}
 */

/**
 * Retourne l'actionCreator qui va forker l'alias via un GET sur l'api
 * @param {string} oid
 * @return {promisedThunk}
 */
export const forkAlias = (oid) => (dispatch, getState) => {
  const requestSuccess = (ressource) => dispatch(setRessource(ressource))
  const requestError = (error) => {
    console.error(error)
    dispatch(addNotification({
      level: 'error',
      message: `Impossible d'éditer cette ressource : ${error.message}`
    }))
  }

  return GET(getForkAliasUrl({oid}))
    .then(requestSuccess, requestError)
}

/**
 * Retourne l'actionCreator qui va sauvegarder la ressource via un POST sur l'api
 * @param {Ressource} ressource
 * @return {promisedThunk} qui va faire le post puis dispatch de setRessource & addNotification
 */
export const saveRessource = (
  ressource,
  success = () => {}
) => (dispatch) => {
  const requestSuccess = (responseRessource) => {
    dispatch(addNotification({
      level: 'info',
      message: 'La ressource a été sauvegardée'
    }))
    if (responseRessource.$warnings) {
      responseRessource.$warnings.forEach(warning => dispatch(addNotification({level: 'warning', message: warning})))
    }
    dispatch(setRessource(responseRessource))

    return success(responseRessource)
  }
  const requestError = (error) => dispatch(addNotification({
    level: 'error',
    message: `La sauvegarde a échoué : ${error.message}`
  }))

  return POST(getRessourceUrl({format: 'full'}), {body: ressource})
    .then(requestSuccess, requestError)
}

/**
 * Retourne l'actionCreator qui charge une ressource via GET sur l'api
 * @param oid
 * @return {function(*, *): Promise<any>}
 */
export const loadRessource = (oid) => (dispatch, getState) => {
  const currentRessource = getState().ressource
  if (currentRessource && currentRessource.oid === oid) return

  const requestSuccess = (ressource) => dispatch(setRessource(ressource))

  const requestError = (error) => {
    console.error(error)
    dispatch(addNotification({
      level: 'error',
      message: `Impossible de charger la ressource : ${error.message}`
    }))
  }
  // On lance toujours un clear avant load pour ne pas garder l'ancienne dans le store
  // (au cas où le load plante)
  // Si le dispatch throw (à cause d'un reducer qui plante) ça remontera (sans renvoyer de promesse)
  return Promise.resolve(dispatch(clearRessource()))
    .then(() => GET(getRessourceUrl({oid, format: 'full'})))
    .then(requestSuccess, requestError)
}
