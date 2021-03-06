import {push} from 'connected-react-router'
import PropTypes from 'prop-types'
import queryString from 'query-string'
import {connect} from 'react-redux'
import {NavLink} from 'react-router-dom'
import React, {Fragment} from 'react'
import SearchForm from './SearchForm'
import ResourceList from './ResourceList'
import resourceListProvider from '../hoc/resourceListProvider'

const ResourceSearch = (props) => {
  // si y'a une error dans les props (mise par resourceListProvider), on laisse ResourceList l'afficher, pas besoin de le gérer ici
  const {hash, query, allowAnyOption} = props
  const defaultFormValues = {
    categories: [],
    niveaux: [],
    typePedagogiques: [],
    typeDocumentaires: [],
    langue: ''
  }
  const initialValues = {...defaultFormValues, ...query}
  if (!query) {
    // resourceListProvider n'a pas fait d'analyse en imposant éventuellement publié et restriction
    // on l'ajoute aux valeurs initiales
    initialValues.publie = true
    initialValues.restriction = 0
  }
  // c'est le hash qui impose form / liste, ou à défaut la présence d'une query
  const isFormOpen = hash === '#form' || (hash !== '#results' && !query)
  const title = isFormOpen ? 'Recherche' : 'Résultat de la recherche'

  return (
    <Fragment>
      <h1>{title}</h1>
      <div className="alert--warning"><i className="fa fa-exclamation-circle"></i> Vous pouvez aussi essayer la recherche assistée <NavLink to="/autocomplete">depuis cette page</NavLink></div>
      <SearchForm
        isOpen={isFormOpen}
        query={query}
        initialValues={initialValues}
        allowAnyOption={allowAnyOption}
      />
      {!isFormOpen && (<ResourceList {...props} showSearchLink={true} />)}
    </Fragment>
  )
}

ResourceSearch.propTypes = {
  /** fourni par hoc resourceListProvider (construit à partir de query) */
  allowAnyOption: PropTypes.bool,
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

// pour ajouter le comportement du changement de page
const mapDispatchToProps = (dispatch, {query, queryOptions}) => ({
  // au clic sur un changement de pagination faut mettre à jour l'url
  // (et resourceListProvider mettra à jour la liste resources)
  handlePageClick: (data) => {
    const params = {
      ...query,
      skip: (Math.round(data.selected) || 0) * queryOptions.limit
    }

    dispatch(push({
      pathname: '/ressource/rechercher',
      search: queryString.stringify(params)
    }))
  }
})

export default resourceListProvider(
  connect(null, mapDispatchToProps)(ResourceSearch)
)
