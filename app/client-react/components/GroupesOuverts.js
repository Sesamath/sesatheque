import PropTypes from 'prop-types'
import React, {Fragment} from 'react'
import {NavLink} from 'react-router-dom'
import groupesListeLoader from '../hoc/groupesListeLoader'

const GroupesOuverts = ({
  groupes
}) => (
  <Fragment>
    <h1>Tous les groupes ouverts</h1>
    <ul className="liste">
      {groupes.map(
        ({
          nom,
          description,
          public: publicStatus
        }) => {
          return (
            <li key={nom}> {nom} ({publicStatus ? 'public' : 'privé'})
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

GroupesOuverts.propTypes = {
  groupes: PropTypes.array
}

export default groupesListeLoader('/api/groupes/ouverts')(GroupesOuverts)
