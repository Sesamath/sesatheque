import {GET} from '../utils/httpMethods'

export const loadGroupes = () => dispatch =>
  GET('/api/groupe/perso')
    .then(({success, error, ...groupes}) => {
      if (success) {
        return dispatch({
          type: 'LOAD_GROUPES',
          groupes
        })
      }

      throw Error(error)
    })

export const addGroupe = () => dispatch =>
  GET('/api/groupe/perso')
    .then(({success, error, ...groupes}) => {
      if (success) {
        return dispatch({
          type: 'ADD_GROUPE',
          groupes
        })
      }

      throw Error(error)
    })
