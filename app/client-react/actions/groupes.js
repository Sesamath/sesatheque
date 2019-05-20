import {GET, POST, DELETE} from '../utils/httpMethods'
import {addNotification} from './notifications'
import {
  getGroupesPersoUrl,
  getSaveGroupeUrl,
  getGroupeUrl,
  getGroupeJoinUrl,
  getGroupeFollowUrl,
  getGroupeLeaveUrl,
  getGroupeIgnoreUrl
} from '../apiRoutes'

export const loadGroupes = () => dispatch => {
  const requestSuccess = ({
    groupes,
    groupesAdmin,
    groupesMembre,
    groupesSuivis
  }) => dispatch({
    type: 'LOAD_GROUPES',
    payload: {groupes, groupesAdmin, groupesMembre, groupesSuivis}
  })
  const requestError = (error) => dispatch(
    addNotification({
      level: 'error',
      message: `Le chargement des groupes a échoué : ${error.message}`
    })
  )

  return GET(getGroupesPersoUrl())
    .then(requestSuccess, requestError)
}

const saveGroupeAction = (groupe, isNew) => ({
  type: 'SAVE_GROUPE',
  payload: {
    groupe,
    isNew
  }
})

export const saveGroupe = (groupe, success) => dispatch => {
  const requestSuccess = responseGroup => {
    dispatch(
      addNotification({
        level: 'info',
        message: 'Le groupe a été sauvegardé'
      })
    )
    const isNew = !groupe.oid
    dispatch(saveGroupeAction(responseGroup, isNew))
    return success(isNew)
  }
  const requestError = error => dispatch(
    addNotification({
      level: 'error',
      message: `La sauvegarde a échoué : ${error.message}`
    })
  )

  return POST(getSaveGroupeUrl(), {body: groupe})
    .then(requestSuccess, requestError)
}

const deleteGroupeAction = (nom) => ({
  type: 'DELETE_GROUPE',
  payload: { nom }
})

export const deleteGroupe = (nom, success = () => {}) => dispatch => {
  const requestSuccess = () => {
    dispatch(
      addNotification({
        level: 'info',
        message: `Le groupe ${nom} a été supprimé`
      })
    )
    dispatch(deleteGroupeAction(nom))
    return success()
  }
  const requestError = (error) => dispatch(
    addNotification({
      level: 'error',
      message: `La suppression du groupe a échoué : ${error.message}`
    })
  )

  return DELETE(getGroupeUrl({nom}))
    .then(requestSuccess, requestError)
}

const leaveGroupeAction = (nom) => ({
  type: 'LEAVE_GROUPE',
  payload: { nom }
})

export const leaveGroupe = (
  nom,
  success = () => {}
) => dispatch => {
  const requestSuccess = () => {
    dispatch(
      addNotification({
        level: 'info',
        message: `Vous avez quitté le groupe ${nom}`
      })
    )
    dispatch(leaveGroupeAction(nom))
    return success()
  }
  const requestError = (error) => dispatch(
    addNotification({
      level: 'error',
      message: `L'abandon du groupe a échoué : ${error.message}`
    })
  )

  return GET(getGroupeLeaveUrl({nom}))
    .then(requestSuccess, requestError)
}

const ignoreGroupeAction = (nom) => ({
  type: 'IGNORE_GROUPE',
  payload: { nom }
})

export const ignoreGroupe = (
  nom,
  success = () => {}
) => dispatch => {
  const requestSuccess = () => {
    dispatch(
      addNotification({
        level: 'info',
        message: `Vous ne suivez plus le groupe ${nom}`
      })
    )
    dispatch(ignoreGroupeAction(nom))
    return success()
  }

  const requestError = (error) => dispatch(
    addNotification({
      level: 'errodispatch(ignoreGroupeAction(nom))r',
      message: `Le désabonnement du groupe a échoué : ${error.message}`
    })
  )

  return GET(getGroupeIgnoreUrl({nom}))
    .then(requestSuccess, requestError)
}

const joinGroupeAction = groupe => ({
  type: 'JOIN_GROUPE',
  payload: { groupe }
})

export const joinGroupe = (
  nom,
  success = () => {}
) => dispatch => {
  const requestSuccess = (groupe) => {
    dispatch(
      addNotification({
        level: 'info',
        message: `Vous êtes membre du groupe ${nom}`
      })
    )
    dispatch(joinGroupeAction(groupe))
    return success()
  }
  const requestError = (error) => dispatch(
    addNotification({
      level: 'error',
      message: `L'intégration du groupe ${nom} a échoué : ${error.message}`
    })
  )

  return GET(getGroupeJoinUrl({nom}))
    .then(requestSuccess, requestError)
}

const followGroupeAction = groupe => ({
  type: 'FOLLOW_GROUPE',
  payload: { groupe }
})

export const followGroupe = (
  nom,
  success = () => {}
) => dispatch => {
  const requestSuccess = (groupe) => {
    dispatch(
      addNotification({
        level: 'info',
        message: `Vous suivez le groupe ${nom}`
      })
    )
    dispatch(followGroupeAction(groupe))
    return success()
  }
  const requestError = (error) => dispatch(
    addNotification({
      level: 'error',
      message: `L'abonnement au groupe ${nom} a échoué : ${error.message}`
    })
  )

  return GET(getGroupeFollowUrl({nom}))
    .then(requestSuccess, requestError)
}
