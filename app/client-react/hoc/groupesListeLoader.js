import React, {Component} from 'react'
import {GET} from '../utils/httpMethods'

/**
 * High Order Component qui charge les groupes ouverts avant de les passer à WrappedComponent
 * (si on l'avait pas déjà dans le state)
 * @param {Component} WrappedComponent
 * @return {Component} Le composant enrichi
 */
const groupesListeLoader = url => WrappedComponent => {
  class GroupesListeLoader extends Component {
    constructor (props) {
      super(props)
      this.state = {groupes: null}
    }

    componentDidMount () {
      GET(url)
        .then(({groupes}) => this.setState({groupes}))
        .catch(error => console.log(error))
    }

    render () {
      if (this.state.groupes === null) return null

      return (
        <WrappedComponent {...this.props} groupes={this.state.groupes} />
      )
    }
  }

  GroupesListeLoader.propTypes = {}

  return GroupesListeLoader
}

export default groupesListeLoader
