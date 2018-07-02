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
      this.state = {resources: []}
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
        filters
      }})
        .then((resourceList) => this.setState({resources: Object.values(resourceList.liste)}))
        .catch(() => this.setState({resources: []}))
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
        <WrappedComponent {...this.props} resources={this.state.resources} />
      )
    }
  }

  return connect(
    mapStateToProps,
    {}
  )(ResourceListProvider)
}

export default resourceListProvider
