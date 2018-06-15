import {GET} from '../utils/httpMethods'

const receiveCurrentUser = personne => ({
  type: 'RECEIVE_CURRENT_USER',
  personne
})

export const getCurrentUser = () => dispatch => {
  GET(`/api/personne/me`)
    .then((user) => {
      dispatch(receiveCurrentUser(user))
    })
}

export const addGroupes = (groupesNames) => dispatch => {
  GET(`/api/groupe/ajouter/${groupesNames}`)
    .then((groupes) => {
      dispatch({
        type: 'ADD_GROUPES',
        groupes
      })
    })
}
