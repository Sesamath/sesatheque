/**
 * notificationsReducer (qui gère la prop notifications du state global)
 * @param {object[]} [state=[]] la prop notifications du state global
 * @param {object} action
 * @param {string} action.type
 * @param {number} action.id
 * @param {string} action.message
 * @param {string} action.level
 * @param {number} action.to
 * @return {object[]} Le nouveau state
 */
const notificationsReducer = (state = [], {type, id, message, level, to}) => {
  switch (type) {
    case 'ADD_NOTIFICATION':
      return [
        // on met la nouvelle notification en premier, pour l'afficher en haut de la page
        {type, id, message, level, to},
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

export default notificationsReducer
