import PropTypes from 'prop-types'
import queryString from 'query-string'
import React, {Component} from 'react'
import {connect} from 'react-redux'
import {POST} from '../utils/httpMethods'
import {listes} from '../../server/ressource/config'

const limitDefault = 25
const limitMin = 5
const limitMax = 100

const emptyState = {
  resources: [],
  total: 0
}

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
      this.state = emptyState
    }

    fetchList () {
      const {query, queryOptions: {limit, skip}} = this.props
      // sans query on fait rien
      if (!query) {
        this.this.setState(emptyState)
        return
      }
      const filters = Object.keys(query).map(key => {
        const value = query[key]
        const values = Array.isArray(value) ? value : [value]
        return {index: key, values}
      })

      POST(`/api/liste/prof`, {body: {
        format: 'full',
        filters,
        limit,
        skip
      }})
        .then((resourceList) => this.setState({
          resources: Object.values(resourceList.liste),
          total: resourceList.total
        }))
        .catch((error) => {
          // @todo notify
          console.error(error)
          this.setState(emptyState)
        })
    }

    componentDidMount () {
      if (this.props.search) this.fetchList(this.props.query)
    }

    componentDidUpdate ({search}) {
      if (search !== this.props.search) {
        this.fetchList()
      }
    }

    render () {
      return (
        <WrappedComponent {...this.props} resources={this.state.resources} total={this.state.total} />
      )
    }
  }

  ResourceListProvider.propTypes = {
    // fourni par le connect mapStateToProps (ça vient du router)
    search: PropTypes.string,
    // construit à partir du précédent
    query: PropTypes.object,
    queryOptions: PropTypes.shape({
      skip: PropTypes.number,
      limit: PropTypes.number
    })
  }

  const buildQuery = (parsedSearch) => {
    if (!parsedSearch) {
      return {
        lanque: 'fra',
        publie: true,
        restriction: 0
      }
    }
    // on normalise query, en ne conservant que les entrées utiles
    // avec cast en int pour les index numériques et affectation des valeurs par défaut
    const query = {}
    // checkbox
    query.publie = ['true', '', undefined].includes(parsedSearch.publie)
    // valeurs uniques (select ou input)
    // langue fra par défaut (si pas de valeur connue fournie)
    query.langue = listes.langue[parsedSearch.langue] ? parsedSearch.langue : 'fra'
    // restriction en int, 0 par défaut
    query.restriction = listes.restriction[parsedSearch.restriction] ? Number(parsedSearch.restriction) : 0
    // pour les autres on récupère tel quel si c'est pas une string vide
    ;['titre', 'type', 'oid', 'origine', 'idOrigine', 'auteurs'].forEach(prop => {
      if (parsedSearch[prop]) query[prop] = parsedSearch[prop]
    })
    // multiselect
    ;['categories', 'niveaux', 'typePedagogiques', 'typeDocumentaires'].forEach(prop => {
      const value = parsedSearch[prop]
      if (!value) return
      // on veut un array…
      if (Array.isArray(value)) {
        const values = value.filter(v => v !== '')
        if (values.length) query[prop] = values
      } else {
        query[prop] = [value]
      }
      // … d'entiers (sauf pour niveaux), car ça vient de la queryString donc toutes les valeurs sont des strings
      if (prop === 'niveaux') {
        // on filtre sur les valeurs connues
        const niveaux = value.filter(value => listes.niveaux[value])
        if (niveaux.length) query.niveaux = niveaux
        else delete query.niveaux
      } else {
        // cast integer
        const values = query[prop]
          .filter(value => listes[prop][value])
          .map(value => parseInt(value, 10))
        if (values.length) query[prop] = values
        else delete query[prop]
      }
    })

    return query
  }

  const buildQueryOptions = (parsedSearch) => {
    if (!parsedSearch) return {skip: 0, limit: limitDefault}
    // on normalise skip et limit
    const queryOptions = {
      limit: Math.round(parsedSearch.limit) || limitDefault,
      skip: Math.round(parsedSearch.skip) || 0
    }
    // faut vérifier la cohérence limit/skip, les caster en number, leur affecter des valeurs
    // par défaut et ajuster skip si besoin
    // (sinon la pagination fait des trucs bizarre si "ça tombe pas juste" avec skip qui serait pas un multiple de perPage)
    if (queryOptions.limit < limitMin) queryOptions.limit = limitMin
    else if (queryOptions.limit > limitMax) queryOptions.limit = limitMax

    // normalize skip, doit être un multiple de limit, on rabote si besoin
    const offsetPage = queryOptions.skip % queryOptions.limit
    if (offsetPage) queryOptions.skip -= offsetPage
    if (queryOptions.skip < 0) queryOptions.skip = 0

    return queryOptions
  }

  // pour récupérer search d'après le router et construire query et queryOptions
  const mapStateToProps = ({router: {location: {search}}}) => {
    /**
     * Transforme une queryString en objet query (pour le form)
     * @param {string} queryString
     */
    if (!search) return {search: '', query: null}
    const parsedSearch = queryString.parse(search)
    const query = buildQuery(parsedSearch)
    const queryOptions = buildQueryOptions(parsedSearch)
    // màj search pour (c'est la sérialisation de query utilisée pour savoir
    // s'il faut mettre à jour les résultats)
    search = queryString.stringify({...query, ...queryOptions})

    return {query, queryOptions, search}
  }

  return connect(mapStateToProps, {})(ResourceListProvider)
}

export default resourceListProvider
