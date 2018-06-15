let counter = 0

const displayDuration = 10000
const additionalDisplayDuration = 2000

export const addNotification = ({message, level}) => (dispatch, getState) => {
  const length = getState().notifications.length
  const id = counter++
  dispatch({
    type: 'ADD_NOTIFICATION',
    message,
    level,
    id,
    to: (level !== 'error') ? setTimeout(() => dispatch(removeNotification(id)), displayDuration + additionalDisplayDuration * length) : null
  })
}

export const removeNotification = (id) => ({
  type: 'REMOVE_NOTIFICATION',
  id
})
