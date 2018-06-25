import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {connect} from 'react-redux'
import {loadRessource} from '../actions/ressource'

const mapDispatchToProps = {
  loadRessource
}

const mapStateToProps = ({ressource}) => ({ressource})

const resourceLoader = (WrappedComponent) => {
  class ResourceLoader extends Component {
    componentDidMount () {
      const {match: {params: {ressourceOid}}} = this.props
      this.props.loadRessource(ressourceOid)
    }

    componentDidUpdate (prevProps) {
      const {match: {params: {ressourceOid}}} = this.props
      const {match: {params: {ressourceOid: prevRessourceOid}}} = prevProps
      if (ressourceOid !== prevRessourceOid) {
        this.props.loadRessource(ressourceOid)
      }
      // todo: clarify/simplify loading code
      // to cleanly avoid double fetches on
      // same oid
    }

    render () {
      if (this.props.ressource === null) return null

      return (
        <WrappedComponent {...this.props} />
      )
    }
  }

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
