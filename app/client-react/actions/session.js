import {GET} from '../utils/httpMethods'
import {getCurrentPersonneUrl} from '../apiRoutes'
import {addNotification} from './notifications'

const receiveCurrentSession = session => ({
  type: 'RECEIVE_CURRENT_SESSION',
  payload: {session}
})

export const getCurrentSession = () => dispatch => {
  const requestSuccess = (session) => {
    dispatch(receiveCurrentSession(session))
  }
  const requestError = (error) => dispatch(addNotification({
    level: 'error',
    message: `La récupération de la session a échoué : ${error.message}`
  }))

  return GET(getCurrentPersonneUrl())
    .then(requestSuccess, requestError)
}
