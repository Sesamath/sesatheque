import PropTypes from 'prop-types'
import React, {Fragment} from 'react'
import {NavLink} from 'react-router-dom'

const ResourceList = ({resources}) => (
  <table className="table resourceList">
    <thead>
      <tr>
        <th></th>
        <th>Identifiant</th>
        <th>Titre</th>
        <th colSpan="4">Actions</th>
      </tr>
    </thead>
    <tbody>
      {resources.map(({
        oid,
        titre,
        type,
        $droits
      }) => (
        <tr key={oid.toString()}>
          <td><img src={`/plugins/${type}/${type}.gif`} alt="thumbnail" /></td>
          <td>{oid.toString()}</td>
          <td>{titre}</td>
          <td colSpan="4" className="links">
            {$droits.includes('R') ? (
              <Fragment>
                <NavLink
                  to={`/ressource/decrire/${oid}`}
                  title="Description"
                >Description {$droits}</NavLink>
                <NavLink
                  to={`/ressource/apercevoir/${oid}`}
                  title="Aperçu"
                >Aperçu</NavLink>
                <NavLink
                  to={`/ressource/voir/${oid}`}
                  title="Modifier"
                >Voir</NavLink>
              </Fragment>
            ) : null}
            {$droits.includes('W') ? (
              <NavLink
                to={`/ressource/modifier/${oid}`}
                title="Modifier"
              >Modifier</NavLink>
            ) : null}
            {$droits.includes('D') ? (
              <NavLink
                to={`/ressource/modifier/${oid}`}
                title="Supprimer"
              >Supprimer</NavLink>
            ) : null}
          </td>
        </tr>
      ))}
      {!resources.length ? (
        <Fragment>
          <tr>
            <td colSpan="7" className="empty">-</td>
          </tr>
        </Fragment>
      ) : null}
    </tbody>
  </table>
)

ResourceList.propTypes = {
  resources: PropTypes.array
}

export default ResourceList
