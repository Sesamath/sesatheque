let counter = 0

const displayDuration = 10000
const additionalDisplayDuration = 2000

/**
 * @typedef ActionAddNotification
 * @type Object
 * @property {string} type vaut toujours 'ADD_NOTIFICATION'
 * @property {string} message
 * @property {string} level
 * @property {number} id
 * @property {number} to id du timer removeNotification (si level === error) ou null
 */

/**
 * Retourne l'actionCreator pour ADD_NOTIFICATION
 * @param {object} notification
 * @param {string} notification.message
 * @param {string} notification.level
 * @return {Function} actionCreator qui fera le dispatch de l'action {@link ActionAddNotification}
 */
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

/**
 * Retourne l'action REMOVE_NOTIFICATION
 * @param {number} id
 * @return {{type: string, id: number}}
 */
export const removeNotification = (id) => ({
  type: 'REMOVE_NOTIFICATION',
  id
})
