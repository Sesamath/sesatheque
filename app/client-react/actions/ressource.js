import {DELETE, GET, POST} from '../utils/httpMethods'
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
 * Retourne l'actionCreator qui supprime la ressource
 * @param {string} oid
 * @returns {promisedThunk} qui supprime puis dispatch clearRessource & redirect
 */
export const cloneRessource = (oid, history) => (dispatch) => {
  let clonedOid
  // ça c'est une anomalie du controleur, ça devrait être /ressource/clone/:oid, vu que les routes risquent de changer on laisse
  return GET(`/api/clone/${oid}`)
    .then(({oid}) => {
      if (!oid) throw Error('La réponse n’est pas au format attendu')
      clonedOid = oid
      return dispatch(clearRessource())
    })
    .then(() => {
      return dispatch(addNotification({
        level: 'info',
        message: 'La ressource a été dupliquée'
      }))
    })
    .then(() => {
      history.push(`/ressource/modifier/${clonedOid}`)
      // si on était sur une page d'édition, il faut lancer cette action pour modifier le state,
      // sinon le changement d'url ne provoque pas le rechargement
      // si on clone depuis une page de description ce return provoque un appel en double de l'api pour charger la ressource
      // FIXME coté ResourceForm
      return dispatch(loadRessource(clonedOid))
    })
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
export const deleteRessource = (oid, history) => (dispatch) => {
  return DELETE(`/api/ressource/${oid}`)
    .then(() => {
      return dispatch(clearRessource())
    })
    .then(() => {
      return dispatch(addNotification({
        level: 'info',
        message: 'La ressource a été supprimée (redirection dans 1s)'
      }))
    })
    .then(() => {
      // @todo virer cette attente pour remplacer par du history.push dès que la home est gérée par react
      setTimeout(() => { window.location = '/' }, 1000)
      // history.push('/')
    })
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
