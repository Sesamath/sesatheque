import {GET, POST} from '../utils/httpMethods'
import {addNotification} from './notifications'

const setRessource = (ressource) => ({
  type: 'SET_RESSOURCE',
  ressource
})

const clearRessource = () => ({
  type: 'CLEAR_RESSOURCE'
})

export const saveRessource = (body) => (dispatch) => {
  return POST(`/api/ressource`, {body})
    .then(() => {
      return dispatch(setRessource(body))
    })
    .then(() => {
      return dispatch(addNotification({
        level: 'info',
        message: 'La ressource a été sauvegardée'
      }))
    })
    .catch(saveError => {
      return dispatch(addNotification({
        level: 'error',
        message: `La sauvegarde a échouée: ${saveError.message}`
      }))
    })
}

export const loadRessource = (oid) => (dispatch, getState) => {
  const currentRessource = getState().ressource
  if (currentRessource && currentRessource.oid === oid) return;

  dispatch(clearRessource())

  return GET(`/api/ressource/${oid}`)
    .then((ressource) =>
      dispatch(setRessource(ressource)))
}
