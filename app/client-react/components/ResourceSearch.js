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
    this.title = this.isFormOpen ? 'Recherche' : 'Résultat de la recherche'
  }

  open () {
    this.setState({isFormOpen: true})
  }

  render () {
    const {query} = this.props
    const {isFormOpen} = this.state
    return (
      <Fragment>
        <h1>{this.title}</h1>
        <SearchForm isOpen={isFormOpen} open={this.open.bind(this)} query={query} />
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
