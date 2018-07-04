import {push} from 'connected-react-router'
import PropTypes from 'prop-types'
import queryString from 'query-string'
import React, {Component} from 'react'
import {connect} from 'react-redux'
import {POST} from '../utils/httpMethods'

const limitDefault = 25
const limitMin = 5
const limitMax = 100

/**
 * High Order Component qui se base sur les query params pour enrichir le composant donné
 * en ajoutant les props resources et total
 * @param {Component} WrappedComponent
 * @return {Component} Le composant enrichi
 */
const resourceListProvider = (WrappedComponent) => {
  class ResourceListProvider extends Component {
    constructor (props) {
      super(props)
      this.state = {
        resources: [],
        total: 0
      }
    }

    fetchList () {
      const {query} = this.props
      // sans query on fait rien
      if (!query) {
        this.flushState()
        return
      }

      POST(`/api/liste/prof`, {body: {
        format: 'full',
        filters: query.filters,
        limit: query.limit,
        skip: query.skip
      }})
        .then((resourceList) => this.setState({
          resources: Object.values(resourceList.liste),
          total: resourceList.total
        }))
        .catch((error) => {
          // @todo notify
          console.error(error)
          this.flushState()
        })
    }

    flushState () {
      this.setState({resources: [], total: 0})
    }

    componentDidMount () {
      this.fetchList(this.props.query)
    }

    componentDidUpdate ({search}) {
      if (search !== this.props.search) {
        this.fetchList(this.props.query)
      }
    }

    render () {
      return (
        <WrappedComponent {...this.props} resources={this.state.resources} total={this.state.total} />
      )
    }
  }

  ResourceListProvider.propTypes = {
    query: PropTypes.object,
    search: PropTypes.string
  }

  // pour récupérer search d'après le router et construire la query
  const mapStateToProps = ({router: {location: {search}}}) => {
    if (!search) return {search: '', query: null}
    // on normalise query, en garantissant skip, limit et filters
    // faut vérifier la cohérence limit/skip, les caster en number, leur affecter des valeurs
    // par défaut et ajuster skip si besoin
    // (sinon la pagination fait des trucs bizarre si "ça tombe pas juste"
    // i.e. on skip pas un multiple de perPage)
    const parsedSearch = queryString.parse(search)
    const query = {
      limit: Math.round(parsedSearch.limit) || limitDefault,
      skip: Math.round(parsedSearch.skip) || 0,
      filters: []
    }

    // normalize limit
    if (query.limit < limitMin) query.limit = limitMin
    else if (query.limit > limitMax) query.limit = limitMax

    // normalize skip, doit être un multiple de limit, on rabote si besoin
    const offsetPage = query.skip % query.limit
    if (offsetPage) query.skip -= offsetPage
    if (query.skip < 0) query.skip = 0

    // normalize filters
    const isValidFilter = (filter) => (typeof filter === 'object' && typeof filter.key === 'string' && Array.isArray(filter.values) && filter.values.length)
    query.filters = (Array.isArray(parsedSearch.filters) ? parsedSearch.filters : []).filter(isValidFilter)

    // màj search pour (c'est la sérialisation de query utilisée pour savoir
    // s'il faut mettre à jour les résultats)
    search = queryString.stringify(query)

    return {search, query}
  }

  const mapDispatchToProps = (dispatch, {query}) => ({
    // au clic sur un changement de pagination faut mettre à jour l'url
    // (et resourceListProvider mettra à jour la liste resources)
    handlePageClick: (data) => {
      const params = {
        ...query,
        skip: (Math.round(data.selected) || 0) * query.limit
      }

      dispatch(push({
        pathname: '/ressource/rechercher',
        search: queryString.stringify(params)
      }))
    }
  })

  // Il faut enchaîner deux connect pour que le 1er fournisse la prop query au 2e
  return connect(mapStateToProps, {})(
    connect(null, mapDispatchToProps)(ResourceListProvider)
  )
}

export default resourceListProvider
