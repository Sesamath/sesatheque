import {push} from 'connected-react-router'
import React, {Fragment} from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import {getContext} from 'recompose'
import {askDelete, askClone} from '../utils/ressourceOperations'
import NavMenuItem from './NavMenuItem'
import NavButton from './NavButton'
import './NavMenu.scss'

const NavMenu = ({
  isIframeLayout,
  ressourceOid,
  askClone,
  askDelete,
  titre,
  droits = ''
}) => {
  if (isIframeLayout) {
    return <h1>{titre}</h1>
  }

  return (
    <Fragment>
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
          {droits.includes('W') ? (
            <NavMenuItem
              to={`/ressource/modifier/${ressourceOid}`}
              title="Modifier"
              icon="edit"
              id="buttonEdit"
            />
          ) : null}
          <NavButton
            onClick={askClone.bind(null, ressourceOid)}
            title="Dupliquer"
            icon="copy"
            id="buttonDuplicate"
          />
          {droits.includes('D') ? (
            <NavButton
              onClick={askDelete.bind(null, ressourceOid)}
              title="Supprimer"
              icon="trash"
              id="buttonDelete"
            />
          ) : null}
        </ul>
        <h1 className="fl">{titre}</h1>
        <div className="clearfix"></div>
      </div>
    </Fragment>
  )
}

NavMenu.propTypes = {
  askClone: PropTypes.func,
  askDelete: PropTypes.func,
  droits: PropTypes.string,
  isIframeLayout: PropTypes.bool,
  ressourceOid: PropTypes.string,
  titre: PropTypes.string
}

// les props sont passées en 2e argument
const mapDispatchToProps = (dispatch) => ({
  askDelete: askDelete(dispatch, () => dispatch(push('/'))),
  askClone: askClone(dispatch, clonedOid =>
    dispatch(
      push(`/ressource/modifier/${clonedOid}`)
    ))
})

export default getContext({isIframeLayout: PropTypes.bool})(connect(null, mapDispatchToProps)(NavMenu))
