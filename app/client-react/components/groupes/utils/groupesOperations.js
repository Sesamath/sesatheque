import {
  deleteGroupe as clear,
  ignoreGroupe as ignore,
  leaveGroupe as leave,
  joinGroupe as join,
  followGroupe as follow
} from '../../../actions/groupes'

export const deleteGroupe = nom => dispatch => {
  if (window.confirm(`La suppression d'un groupe est irréversible. Voulez-vous supprimer le groupe ${nom}?`)) {
    dispatch(clear(nom))
  }
}

export const ignoreGroupe = nom => dispatch => {
  if (window.confirm(`Ne plus suivre le groupe ${nom}?`)) {
    dispatch(ignore(nom))
  }
}

export const leaveGroupe = nom => dispatch => {
  if (window.confirm(`Quitter le groupe ${nom}?`)) {
    dispatch(leave(nom))
  }
}

export const joinGroupe = nom => dispatch => {
  if (window.confirm(`Rejoindre le groupe ${nom}?`)) {
    dispatch(join(nom))
  }
}

export const followGroupe = nom => dispatch => {
  if (window.confirm(`Suivre le groupe ${nom}?`)) {
    dispatch(follow(nom))
  }
}
