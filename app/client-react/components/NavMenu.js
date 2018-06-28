import {push} from 'connected-react-router'
import React from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import {deleteRessource, cloneRessource} from '../actions/ressource'
import NavMenuItem from './NavMenuItem'
import NavButton from './NavButton'

const NavMenu = ({
  ressourceOid,
  askClone,
  askDelete
}) => (
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

// les props sont passées en 2e argument
const mapDispatchToProps = (dispatch) => ({
  askDelete: (oid) => {
    if (confirm('Êtes vous sûr de vouloir supprimer cette ressource')) {
      const success = () => {
        // @todo virer cette attente pour remplacer par du dispatch(push('/')) dès que la home est gérée par react
        setTimeout(() => { window.location = '/' }, 1000)
        // dispatch(push('/'))
      }

      dispatch(deleteRessource(oid, success))
    }
  },
  askClone: (oid) => {
    if (confirm('Êtes vous sûr de vouloir dupliquer cette ressource')) {
      const success = (clonedOid) => {
        return dispatch(push(`/ressource/modifier/${clonedOid}`))
      }

      return dispatch(cloneRessource(oid, success))
    }
  }
})

export default connect(null, mapDispatchToProps)(NavMenu)
