import React from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import {deleteRessource, cloneRessource} from '../actions/ressource'

import NavMenuItem from './NavMenuItem'
import NavButton from './NavButton'

const NavMenu = ({ressourceOid, askClone, askDelete}) => (
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
        onClick={askClone.bind(null, ressourceOid)}
        title="Dupliquer"
        icon="copy"
        id="buttonDuplicate"
      />
      <NavButton
        onClick={askDelete.bind(null, ressourceOid)}
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
  askDelete: (oid) => {
    if (confirm('Êtes vous sûr de vouloir supprimer cette ressource')) {
      dispatch(deleteRessource(oid))
    }
  },
  askClone: (oid) => {
    if (confirm('Êtes vous sûr de vouloir dupliquer cette ressource')) {
      dispatch(cloneRessource(oid))
    }
  }
})

export default connect(null, mapDispatchToProps)(NavMenu)
