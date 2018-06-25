import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {connect} from 'react-redux'
import {forkRessource} from '../actions/ressource'

const mapDispatchToProps = {
  forkRessource
}

const mapStateToProps = ({ressource}) => ({ressource})

const resourceForker = (WrappedComponent) => {
  class ResourceForker extends Component {
    componentDidMount () {
      this.ensuresIsForked()
    }

    componentDidUpdate () {
      this.ensuresIsForked()
    }

    ensuresIsForked () {
      if (this.props.ressource.aliasOf) {
        this.props.forkRessource(this.props.ressource.oid)
      }
    }

    render () {
      if (this.props.ressource === null) return null

      return (
        <WrappedComponent {...this.props} />
      )
    }
  }

  ResourceForker.propTypes = {
    match: PropTypes.shape({
      params: PropTypes.shape({
        ressourceOid: PropTypes.string
      })
    }),
    forkRessource: PropTypes.func,
    ressource: PropTypes.shape({})
  }

  return connect(
    mapStateToProps,
    mapDispatchToProps
  )(ResourceForker)
}

export default resourceForker
