import React from 'react'
import PropTypes from 'prop-types'
import NavMenuItem from './NavMenuItem'

const NavMenu = ({ressourceOid}) => (
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
      <NavMenuItem
        to={`/ressource/ajouter?clone=${ressourceOid}`}
        title="Dupliquer"
        icon="copy"
        id="buttonDuplicate"
      />
      <NavMenuItem
        to={`/ressource/supprimer/${ressourceOid}`}
        title="Supprimer"
        icon="trash"
        id="buttonDelete"
      />
    </ul>
    <div className="clearfix"></div>
  </div>
)

NavMenu.propTypes = {
  ressourceOid: PropTypes.string
}

export default NavMenu
