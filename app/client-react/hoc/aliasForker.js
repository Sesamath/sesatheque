import {goBack} from 'connected-react-router'
import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {connect} from 'react-redux'
import {forkAlias} from '../actions/ressource'
import getDisplayName from '../utils/getDisplayName'

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
      // si on édite un alias, on ne rend rien
      if (this.props.ressource.aliasOf) {
        return null
      }

      return (
        <ResourceForm {...this.props} />
      )
    }
  }

  AliasForker.displayName = `aliasForker(${getDisplayName(ResourceForm)})`

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
