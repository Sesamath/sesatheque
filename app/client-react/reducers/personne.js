
const personneReducer = (state = null, {type, ...payload}) => {
  switch (type) {
    case 'ADD_GROUPES':
      if (state === null) return state
      const { groupe } = payload

      return {
        ...state,
        groupesMembre: [...state.groupesMembre, groupe],
        groupesSuivis: [...state.groupesSuivis, groupe]
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
