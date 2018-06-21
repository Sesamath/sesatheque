const handleErrors = (response) => {
  if (!response.ok) {
    return response.json()
      .then(({error: errorMessage, success}) => {
        const error = new Error(errorMessage)
        error.status = response.status
        error.success = success

        throw error
      })
  }

  return response.json()
}

const jsonHeaders = {
  'Content-type': 'application/json'
}

const factory = (method) => {
  const defaultOptions = {
    credentials: 'include',
    method
  }

  return (url, data = {}) => {
    // on clone car modif plus loin
    const options = {...defaultOptions}

    if (data.body) {
      if (data.body instanceof FormData) {
        // on envoie un form classique, faudrait ajouter le header pour le rendre explicite
        // (mais sans header c'est comme ça que c'est interprété)
        options.body = data.body
      } else {
        // json
        options.body = JSON.stringify(data.body)
        options.headers = jsonHeaders
      }
    }

    return fetch(url, options).then(handleErrors)
  }
}

export const GET = factory('GET')
export const PATCH = factory('PATCH')
export const POST = factory('POST')
