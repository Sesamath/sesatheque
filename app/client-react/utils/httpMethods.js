const handleErrors = (response) => {
  if (!response.ok) {
    return response.json()
      .then(({error: message, success}) => {
        const error = Error(message)
        error.status = response.status
        error.success = success

        throw error
      })
  }

  return response.json()
}

const headers = {
  'Content-type': 'application/json',
}

const factory = (method) => {
  const defaultOptions = {
    credentials: 'include',
    method,
  }

  return (url, data = {}) => {
    const options = {
      ...defaultOptions,
    }

    if (data.body) {
      if (data.body instanceof FormData) {
        options.body = data.body
      } else {
        options.body = JSON.stringify(data.body)
        options.headers = headers
      }
    }

    return fetch(url, options).then(handleErrors)
  }
}

export const GET = factory('GET')
export const PATCH = factory('PATCH')
export const POST = factory('POST')
