import PropTypes from 'prop-types'
import queryString from 'query-string'
import {Component} from 'react'
import {connect} from 'react-redux'
import {getCurrentSession} from '../actions/session'
// cf webpackConfigLoader.js pour les valeurs exportées à un browser
import {baseId, baseUrl, sesatheques} from '../../server/config'
import {addSesatheque} from 'sesatheque-client/src/sesatheques'
import addNotifyToProps from '../hoc/addNotifyToProps'

class InitApp extends Component {
  componentDidMount () {
    // On notifie si la query contient une erreur
    const {error} = queryString.parse(this.props.search)
    if (error !== undefined) {
      this.props.notify({
        level: 'error',
        message: error
      })
    }

    // init de cette sesatheque et des autres pour sesatheque-client
    addSesatheque(baseId, baseUrl)
    if (sesatheques.length) sesatheques.forEach(({baseId, baseUrl}) => addSesatheque(baseId, baseUrl))

    // chargement de la session
    const {getCurrentSession} = this.props
    getCurrentSession()
  }

  render () {
    return null
  }
}

InitApp.propTypes = {
  getCurrentSession: PropTypes.func,
  notify: PropTypes.func,
  search: PropTypes.string
}

const mapStateToProps = ({router: {location: {search}}}) => ({search})

const mapDispatchToProps = {
  getCurrentSession
}

export default addNotifyToProps(
  connect(mapStateToProps, mapDispatchToProps)(
    InitApp
  )
)
