import {DELETE, GET, POST} from '../utils/httpMethods'
import {addNotification} from './notifications'
import getUrls from 'sesatheque-client/src/getUrls'
import {baseUrl} from '../../server/config'
import {
  ressourceCloneUrl,
  ressourceUrl,
  ressourceForkAliasUrl
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
export const cloneRessource = (oid, success) => (dispatch) => {
  // ça c'est une anomalie du controleur, ça devrait être /ressource/clone/:oid, vu que les routes risquent de changer on laisse
  return GET(ressourceCloneUrl({oid}))
    .then(({oid}) => {
      if (!oid) throw Error('La réponse n’est pas au format attendu')

      dispatch(addNotification({
        level: 'info',
        message: 'La ressource a été dupliquée'
      }))
      return oid
    })
    .then(success)
    .catch((error) => dispatch(addNotification({
      level: 'error',
      message: `La duplication a échouée : ${error.message}`
    })))
}

/**
 * Retourne l'actionCreator qui supprime la ressource
 * @param {string} oid
 * @returns {promisedThunk} qui supprime puis dispatch clearRessource & redirect
 */
export const deleteRessource = (oid, success) => (dispatch) => {
  return DELETE(ressourceUrl({oid}))
    .then(() => {
      return dispatch(clearRessource())
    })
    .then(() => {
      return dispatch(addNotification({
        level: 'info',
        message: 'La ressource a été supprimée'
      }))
    })
    .then(success)
    .catch((error) => dispatch(addNotification({
      level: 'error',
      message: `La suppression a échouée : ${error.message}`
    })))
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
export const forkAlias = (oid) => (dispatch, getState) =>
  GET(ressourceForkAliasUrl({oid}))
    .then((ressource) => dispatch(setRessource(ressource)))
    .catch((error) => {
      console.error(error)
      dispatch(addNotification({
        level: 'error',
        message: `Impossible d'éditer cette ressource : ${error.message}`
      }))
    })

/**
 * Retourne l'actionCreator qui va sauvegarder la ressource via un POST sur l'api
 * @param {Ressource} ressource
 * @return {promisedThunk} qui va faire le post puis dispatch de setRessource & addNotification
 */
export const saveRessource = (
  ressource,
  success = () => {}
) => (dispatch) => {
  return POST(ressourceUrl({format: 'full'}), {body: ressource})
    .then((responseRessource) => {
      dispatch(setRessource(responseRessource))
      return responseRessource
    })
    .then(success)
    .then(() => {
      return dispatch(addNotification({
        level: 'info',
        message: 'La ressource a été sauvegardée'
      }))
    })
    .catch((error) => dispatch(addNotification({
      level: 'error',
      message: `La sauvegarde a échouée : ${error.message}`
    })))
}

/**
 * Retourne l'actionCreator qui charge une ressource via GET sur l'api
 * @param oid
 * @return {function(*, *): Promise<any>}
 */
export const loadRessource = (oid) => (dispatch, getState) => {
  const currentRessource = getState().ressource
  if (currentRessource && currentRessource.oid === oid) return

  // On lance toujours un clear avant load pour ne pas garder l'ancienne dans le store
  // (au cas où le load plante)
  // Si le dispatch throw (à cause d'un reducer qui plante) ça remontera (sans renvoyer de promesse)
  return Promise.resolve(dispatch(clearRessource()))
    .then(() => GET(ressourceUrl({oid, format: 'full'})))
    .then((ressource) => dispatch(setRessource(ressource)))
    .catch((error) => {
      console.error(error)
      dispatch(addNotification({
        level: 'error',
        message: `Impossible de charger la ressource : ${error.message}`
      }))
    })
}
