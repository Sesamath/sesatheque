import {goBack} from 'connected-react-router'
import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {connect} from 'react-redux'
import {forkAlias} from '../actions/ressource'

const mapDispatchToProps = (dispatch) => ({
  ensuresIsForked: ({oid, aliasOf}) => {
    if (!aliasOf) return

    if (confirm('Cette ressource est un alias, une copie va donc être créée, voulez-vous continuer ?')) {
      dispatch(forkAlias(oid))
    } else {
      dispatch(goBack())
    }
  }
})

const mapStateToProps = ({ressource}) => ({ressource})

/**
 * High Order Component pour déclencher automatiquement un fork si on édite un alias
 * @param {ResourceForm} ResourceForm
 * @return {Component}
 */
const aliasForker = (ResourceForm) => {
  class AliasForker extends Component {
    componentDidMount () {
      this.props.ensuresIsForked(this.props.ressource)
    }

    componentDidUpdate () {
      this.props.ensuresIsForked(this.props.ressource)
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
    ensuresIsForked: PropTypes.func,
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
