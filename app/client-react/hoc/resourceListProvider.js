import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {POST} from '../utils/httpMethods'
import {stringify} from 'query-string'

/**
 * High Order Component qui se base sur les query params pour enrichir le composant donné
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

    fetchList (query) {
      const filters = []
      Object.keys(query).map((key) => {
        if (!query[key]) return
        const values = Array.isArray(query[key]) ? query[key] : [query[key]]
        filters.push({index: key, values})
      })

      POST(`/api/liste/prof`, {body: {
        format: 'full',
        filters,
        limit: this.props.perPage,
        skip: query['skip'] || 0
      }})
        .then((resourceList) => this.setState({
          resources: Object.values(resourceList.liste),
          total: resourceList.total
        }))
        .catch(() => this.setState({resources: [], total: 0}))
    }

    componentDidMount () {
      this.fetchList(this.props.parsedSearch)
    }

    componentDidUpdate ({parsedSearch}) {
      if (stringify(parsedSearch) !== stringify(this.props.parsedSearch)) {
        this.fetchList(this.props.parsedSearch)
      }
    }

    render () {
      return (
        <WrappedComponent {...this.props} resources={this.state.resources} total={this.state.total} />
      )
    }
  }

  ResourceListProvider.propTypes = {
    parsedSearch: PropTypes.object,
    perPage: PropTypes.number
  }

  return ResourceListProvider
}

export default resourceListProvider
