import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {GET} from '../../../utils/httpMethods'

/**
 * Higher Order Component qui charge un groupe avant de les passer à WrappedComponent
 * @param {Component} WrappedComponent
 * @return {Component} Le composant avec un groupe ajouté dans ses props
 */
const groupeLoader = (WrappedComponent) => {
  class GroupeLoader extends Component {
    constructor (props) {
      super(props)
      this.state = null
    }

    componentDidMount () {
      const {match: {params: {groupe: groupeNom}}} = this.props
      if (groupeNom) {
        // faut aller le chercher
        GET(`/api/groupe/byNom/${groupeNom}?format=full`)
          .then((groupe) => this.setState(groupe))
          .catch(error => console.log(error))
      } else {
        // en l'absence de groupe on en crée un vide avec les params par défaut
        // pour le formulaire de création
        const {oid, nom, prenom} = this.props.personne
        return this.setState({
          ouvert: false,
          public: true,
          gestionnaires: [oid],
          gestionnairesNames: [`${prenom} ${nom}`]
        })
      }
    }

    render () {
      console.log('state dans groupeLoader.render', this.state)
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
