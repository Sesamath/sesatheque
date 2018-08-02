import PropTypes from 'prop-types'
import queryString from 'query-string'
import {Component} from 'react'
import {connect} from 'react-redux'
import addNotifyToProps from '../hoc/addNotifyToProps'

const mapStateToProps = ({router: {location: {search}}}) => ({search})

class QueryError extends Component {
  componentDidMount () {
    const {error} = queryString.parse(this.props.search)
    if (error !== undefined) {
      this.props.notify({
        level: 'error',
        message: error
      })
    }
  }

  render () {
    return null
  }
}

QueryError.propTypes = {
  notify: PropTypes.func,
  search: PropTypes.string
}

export default addNotifyToProps(
  connect(mapStateToProps, {})(
    QueryError
  )
)
