
const groupesReducer = (state = null, {type, groupes}) => {
  switch (type) {
    case 'LOAD_GROUPES':
      return groupes
    default:
      return state
  }
}

export default groupesReducer
