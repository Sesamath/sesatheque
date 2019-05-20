/**
 * Retourne une erreur avec une propriété userFriendly à true
 * @param {string} message
 * @param {Object} options Des propriétés supplémentaires à ajouter à l'erreur
 * @return {Error}
 */
function userError (message, options) {
  if (!message || typeof message !== 'string') throw Error('message d’erreur invalide')
  const error = Error(message)
  error.userFriendly = true
  if (options && Object.keys(options).length) {
    Object.assign(error, options)
  }
  return error
}

module.exports = {
  userError
}
