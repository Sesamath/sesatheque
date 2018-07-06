import PropTypes from 'prop-types'
import React, {Component, Fragment} from 'react'
import SearchForm from './SearchForm'
import ResourceList from './ResourceList'
import resourceListProvider from '../hoc/resourceListProvider'

class ResourceSearch extends Component {
  constructor (props) {
    super(props)
    // un flag, initialement on affiche la liste si on a une query
    this.state = {
      isFormOpen: !props.query
    }
  }

  getTitle () {
    return this.state.isFormOpen ? 'Recherche' : 'Résultat de la recherche'
  }

  open () {
    this.setState({isFormOpen: true})
  }

  render () {
    const {query} = this.props
    const {isFormOpen} = this.state
    const defaultFormValues = {
      categories: [],
      niveaux: [],
      typePedagogiques: [],
      typeDocumentaires: [],
      langue: 'fra',
      publie: true,
      restriction: 0
    }
    const initialValues = {...defaultFormValues, ...query}
    return (
      <Fragment>
        <h1>{this.getTitle()}</h1>
        <SearchForm
          isOpen={isFormOpen}
          open={this.open.bind(this)}
          query={query}
          initialValues={initialValues}
        />
        {!isFormOpen && (<ResourceList {...this.props} />)}
      </Fragment>
    )
  }
}

ResourceSearch.propTypes = {
  // fourni par resourceListProvider
  query: PropTypes.object,
  queryOptions: PropTypes.shape({
    skip: PropTypes.number,
    limit: PropTypes.number
  }),
  resources: PropTypes.array,
  search: PropTypes.string,
  total: PropTypes.number
}

export default resourceListProvider(ResourceSearch)
