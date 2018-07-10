import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {connect} from 'react-redux'
import {loadGroupes} from '../actions/groupes'

const mapDispatchToProps = {
  loadGroupes
}

const mapStateToProps = ({groupes, session}) => ({
  groupes,
  pid: session && session.personne && session.personne.pid
})

/**
 * High Order Component qui charge les groupes avant de les passer à WrappedComponent
 * (si on l'avait pas déjà dans le state)
 * @param {Component} WrappedComponent
 * @return {Component} Le composant enrichi
 */
const groupesLoader = (WrappedComponent) => {
  class GroupesLoader extends Component {
    // lors du 1er mount du component on charge la ressource
    componentDidMount () {
      if (this.props.pid !== null && this.props.groupes === null) {
        this.props.loadGroupes()
      }
    }

    componentDidUpdate () {
      if (this.props.pid !== null && this.props.groupes === null) {
        this.props.loadGroupes()
      }
    }
    render () {
      if (this.props.groupes === null) return null

      return (
        <WrappedComponent {...this.props} />
      )
    }
  }

  GroupesLoader.propTypes = {
    loadGroupes: PropTypes.func,
    pid: PropTypes.string,
    groupes: PropTypes.shape({})
  }

  return connect(
    mapStateToProps,
    mapDispatchToProps
  )(GroupesLoader)
}

export default groupesLoader
