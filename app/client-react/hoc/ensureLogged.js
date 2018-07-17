import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {connect} from 'react-redux'

const mapStateToProps = ({session}) => ({
  personne: session && session.personne
})

/**
* High Order Component qui ne rend rien si
* la session ne contient pas un utilisateur
* (si on ne l'avait pas déjà dans le state)
* @param {Component} WrappedComponent
* @return {Component} Le composant enrichi
*/
const ensureLogged = (WrappedComponent) => {
  class EnsureLogged extends Component {
    render () {
      if (this.props.personne === null) return null

      return (
        <WrappedComponent {...this.props} />
      )
    }
  }

  EnsureLogged.propTypes = {
    personne: PropTypes.object
  }

  return connect(mapStateToProps, {})(EnsureLogged)
}

export default ensureLogged
