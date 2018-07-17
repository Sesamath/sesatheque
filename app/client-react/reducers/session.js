const nameFilter = (removeMe) => (nom) => (nom !== removeMe)

const sessionReducer = (state = null, {type, payload}) => {
  switch (type) {
    case 'IGNORE_GROUPE': {
      if (state === null || state.personne === undefined) return state
      const {nom} = payload
      const {personne} = state
      const filter = nameFilter(nom)

      return {
        ...state,
        personne: {
          ...personne,
          groupesSuivis: personne.groupesSuivis.filter(filter)
        }
      }
    }
    case 'LEAVE_GROUPE': {
      if (state === null || state.personne === undefined) return state
      const {nom} = payload
      const {personne} = state
      const filter = nameFilter(nom)

      return {
        ...state,
        personne: {
          ...personne,
          groupesMembre: personne.groupesMembre.filter(filter)
        }
      }
    }
    case 'ADD_GROUPE': {
      if (state === null || state.personne === undefined) return state
      const {groupe, isNew} = payload
      const {nom} = groupe
      const {personne} = state
      if (isNew) {
        return {
          ...state,
          personne: {
            ...personne,
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
    case 'ADD_GROUPES': {
      if (state === null || state.personne === undefined) return state
      const {groupe} = payload
      const {personne} = state

      return {
        ...state,
        personne: {
          ...personne,
          groupesMembre: [...personne.groupesMembre, groupe],
          groupesSuivis: [...personne.groupesSuivis, groupe]
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
