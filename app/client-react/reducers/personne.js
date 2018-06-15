
const personneReducer = (state = null, {type, ...payload}) => {
  switch (type) {
    case 'ADD_GROUPES':
      return {
        ...payload.groupes
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
