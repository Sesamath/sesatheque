const groupesReducer = (state = null, {type, payload}) => {
  switch (type) {
    case 'LOAD_GROUPES':
      // c'est l'init du state "groupes" géré ici
      return payload.groupes

    case 'DELETE_GROUPE': {
      if (state === null) return state
      const {nom} = payload

      return {
        ...state,
        [nom]: undefined
      }
    }

    case 'SAVE_GROUPE':
    case 'JOIN_GROUPE':
    case 'FOLLOW_GROUPE': {
      if (state === null) return state

      const {groupe} = payload
      const {nom} = groupe

      return {
        ...state,
        [nom]: groupe
      }
    }

    default:
      return state
  }
}

export default groupesReducer
