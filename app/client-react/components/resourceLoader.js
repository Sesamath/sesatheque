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
    constructor (props) {
      super(props)
    }

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
