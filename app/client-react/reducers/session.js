
const sessionReducer = (state = null, {type, ...payload}) => {
  switch (type) {
    case 'ADD_GROUPES':
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
    case 'RECEIVE_CURRENT_SESSION':
      return payload.session
    case 'CLEAR_SESSION':
      return null
    default:
      return state
  }
}

export default sessionReducer
