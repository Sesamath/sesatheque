import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {connect} from 'react-redux'
import {loadRessource, saveRessource} from '../actions/ressource'

const mapDispatchToProps = {
  loadRessource,
  saveRessource
}

const mapStateToProps = ({ressource}) => ({ressource})

const resourceLoader = (WrappedComponent) => {
  class ResourceLoader extends Component {
    constructor (props) {
      super(props)
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

      return this.props.saveRessource(body)
    }

    componentDidMount () {
      const {match: {params: {ressourceOid}}} = this.props
      this.props.loadRessource(ressourceOid)
    }

    render () {
      if (this.props.ressource === null) return null

      return (
        <WrappedComponent
          initialValues={this.props.ressource}
          onSubmit={this.onSubmit}
          beforeSaveRegister={this.beforeSaveRegister}
          {...this.props}
        />
      )
    }
  }

  ResourceLoader.propTypes = {
    match: PropTypes.shape({
      params: PropTypes.shape({
        ressourceOid: PropTypes.string
      })
    })
  }

  return connect(
    mapStateToProps,
    mapDispatchToProps
  )(ResourceLoader)
}

export default resourceLoader
