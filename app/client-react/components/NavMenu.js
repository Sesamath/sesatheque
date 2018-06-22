import React from 'react'
import PropTypes from 'prop-types'
import NavMenuItem from './NavMenuItem'
import NavButton from './NavButton'

function deleteRessource (oid) {
  if (confirm('Êtes vous sûr de vouloir supprimer cette ressource')) {
    alert('on supprime')
    // ici faut lancer l'action deleteRessource qui redirigera vers la home
    window.location = '/'
  }
}

function cloneRessource (oid) {
  if (confirm('Êtes vous sûr de vouloir dupliquer cette ressource')) {
    alert('on duplique')
    // ici faut lancer l'action cloneRessource qui redirigera vers l'édition du clone
  }
}
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
      <NavButton
        onClick={cloneRessource.bind(null, ressourceOid)}
        title="Dupliquer"
        icon="copy"
        id="buttonDuplicate"
      />
      <NavButton
        onClick={deleteRessource.bind(null, ressourceOid)}
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
