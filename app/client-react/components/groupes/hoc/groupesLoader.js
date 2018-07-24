import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {connect} from 'react-redux'
import ensureLogged from '../../../hoc/ensureLogged'
import {loadGroupes} from '../../../actions/groupes'

const mapDispatchToProps = {
  loadGroupes
}

const mapStateToProps = ({groupes, session}) => ({
  groupes,
  groupesAdmin: (session && session.personne && session.personne.groupesAdmin) || [],
  groupesMembre: (session && session.personne && session.personne.groupesMembre) || [],
  groupesSuivis: (session && session.personne && session.personne.groupesSuivis) || []
})

/**
 * Higher Order Component qui charge les groupes avant de les passer à WrappedComponent
 * (si on l'avait pas déjà dans le state)
 * @param {Component} WrappedComponent
 * @return {Component} Le composant enrichi
 */
const groupesLoader = (WrappedComponent) => {
  class GroupesLoader extends Component {
    componentDidMount () {
      if (this.props.groupes === null) {
        this.props.loadGroupes()
      }
    }

    componentDidUpdate () {
      if (this.props.groupes === null) {
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
    groupes: PropTypes.shape({})
  }

  return ensureLogged(
    connect(mapStateToProps, mapDispatchToProps)(GroupesLoader)
  )
}

export default groupesLoader
