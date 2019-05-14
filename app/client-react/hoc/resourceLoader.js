import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {connect} from 'react-redux'
import {loadRessource} from '../actions/ressource'
import getDisplayName from '../utils/getDisplayName'

const mapDispatchToProps = {
  loadRessource
}

const mapStateToProps = ({ressource}) => ({ressource})

/**
 * High Order Component qui charge une ressource avant de la passer à WrappedComponent
 * (si on l'avait pas déjà dans le state)
 * @param {Component} WrappedComponent
 * @return {Component} Le composant enrichi
 */
const resourceLoader = (WrappedComponent) => {
  class ResourceLoader extends Component {
    // lors du 1er mount du component on charge la ressource
    componentDidMount () {
      const {match: {params: {ressourceOid}}} = this.props
      this.props.loadRessource(ressourceOid)
    }

    render () {
      if (this.props.ressource === null) return null

      return (
        <WrappedComponent {...this.props} />
      )
    }
  }

  ResourceLoader.displayName = `resourceLoader(${getDisplayName(WrappedComponent)})`

  ResourceLoader.propTypes = {
    match: PropTypes.shape({
      params: PropTypes.shape({
        ressourceOid: PropTypes.string
      })
    }),
    loadRessource: PropTypes.func,
    ressource: PropTypes.shape({})
  }

  return connect(
    mapStateToProps,
    mapDispatchToProps
  )(ResourceLoader)
}

export default resourceLoader
