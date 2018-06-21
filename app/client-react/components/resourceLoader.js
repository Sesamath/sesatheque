import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {GET, POST} from '../utils/httpMethods'
import addNotifyToProps from '../utils/addNotifyToProps'

const resourceLoader = (WrappedComponent) => {
  class ResourceLoader extends Component {
    constructor (props) {
      super(props)
      const {match: {params: {ressourceOid}}} = props
      this.ressourceOid = ressourceOid
      this.state = {
        ressource: null
      }
      this.onSubmit = this.onSubmitInner.bind(this)
      this.beforeSaveRegister = this.beforeSaveRegisterInner.bind(this)
    }

    beforeSaveRegisterInner (getParametres) {
      this.getParametres = getParametres
    }

    onSubmitInner (body) {
      if (this.getParametres) {
        body.parametres = this.getParametres()
      }
      return POST(`/api/ressource`, {body})
        .then(() => {
          this.props.notify({
            level: 'info',
            message: 'La ressource a été sauvegardée'
          })
        })
        .catch(saveError => {
          this.props.notify({
            level: 'error',
            message: `La sauvegarde a échouée: ${saveError.message}`
          })
        })
    }

    componentDidMount () {
      GET(`/api/ressource/${this.ressourceOid}`)
        .then((ressource) => {
          this.setState({
            ressource
          })
        })
    }

    render () {
      if (this.state.ressource === null) return null

      return (
        <WrappedComponent
          initialValues={this.state.ressource}
          onSubmit={this.onSubmit}
          {...this.props}
          beforeSaveRegister={this.beforeSaveRegister}
        />
      )
    }
  }

  ResourceLoader.propTypes = {
    match: PropTypes.shape({
      params: PropTypes.shape({
        ressourceOid: PropTypes.string
      })
    }),
    notify: PropTypes.func
  }

  return addNotifyToProps(ResourceLoader)
}

export default resourceLoader
