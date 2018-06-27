
const personneReducer = (state = null, {type, ...payload}) => {
  switch (type) {
    case 'ADD_GROUPES':
      if (state === null || state.user === undefined) return state
      const {groupe} = payload
      const {user} = state

      return {
        ...state,
        user: {
          ...user,
          groupesMembre: [...user.groupesMembre, groupe],
          groupesSuivis: [...user.groupesSuivis, groupe]
        }
      }
    case 'RECEIVE_CURRENT_USER':
      return payload.personne
    case 'CLEAR_USER':
      return null
    default:
      return state
  }
}

export default personneReducer
