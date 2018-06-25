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
    // lors du 1er mount du component on charge la ressource
    componentDidMount () {
      const {match: {params: {ressourceOid}}} = this.props
      this.props.loadRessource(ressourceOid)
    }

    // et ensuite à chaque fois que l'oid change
    // todo: clarify/simplify this loading code to avoid double fetches on same oid (here with componentDidUpdate)
    componentDidUpdate (prevProps) {
      const ressourceOid = this.props.match.params.ressourceOid
      if (ressourceOid !== prevProps.match.params.ressourceOid) {
        this.props.loadRessource(ressourceOid)
      }
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
