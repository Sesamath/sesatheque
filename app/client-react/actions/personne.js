import {GET} from '../utils/httpMethods'

const receiveCurrentUser = personne => ({
  type: 'RECEIVE_CURRENT_USER',
  personne
})

export const getCurrentUser = () => dispatch =>
  GET('/api/personne/current')
    .then((user) => {
      dispatch(receiveCurrentUser(user))
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
