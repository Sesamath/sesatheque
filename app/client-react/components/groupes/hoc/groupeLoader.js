import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {GET} from '../../../utils/httpMethods'

/**
 * Higher Order Component qui charge un groupe avant de les passer à WrappedComponent
 * (si on l'avait pas déjà dans le state)
 * @param {Component} WrappedComponent
 * @return {Component} Le composant enrichi
 */
const groupeLoader = (WrappedComponent) => {
  class GroupeLoader extends Component {
    constructor (props) {
      super(props)
      this.state = null
    }

    componentDidMount () {
      const {match: {params: {groupe}}} = this.props
      if (!groupe) {
        const {oid, nom, prenom} = this.props.personne
        return this.setState({
          ouvert: false,
          public: true,
          gestionnaires: [oid],
          gestionnairesNames: [`${prenom} ${nom}`]
        })
      }

      GET(`/api/groupe/byNom/${groupe}?format=full`)
        .then((groupe) => this.setState(groupe))
        .catch(error => console.log(error))
    }

    render () {
      if (this.state === null) return null

      return (
        <WrappedComponent {...this.props} groupe={this.state}/>
      )
    }
  }

  GroupeLoader.propTypes = {
    match: PropTypes.shape({}),
    personne: PropTypes.object
  }

  return GroupeLoader
}

export default groupeLoader
