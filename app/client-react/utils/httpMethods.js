/**
 * Traite les réponse 200
 * @private
 * @param {Response} response
 */
const handleResponse = (response) => {
  const {status, statusText, ok} = response // ok est ajouté par l'api fetch
  // on tente quand même le json avant de gérer les erreurs, car l'erreur peut être explicitée dans le json renvoyé
  return response.json()
    .then(result => {
      // à priori avec status > 400 on devrait aller direct dans le catch…
      if (!ok || status >= 400) {
        const error = Error(result.message || `Erreur ${status} ${statusText}`)
        error.userFriendly = true
        throw error
      }
      return result.data || result.message
    }).catch((error) => {
      if (error.userFriendly) throw error
      // l'erreur ne vient pas du then précédent, à priori un pb json,
      // mais ça peut être une erreur 500 ou une absence de réponse (que fetch traduit en 504 si la connexion est refusée)
      console.error(error)
      if (status >= 400) throw Error(`Erreur ${status} ${statusText}`)
      throw Error('La réponse n’était pas au format attendu (json)')
    })
}

// ça c'est un pb réseau ou un serveur HS, log, +bugsnag si ça concerne cette sésathèque
// (voir si on arrive à détecter une coupure réseau du client pour pas notifier dans ce cas)
const handleError = (error) => {
  console.error(error)
  // @todo ajouter appel bugsnag si c'est une url de chez nous
  throw error
}

/**
 * Prend une méthode et renvoie une fonction, qui renverra une promesse
 * @private
 * @param {string} method
 * @returns {function(url: string, options: object): Promise<Object|string | Error>}
 */
const factory = (method) => (url, options = {}) => {
  // cf https://developer.mozilla.org/en-US/docs/Web/API/Request
  // on met pas le test !['GET', 'HEAD'].includes(method), si qqun envoie un body il se prendra le throw de fetch
  const headers = {
    ...options.headers,
    'Accept': 'application/json'
  }
  const fetchOptions = {
    credentials: 'same-origin',
    ...options,
    method,
    headers
  }
  if (options.body) {
    fetchOptions.headers['Content-Type'] = 'application/json'
    if (typeof options.body !== 'object') return Promise.reject(Error('options.body doit être un object'))
    fetchOptions.body = JSON.stringify(options.body)
  }

  // y'a pas de timeout dans fetch, même si y'a pas mal de discussion autour, par ex
  // https://github.com/whatwg/fetch/issues/27

  // si on voulait ajouter une option timeout, on pourrait emballer ça dans
  // une autre promesse qui serait automatiquement rejettée au bout d'un moment
  // par ex avec
  /*
  return new Promise((resolve, reject) => {
    const start = Date.now()
    const timeoutRejection = () => {
      const waitingTime = Math.round((Date.now() - start) / 1000)
      reject(Error(`Toujours pas de réponse après ${waitingTime}s, abandon`))
    }
    setTimeout(timeoutRejection, options.timeout || 30000)
    fetch(url, fetchOptions).then(handleResponse).catch(handleError).then(resolve).catch(reject)
  })
  */

  return fetch(url, fetchOptions).then(handleResponse).catch(handleError)
}

/**
 * DELETE http method (json)
 * @param {string} url
 * @param {Object} [body] Un objet à mettre dans le body de la requête
 * @param {Object} [options] pour fetch {@link: https://developer.mozilla.org/en-US/docs/Web/API/Request}, Content-Type sera imposé à application/json
 * @type {Function}
 * @return {Promise<Object|string | Error>} à priori 'OK' ou Error
 */
export const DELETE = factory('DELETE')

/**
 * GET http method (json)
 * @param {string} url
 * @param {Object} [body] Un objet à mettre dans le body de la requête
 * @param {Object} [options] pour fetch {@link: https://developer.mozilla.org/en-US/docs/Web/API/Request}, Content-Type sera imposé à application/json
 * @type {Function}
 * @return {Promise<Object|string | Error>} Le contenu de la réponse désérialisée (ou 'OK' ou Error)
 */
export const GET = factory('GET')

/**
 * PATCH http method (json)
 * @param {string} url
 * @param {Object} [body] Un objet à mettre dans le body de la requête
 * @param {Object} [options] pour fetch {@link: https://developer.mozilla.org/en-US/docs/Web/API/Request}, Content-Type sera imposé à application/json
 * @type {Function}
 * @return {Promise<Object|string | Error>} Le contenu de la réponse désérialisée (ou 'OK' ou Error)
 */
export const PATCH = factory('PATCH')

/**
 * POST http method (json)
 * @param {string} url
 * @param {Object} [body] Un objet à mettre dans le body de la requête
 * @param {Object} [options] pour fetch {@link: https://developer.mozilla.org/en-US/docs/Web/API/Request}, Content-Type sera imposé à application/json
 * @type {Function}
 * @return {Promise<Object|string | Error>} Le contenu de la réponse désérialisée (ou 'OK' ou Error)
 */
export const POST = factory('POST')

/**
 * PUT http method (json)
 * @param {string} url
 * @param {Object} [body] Un objet à mettre dans le body de la requête
 * @param {Object} [options] pour fetch {@link: https://developer.mozilla.org/en-US/docs/Web/API/Request}, Content-Type sera imposé à application/json
 * @type {Function}
 * @return {Promise<Object|string | Error>} Le contenu de la réponse désérialisée (ou 'OK' ou Error)
 */
export const PUT = factory('PUT')
