const ressourceReducer = (state = null, {type, ressource}) => {
  switch (type) {
    case 'SET_RESSOURCE':
      return {
        ...ressource
      }
    case 'CLEAR_RESSOURCE':
      return null
    default:
      return state
  }
}

export default ressourceReducer
