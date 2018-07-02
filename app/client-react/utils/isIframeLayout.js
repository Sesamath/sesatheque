import {parse} from 'query-string'

const isIframeLayout = ((search) => {
  const parsedQuery = parse(search)
  if (parsedQuery.layout === 'iframe') return true

  return false
})(document.location.search)

export default isIframeLayout
