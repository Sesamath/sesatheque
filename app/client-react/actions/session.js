import {GET} from '../utils/httpMethods'

const receiveCurrentSession = session => ({
  type: 'RECEIVE_CURRENT_SESSION',
  session
})

export const getCurrentSession = () => dispatch =>
  GET('/api/personne/current')
    .then((session) => {
      dispatch(receiveCurrentSession(session))
    })

export const addGroupe = (groupe) => dispatch =>
  GET(`/api/groupe/ajouter/${groupe}`)
    .then(({success, error}) => {
      if (success) {
        return dispatch({
          type: 'ADD_GROUPES',
          groupe
        })
      }

      throw Error(error)
    })
