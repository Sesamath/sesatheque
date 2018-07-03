import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {connect} from 'react-redux'
import {POST} from '../utils/httpMethods'
import queryString from 'query-string'

const mapStateToProps = ({router: {location: {search}}}) => ({query: search})

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
      this.fetchList(queryString.parse(this.props.query))
    }

    componentDidUpdate (oldProps) {
      if (oldProps.query !== this.props.query) {
        this.fetchList(queryString.parse(this.props.query))
      }
    }

    render () {
      return (
        <WrappedComponent {...this.props} resources={this.state.resources} total={this.state.total} />
      )
    }
  }

  ResourceListProvider.propTypes = {
    query: PropTypes.string,
    perPage: PropTypes.string
  }

  return connect(
    mapStateToProps,
    {}
  )(ResourceListProvider)
}

export default resourceListProvider
