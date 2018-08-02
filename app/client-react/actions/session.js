import {GET} from '../utils/httpMethods'
import {currentPersonneUrl} from '../apiRoutes'

const receiveCurrentSession = session => ({
  type: 'RECEIVE_CURRENT_SESSION',
  payload: {session}
})

export const getCurrentSession = () => dispatch =>
  GET(currentPersonneUrl())
    .then((session) => {
      dispatch(receiveCurrentSession(session))
    })
