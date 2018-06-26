import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {connect} from 'react-redux'
import {forkAlias} from '../actions/ressource'

const mapDispatchToProps = {
  forkAlias
}

const mapStateToProps = ({ressource}) => ({ressource})

/**
 * High Order Component pour déclencher automatiquement un fork si on édite un alias
 * @param {ResourceForm} ResourceForm
 * @return {Component}
 */
const aliasForker = (ResourceForm) => {
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
      // si on édite un alias, ensuresIsForked appelle forkAlias qui dispatch un clearRessource,
      // donc WrappedComponent ne devrait pas avoir le temps d'être rendu (ou aussitôt effacé)
      // mais autant ne rien rendre
      if (this.props.ressource.aliasOf) return null

      return (
        <ResourceForm {...this.props} />
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
