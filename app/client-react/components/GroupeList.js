import PropTypes from 'prop-types'
import React from 'react'
import {NavLink} from 'react-router-dom'

const GroupeList = ({
  groupes
}) => (
  <ul className="liste">
    {groupes.map(
      ({
        nom,
        description,
        ouvert,
        public: publicStatus
      }) => {
        return (
          <li key={nom}> {nom} ({ouvert ? 'ouvert' : 'fermé'} {publicStatus ? 'public' : 'privé'})
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
)

GroupeList.propTypes = {
  groupes: PropTypes.object
}

export default GroupeList
