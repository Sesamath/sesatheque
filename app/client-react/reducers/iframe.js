import {parse} from 'query-string'

const isNotIframeLayout = ((search) => {
  const parsedQuery = parse(search)
  if (parsedQuery.layout === 'iframe') return true

  return false
})(document.location.search)

const iframeReducer = (state = isNotIframeLayout) => state

export default iframeReducer
