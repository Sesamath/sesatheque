import {GET, POST} from '../utils/httpMethods'
import {addNotification} from './notifications'

/**
 * Retourne l'action de type SET_RESSOURCE pour affecter une ressource dans le store
 * @param ressource
 * @return {{type: string, ressource: Ressource}}
 */
const setRessource = (ressource) => ({
  type: 'SET_RESSOURCE',
  ressource
})

/**
 * Retourne l'action de type CLEAR_RESSOURCE pour retirer la ressource du store
 * @return {{type: string}}
 */
const clearRessource = () => ({
  type: 'CLEAR_RESSOURCE'
})

/**
 * @callback promisedThunk
 * @param dispatch
 * @param getState
 * @return {Promise}
 */

/**
 * Retourne l'actionCreator qui va forker la ressource via un GET sur l'api
 * @param oid
 * @return {function(*, *): Promise<any>}
 */
export const forkRessource = (oid) => (dispatch, getState) => {
  return Promise.resolve(dispatch(clearRessource()))
    .then(() => GET(`/api/ressources/${oid}/fork`))
    .then((ressource) => dispatch(setRessource(ressource)))
    .catch((error) => {
      console.error(error)
      dispatch(addNotification({
        level: 'error',
        message: `Impossible de forker la ressource : ${error.message}`
      }))
    })
}

/**
 * Retourne l'actionCreator qui va sauvegarder la ressource via un POST sur l'api
 * @param {Ressource} ressource
 * @return {promisedThunk} qui va faire le post puis dispatch de setRessource & addNotification
 */
export const saveRessource = (ressource) => (dispatch) => {
  return POST(`/api/ressource`, {body: ressource})
    .then(() => {
      return dispatch(setRessource(ressource))
    })
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
    .then(() => GET(`/api/ressource/${oid}?format=full`))
    .then((ressource) => dispatch(setRessource(ressource)))
    .catch((error) => {
      console.error(error)
      dispatch(addNotification({
        level: 'error',
        message: `Impossible de charger la ressource : ${error.message}`
      }))
    })
}
