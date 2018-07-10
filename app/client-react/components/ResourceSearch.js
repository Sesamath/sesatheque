import PropTypes from 'prop-types'
import React, {Fragment} from 'react'
import SearchForm from './SearchForm'
import ResourceList from './ResourceList'
import resourceListProvider from '../hoc/resourceListProvider'

const ResourceSearch = (props) => {
  const {hash, query} = props
  const defaultFormValues = {
    categories: [],
    niveaux: [],
    typePedagogiques: [],
    typeDocumentaires: [],
    langue: '',
    publie: true,
    restriction: 0
  }
  const initialValues = {...defaultFormValues, ...query}
  // c'est le hash qui impose form / liste, ou à défaut la présence d'une query
  const isFormOpen = hash === '#form' || (hash !== '#results' && !query)
  const title = isFormOpen ? 'Recherche' : 'Résultat de la recherche'

  return (
    <Fragment>
      <h1>{title}</h1>
      <SearchForm
        isOpen={isFormOpen}
        query={query}
        initialValues={initialValues}
      />
      {!isFormOpen && (<ResourceList {...props} />)}
    </Fragment>
  )
}

ResourceSearch.propTypes = {
  /** fourni par le router (hoc resourceListProvider) */
  hash: PropTypes.string,
  /** fourni par hoc resourceListProvider (construit à partir de search) */
  query: PropTypes.object,
  /** fourni par hoc resourceListProvider (construit à partir de search) */
  queryOptions: PropTypes.shape({
    skip: PropTypes.number,
    limit: PropTypes.number
  }),
  /** fourni par hoc resourceListProvider (qui dispatch le fetch) */
  resources: PropTypes.array,
  /** La queryString fournie par le router (hoc resourceListProvider) */
  search: PropTypes.string,
  /** fourni par hoc resourceListProvider (set au retour de l'api) */
  total: PropTypes.number
}

export default resourceListProvider(ResourceSearch)
