const filterGroups = removeMe => nom => (nom !== removeMe)

const sessionReducer = (state = null, {type, payload}) => {
  switch (type) {
    case 'LOAD_GROUPES': {
      if (state === null || state.personne === undefined) return state
      const {groupesAdmin, groupesMembre, groupesSuivis} = payload
      const {personne} = state
      return {
        ...state,
        personne: {
          ...personne,
          groupesAdmin,
          groupesMembre,
          groupesSuivis
        }
      }
    }

    case 'IGNORE_GROUPE': {
      if (state === null || state.personne === undefined) return state
      const {nom} = payload
      const {personne} = state

      return {
        ...state,
        personne: {
          ...personne,
          groupesSuivis: personne.groupesSuivis.filter(filterGroups(nom))
        }
      }
    }
    case 'LEAVE_GROUPE': {
      if (state === null || state.personne === undefined) return state
      const {nom} = payload
      const {personne} = state

      return {
        ...state,
        personne: {
          ...personne,
          groupesMembre: personne.groupesMembre.filter(filterGroups(nom))
        }
      }
    }
    case 'SAVE_GROUPE': {
      if (state === null || state.personne === undefined) return state
      const {groupe, isNew} = payload
      const {nom} = groupe
      const {personne} = state
      if (isNew) {
        return {
          ...state,
          personne: {
            ...personne,
            groupesAdmin: [...personne.groupesAdmin, nom],
            groupesMembre: [...personne.groupesMembre, nom],
            groupesSuivis: [...personne.groupesSuivis, nom]
          }
        }
      }

      return state
    }
    case 'FOLLOW_GROUPE': {
      if (state === null || state.personne === undefined) return state
      const {groupe} = payload
      const {nom} = groupe
      const {personne} = state

      return {
        ...state,
        personne: {
          ...personne,
          groupesSuivis: [...personne.groupesSuivis, nom]
        }
      }
    }
    case 'JOIN_GROUPE': {
      if (state === null || state.personne === undefined) return state
      const {groupe} = payload
      const {nom} = groupe
      const {personne} = state

      return {
        ...state,
        personne: {
          ...personne,
          groupesMembre: [...personne.groupesMembre, nom]
        }
      }
    }
    case 'DELETE_GROUPE': {
      if (state === null) { return state }
      const {nom} = payload
      const {personne} = state
      const filter = filterGroups(nom)

      return {
        ...state,
        personne: {
          ...personne,
          groupesAdmin: personne.groupesAdmin.filter(filter),
          groupesMembre: personne.groupesMembre.filter(filter),
          groupesSuivis: personne.groupesSuivis.filter(filter)
        }
      }
    }
    case 'RECEIVE_CURRENT_SESSION':
      return payload.session
    case 'CLEAR_SESSION':
      return null
    default:
      return state
  }
}

export default sessionReducer
