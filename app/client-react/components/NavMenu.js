import React from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import { withRouter } from 'react-router-dom'

import {deleteRessource, cloneRessource} from '../actions/ressource'

import NavMenuItem from './NavMenuItem'
import NavButton from './NavButton'

const NavMenu = ({ressourceOid, askClone, askDelete, history}) => (
  <div id="actions">
    <ul>
      <NavMenuItem
        to={`/ressource/decrire/${ressourceOid}`}
        title="Description"
        icon="file-alt"
      />
      <NavMenuItem
        to={`/ressource/apercevoir/${ressourceOid}`}
        title="Aperçu"
        icon="eye-slash"
      />
      <NavMenuItem
        to={`/ressource/voir/${ressourceOid}`}
        title="Voir"
        icon="eye"
        target="_blank"
      />
      <NavMenuItem
        to={`/ressource/modifier/${ressourceOid}`}
        title="Modifier"
        icon="edit"
        id="buttonEdit"
      />
      <NavButton
        onClick={askClone.bind(null, ressourceOid, history)}
        title="Dupliquer"
        icon="copy"
        id="buttonDuplicate"
      />
      <NavButton
        onClick={askDelete.bind(null, ressourceOid, history)}
        title="Supprimer"
        icon="trash"
        id="buttonDelete"
      />
    </ul>
    <div className="clearfix"></div>
  </div>
)

NavMenu.propTypes = {
  askClone: PropTypes.func,
  askDelete: PropTypes.func,
  ressourceOid: PropTypes.string
}

const mapDispatchToProps = (dispatch) => ({
  askDelete: (oid, history) => {
    if (confirm('Êtes vous sûr de vouloir supprimer cette ressource')) {
      dispatch(deleteRessource(oid, history))
    }
  },
  askClone: (oid, history) => {
    if (confirm('Êtes vous sûr de vouloir dupliquer cette ressource')) {
      dispatch(cloneRessource(oid, history))
    }
  }
})

// withRouter d'après https://reacttraining.com/react-router/web/guides/redux-integration
// ça fonctionne, on récupère history, mais pas sûr que ce soit la bonne méthode car cette doc renvoie vers le deprecated
// https://github.com/reacttraining/react-router/tree/master/packages/react-router-redux
export default withRouter(connect(null, mapDispatchToProps)(NavMenu))
