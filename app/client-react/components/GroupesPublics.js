import PropTypes from 'prop-types'
import React, {Fragment} from 'react'
import {NavLink} from 'react-router-dom'
import groupesListeLoader from '../hoc/groupesListeLoader'

const GroupesPublics = ({
  groupes
}) => (
  <Fragment>
    <h1>Tous les groupes publics</h1>
    <ul className="liste">
      {groupes.map(
        ({
          nom,
          description,
          public: publicStatus,
          ouvert
        }) => {
          return (
            <li key={nom}> {nom} ({ouvert ? 'ouvert' : 'fermé'})
              <span className="links">
                <NavLink to={`/groupe/editer/${nom}`}>Modifier</NavLink>
                <NavLink to={`/groupe/supprimer/${nom}`}>Supprimer</NavLink>
                <NavLink to={`/groupe/voir/${nom}`}>Voir</NavLink>
              </span>
              <pre>{description}</pre>
            </li>
          )
        }
      )}
    </ul>
  </Fragment>
)

GroupesPublics.propTypes = {
  groupes: PropTypes.array
}

export default groupesListeLoader('/api/groupes/publics')(GroupesPublics)
