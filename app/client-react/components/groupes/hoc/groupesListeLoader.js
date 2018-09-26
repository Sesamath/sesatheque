import React, {Component} from 'react'
import {GET} from '../../../utils/httpMethods'
import ensureLogged from '../../../hoc/ensureLogged'
import getDisplayName from '../../../utils/getDisplayName'

/**
 * Higher Order Component qui charge les groupes ouverts ou publics (suivant url passée)
 * avant de les passer à WrappedComponent
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

  GroupesListeLoader.displayName = `groupesListeLoader(${getDisplayName(WrappedComponent)})`

  GroupesListeLoader.propTypes = {}

  return ensureLogged(GroupesListeLoader)
}

export default groupesListeLoader
