import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {connect} from 'react-redux'

const mapStateToProps = ({session}) => ({
  personne: session && session.personne
})

/**
* High Order Component qui affiche qu'il faut se connecter lorsque la session
 * ne contient pas d'utilisateur, et le WrappedComponent sinon
* @param {Component} WrappedComponent
* @return {Component} Le composant enrichi
*/
const ensureLogged = (WrappedComponent) => {
  class EnsureLogged extends Component {
    render () {
      if (this.props.personne === null) {
        return (
          <p>Vous devez être connecté pour accéder à cette page.</p>
        )
      }

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
