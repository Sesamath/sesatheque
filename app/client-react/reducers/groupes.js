const nameFilter = (removeMe) => (nom) => (nom !== removeMe)

const groupesReducer = (state = null, {type, payload}) => {
  switch (type) {
    case 'LOAD_GROUPES': {
      const {groupes} = payload
      return groupes
    }
    case 'ADD_GROUPE': {
      if (state === null) { return state }

      const {groupe, isNew} = payload
      const {nom} = groupe
      const {groupes, groupesAdmin, groupesMembre, groupesSuivis} = state
      if (isNew) {
        return {
          groupes: {
            ...groupes,
            [nom]: groupe
          },
          groupesAdmin: [...groupesAdmin, nom],
          groupesMembre: [...groupesMembre, nom],
          groupesSuivis: [...groupesSuivis, nom]
        }
      } else {
        return {
          groupes: {
            ...groupes,
            [nom]: groupe
          },
          groupesAdmin,
          groupesMembre,
          groupesSuivis
        }
      }
    }
    case 'DELETE_GROUPE': {
      if (state === null) { return state }
      const {nom} = payload
      const {groupes, groupesAdmin, groupesMembre, groupesSuivis} = state
      const filter = nameFilter(nom)
      return {
        groupes: {
          ...groupes,
          [nom]: undefined
        },
        groupesAdmin: groupesAdmin.filter(filter),
        groupesMembre: groupesMembre.filter(filter),
        groupesSuivis: groupesSuivis.filter(filter)
      }
    }
    case 'LEAVE_GROUPE': {
      if (state === null) { return state }

      const {nom} = payload
      const {groupes, groupesAdmin, groupesMembre, groupesSuivis} = state
      const filter = nameFilter(nom)
      return {
        groupes,
        groupesAdmin,
        groupesMembre: groupesMembre.filter(filter),
        groupesSuivis
      }
    }
    case 'IGNORE_GROUPE': {
      if (state === null) { return state }

      const {nom} = payload
      const {groupes, groupesAdmin, groupesMembre, groupesSuivis} = state
      const filter = nameFilter(nom)
      return {
        groupes,
        groupesAdmin,
        groupesMembre,
        groupesSuivis: groupesSuivis.filter(filter)
      }
    }
    case 'JOIN_GROUPE': {
      if (state === null) { return state }

      const {groupe} = payload
      const {nom} = groupe
      const {groupes, groupesAdmin, groupesMembre, groupesSuivis} = state

      return {
        groupes: {
          ...groupes,
          [nom]: groupe
        },
        groupesAdmin,
        groupesMembre: [...groupesMembre, nom],
        groupesSuivis
      }
    }
    case 'FOLLOW_GROUPE': {
      if (state === null) { return state }

      const {groupe} = payload
      const {nom} = groupe
      const {groupes, groupesAdmin, groupesMembre, groupesSuivis} = state

      return {
        groupes: {
          ...groupes,
          [nom]: groupe
        },
        groupesAdmin,
        groupesMembre,
        groupesSuivis: [...groupesSuivis, nom]
      }
    }
    default:
      return state
  }
}

export default groupesReducer
