import {GET} from '../utils/httpMethods'
import {getCurrentPersonneUrl} from '../apiRoutes'

const receiveCurrentSession = session => ({
  type: 'RECEIVE_CURRENT_SESSION',
  payload: {session}
})

export const getCurrentSession = () => dispatch =>
  GET(getCurrentPersonneUrl())
    .then((session) => {
      dispatch(receiveCurrentSession(session))
    })
