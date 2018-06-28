import PropTypes from 'prop-types'
import React, {Component, Fragment} from 'react'
import {connect} from 'react-redux'

class EditorExternal extends Component {
  getUrl () {
    const {type, idOrigin, parametres} = this.props
    switch (type) {
      case 'am':
      case 'em':
        return 'https://mep-col.sesamath.net/interface_dev/'
      case 'ato':
        const code = parametres && parametres.ouvrage_code
        if (code) return `https://zoneur.sesamath.net/?sel_ouvrage=${code}`
        return 'https://zoneur.sesamath.net'
      case 'coll_doc':
        return `https://ressources.sesamath.net/coll/docs_consulter.php?ledoc=${idOrigin}`
      default:
        return null
    }
  }

  getInfosSup () {
    switch (this.props.type) {
      case 'ato':
        const url = 'https://ressources.sesamath.net/coll/'
        return (<p>(Le lien ci-dessus pointe sur le découpage de l’atome dans le manuel, mais la source originale est sur <a href={url}>{url}</a>)</p>)
      case 'lingot':
        return (<p>Les ressources lingot ne sont malheureusement plus disponibles, faute de temps pour redévelopper l’analyse des résultats dans une technologie compatible avec labomep2</p>)
      default:
        return null
    }
  }

  render () {
    const url = this.getUrl()
    const infos = this.getInfosSup()
    if (url) {
      return (
        <Fragment>
          <p>Cette ressource ne peut pas être éditée ici, vous devez le faire via <a href={url}>{url}</a>.</p>
          {infos}
        </Fragment>
      )
    } else if (infos) {
      return infos
    } else {
      return (
        <p>Cette ressource ne peut pas être éditée ici mais la source est inconnue.</p>
      )
    }
  }
}

EditorExternal.propTypes = {
  type: PropTypes.string,
  origin: PropTypes.string,
  idOrigin: PropTypes.string,
  parametres: PropTypes.object
}

const mapStateToProps = ({ressource: {type, origin, idOrigin, parametres}}) => ({type, origin, idOrigin})

export default connect(mapStateToProps)(EditorExternal)
