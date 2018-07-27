import {GET, POST, DELETE} from '../utils/httpMethods'
import {addNotification} from './notifications'

export const loadGroupes = () => dispatch =>
  GET('/api/groupes/perso')
    .then(({success, error, groupes, groupesAdmin, groupesMembre, groupesSuivis}) => {
      if (success) {
        return dispatch({
          type: 'LOAD_GROUPES',
          payload: {groupes, groupesAdmin, groupesMembre, groupesSuivis}
        })
      }

      throw Error(error)
    })

const saveGroupeAction = (groupe, isNew) => ({
  type: 'SAVE_GROUPE',
  payload: {
    groupe,
    isNew
  }
})

export const saveGroupe = (groupe, success = () => {}) => dispatch =>
  POST('/api/groupe', {body: groupe})
    .then(responseGroup => {
      const isNew = !groupe.oid
      dispatch(saveGroupeAction(responseGroup, isNew))
      return isNew
    })
    .then(success)
    .then(() => dispatch(
      addNotification({
        level: 'info',
        message: 'Le groupe a été sauvegardé'
      }))
    )
    .catch(error => dispatch(
      addNotification({
        level: 'error',
        message: `La sauvegarde a échoué : ${error.message}`
      }))
    )

const deleteGroupeAction = (nom) => ({
  type: 'DELETE_GROUPE',
  payload: { nom }
})

export const deleteGroupe = (nom, success = () => {}) => dispatch =>
  DELETE(`/api/groupe/${encodeURIComponent(nom)}`)
    .then(() => {
      dispatch(deleteGroupeAction(nom))
    })
    .then(success)
    .then(() => dispatch(
      addNotification({
        level: 'info',
        message: `Le groupe ${nom} a été supprimé`
      }))
    )
    .catch((error) => dispatch(
      addNotification({
        level: 'error',
        message: `La suppression du groupe a échoué : ${error.message}`
      }))
    )

const leaveGroupeAction = (nom) => ({
  type: 'LEAVE_GROUPE',
  payload: { nom }
})

export const leaveGroupe = (nom, success = () => {}) => dispatch =>
  GET(`/api/groupe/quitter/${encodeURIComponent(nom)}`)
    .then(() => {
      dispatch(leaveGroupeAction(nom))
    })
    .then(success)
    .then(() => dispatch(
      addNotification({
        level: 'info',
        message: `Vous avez quitté le groupe ${nom}`
      }))
    )
    .catch((error) => dispatch(
      addNotification({
        level: 'error',
        message: `L'abandon du groupe a échoué : ${error.message}`
      }))
    )

const ignoreGroupeAction = (nom) => ({
  type: 'IGNORE_GROUPE',
  payload: { nom }
})

export const ignoreGroupe = (nom, success = () => {}) => dispatch =>
  GET(`/api/groupe/ignorer/${encodeURIComponent(nom)}`)
    .then(() => {
      dispatch(ignoreGroupeAction(nom))
    })
    .then(success)
    .then(() => dispatch(
      addNotification({
        level: 'info',
        message: `Vous ne suivez plus le groupe ${nom}`
      }))
    )
    .catch((error) => dispatch(
      addNotification({
        level: 'error',
        message: `Le désabonnement du groupe a échoué : ${error.message}`
      }))
    )

const joinGroupeAction = groupe => ({
  type: 'JOIN_GROUPE',
  payload: { groupe }
})

export const joinGroupe = (nom, success = () => {}) => dispatch =>
  GET(`/api/groupe/rejoindre/${encodeURIComponent(nom)}`)
    .then(groupe => {
      dispatch(joinGroupeAction(groupe))
    })
    .then(success)
    .then(() => dispatch(
      addNotification({
        level: 'info',
        message: `Vous êtes membre du groupe ${nom}`
      }))
    )
    .catch((error) => dispatch(
      addNotification({
        level: 'error',
        message: `L'intégration du groupe ${nom} a échoué : ${error.message}`
      }))
    )

const followGroupeAction = groupe => ({
  type: 'FOLLOW_GROUPE',
  payload: { groupe }
})

export const followGroupe = (nom, success = () => {}) => dispatch =>
  GET(`/api/groupe/suivre/${encodeURIComponent(nom)}`)
    .then(groupe => {
      dispatch(followGroupeAction(groupe))
    })
    .then(success)
    .then(() => dispatch(
      addNotification({
        level: 'info',
        message: `Vous suivez le groupe ${nom}`
      }))
    )
    .catch((error) => dispatch(
      addNotification({
        level: 'error',
        message: `L'abonnement au groupe ${nom} a échoué : ${error.message}`
      }))
    )
