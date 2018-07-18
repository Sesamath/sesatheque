import {GET} from '../utils/httpMethods'

const receiveCurrentSession = session => ({
  type: 'RECEIVE_CURRENT_SESSION',
  payload: {session}
})

export const getCurrentSession = () => dispatch =>
  GET('/api/personne/current')
    .then((session) => {
      dispatch(receiveCurrentSession(session))
    })
