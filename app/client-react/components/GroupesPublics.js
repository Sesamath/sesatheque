import PropTypes from 'prop-types'
import React, {Fragment} from 'react'
import {NavLink} from 'react-router-dom'
import groupesLoader from '../hoc/groupesLoader'

import './Groupes.scss'

const Groupes = ({pid, groupes: {
  groupesAdmin,
  groupesMembre,
  groupesSuivis,
  groupes
}}) => {
  if (pid === null) return null

  return (<Fragment>
    <h1>Mes groupes</h1>
    <h2>Groupes dont je suis gestionnaire</h2>
    <p>
      <NavLink to="/groupe/editer">
        Créer un groupe
      </NavLink>
    </p>
    <ul className="liste">
      {(groupesAdmin || []).map(
        nom => {
          const {
            description,
            ouvert,
            public: publicStatus
          } = groupes[nom]

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
    <h2>Groupes dont je suis membre</h2>
    <p>
      <NavLink to="/groupe/ouvert">Voir la liste des groupes ouverts</NavLink>
      <span className="remarque">(pour éventuellement en devenir membre)</span>
    </p>
    <ul className="liste">
      {(groupesMembre || []).map(
        nom => {
          const {
            description,
            gestionnaires
          } = groupes[nom]

          const owned = gestionnaires.includes(pid)

          return (
            <li key={nom}> {nom}
              <span className="links">
                {owned ? (<Fragment>
                  <NavLink to={`/groupe/editer/${nom}`}>Modifier</NavLink>
                  <NavLink to={`/groupe/supprimer/${nom}`}>Supprimer</NavLink>
                </Fragment>) : (<NavLink
                  to={`/groupe/quitter/${nom}`}>Quitter
                </NavLink>)}
                <NavLink to={`/groupe/voir/${nom}`}>Voir</NavLink>
              </span>
              <pre>{description}</pre>
            </li>
          )
        }
      )}
    </ul>
    <h2>Groupes suivis</h2>
    <p>
      <NavLink to="/groupe/public">Voir la liste des groupes publics</NavLink>
      <span className="remarque">(pour éventuellement suivre leurs publications)
      </span>
    </p>
    <ul className="liste">
      {(groupesSuivis || []).map(
        nom => {
          const {
            description
          } = groupes[nom]

          return (
            <li key={nom}> {nom}
              <span className="links">
                <NavLink to={`/groupe/voir/${nom}`}>Voir</NavLink>
              </span>
              <pre>{description}</pre>
            </li>
          )
        }
      )}
    </ul>
  </Fragment>)
}

Groupes.propTypes = {
  pid: PropTypes.string,
  groupes: PropTypes.shape({
    groupes: PropTypes.object,
    groupesAdmin: PropTypes.array,
    groupesMembre: PropTypes.array,
    groupesSuivis: PropTypes.array
  })
}

export default groupesLoader(Groupes)
