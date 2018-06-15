const notificationReducer = (state = [], {type, id, message, level, to}) => {
  switch (type) {
    case 'ADD_NOTIFICATION':
      return [
        {
          message,
          level,
          id,
          to
        },
        ...state
      ]
    case 'REMOVE_NOTIFICATION':
      return state.filter(({id: itemId, to}) => {
        if (itemId === id) {
          if (to !== null) clearTimeout(to)

          return false
        }

        return true
      })
    default:
      return state
  }
}

export default notificationReducer
