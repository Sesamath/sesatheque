import {push} from 'connected-react-router'
import PropTypes from 'prop-types'
import queryString from 'query-string'
import React, {Component, Fragment} from 'react'
import {connect} from 'react-redux'
import ResourceForm from './ResourceForm'
import ResourceList from './ResourceList'
import resourceListProvider from '../hoc/resourceListProvider'

class ResourceSearch extends Component {
  constructor (props) {
    super(props)
    this.title = 'Recherche'
    // attention c'est une string (on pourra le passer dans les props
    // quand on voudra le fixer de l'extérieur)
    this.perPage = '25'
  }

  render ({resources, search}) {
    return (
      <Fragment>
        <h1>{this.title}</h1>
        <ResourceForm/>
        <ResourceList perPage={this.perPage} resources={resources} />
      </Fragment>
    )
  }
}

ResourceSearch.propTypes = {
  // fourni par le state global (router), la queryString qui démarre avec '?'
  search: PropTypes.string,
  // ça c'est resourceListProvider
  resources: PropTypes.array,
  total: PropTypes.number
}

// pour récupérer search d'après le router
const mapStateToProps = ({router: {location: {search}}}) => ({search})

const mapDispatchToProps = (dispatch, {parsedSearch, perPage}) => ({
  // au clic sur un changement de pagination faut mettre à jour l'url
  // (et resourceListProvider mettra à jour la liste resources)
  handlePageClick: (data) => {
    const params = {
      ...parsedSearch,
      skip: Math.ceil(data.selected * perPage)
    }

    dispatch(push({
      pathname: '/ressources',
      search: queryString.stringify(params)
    }))
  }
})

// Il faut enchaîner deux connect pour que le 1er fournisse la prop parsedSearch au 2e (son
// mapDispatchToProps en a besoin)
export default connect(mapStateToProps, {})(
  connect(null, mapDispatchToProps)(
    resourceListProvider(ResourceSearch)
  )
)
