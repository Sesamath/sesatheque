import {deleteRessource, cloneRessource} from '../actions/ressource'

export const askDelete = (dispatch, success) => oid => {
  if (confirm('Êtes vous sûr de vouloir supprimer cette ressource ?')) {
    return dispatch(deleteRessource(oid, success))
  }
}

export const askClone = (dispatch, success) => oid => {
  if (confirm('Êtes vous sûr de vouloir dupliquer cette ressource ?')) {
    return dispatch(cloneRessource(oid, success))
  }
}
