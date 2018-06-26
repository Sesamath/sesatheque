import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {connect} from 'react-redux'
import {forkAlias} from '../actions/ressource'

const mapDispatchToProps = {
  forkAlias
}

const mapStateToProps = ({ressource}) => ({ressource})

const aliasForker = (WrappedComponent) => {
  class AliasForker extends Component {
    componentDidMount () {
      this.ensuresIsForked()
    }

    componentDidUpdate () {
      this.ensuresIsForked()
    }

    ensuresIsForked () {
      if (this.props.ressource.aliasOf) {
        this.props.forkAlias(this.props.ressource.oid)
      }
    }

    render () {
      if (this.props.ressource === null) return null

      return (
        <WrappedComponent {...this.props} />
      )
    }
  }

  AliasForker.propTypes = {
    match: PropTypes.shape({
      params: PropTypes.shape({
        ressourceOid: PropTypes.string
      })
    }),
    forkAlias: PropTypes.func,
    ressource: PropTypes.shape({
      aliasOf: PropTypes.string,
      oid: PropTypes.string
    })
  }

  return connect(
    mapStateToProps,
    mapDispatchToProps
  )(AliasForker)
}

export default aliasForker
