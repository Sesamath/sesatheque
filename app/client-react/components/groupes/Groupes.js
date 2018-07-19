import PropTypes from 'prop-types'
import React, {Fragment} from 'react'
import {connect} from 'react-redux'
import {NavLink} from 'react-router-dom'
import groupesLoader from './hoc/groupesLoader'
import {
  followGroupe,
  joinGroupe,
  deleteGroupe,
  ignoreGroupe,
  leaveGroupe
} from './utils/groupesOperations'

import './Groupes.scss'

const toDetailedList = (groupes, ref) => {
  const res = []
  groupes.forEach(nom => {
    res.push(ref[nom])
  })

  return res
}

const Groupes = ({
  followGroupe,
  joinGroupe,
  deleteGroupe,
  ignoreGroupe,
  leaveGroupe,
  groupesAdmin,
  groupesMembre,
  groupesSuivis,
  groupes
}) => (
  <Fragment>
    <h1>Mes groupes</h1>
    <h2>Groupes dont je suis gestionnaire</h2>
    <p>
      <NavLink to="/groupe/ajouter">
        Créer un groupe
      </NavLink>
    </p>
    <ul className="liste">
      {(toDetailedList(groupesAdmin, groupes)).map(
        ({
          nom,
          description,
          ouvert,
          public: publicStatus,
          gestionnaires,
          gestionnairesNames
        }) => (
          <li key={nom}> {nom} ({ouvert ? 'ouvert' : 'fermé'} {publicStatus ? 'public' : 'privé'})
            <span className="links">
              <button onClick={() => deleteGroupe(nom)}>Supprimer</button>
              {groupesMembre.includes(nom) ? null
                : (
                  <button onClick={() => joinGroupe(nom)}>Rejoindre</button>
                )
              }
              {groupesSuivis.includes(nom) ? null
                : (
                  <button onClick={() => followGroupe(nom)}>Suivre</button>
                )
              }
              <NavLink to={`/groupe/editer/${encodeURIComponent(nom)}`}>Modifier</NavLink>
              <NavLink to={{
                pathname: '/ressource/rechercher',
                hash: 'results',
                search: `groupes=${encodeURIComponent(nom)}`
              }}>Voir les ressources du groupe
              </NavLink>
            </span>
            <pre>{description}</pre>
            <ul>
              Gestionnaire(s) :&nbsp;
              {gestionnaires.map((oid, index) => (
                <li key={oid}>{gestionnairesNames[index]} <span className="remarque">({oid})</span>
                </li>
              ))}
            </ul>
          </li>
        )
      )}
    </ul>
    <h2>Groupes dont je suis membre</h2>
    <p>
      <NavLink to="/groupe/ouvert">Voir la liste des groupes ouverts</NavLink>
      <span className="remarque">(pour éventuellement en devenir membre)</span>
    </p>
    <ul className="liste">
      {(toDetailedList(groupesMembre, groupes)).map(
        ({
          nom,
          description,
          gestionnaires,
          gestionnairesNames
        }) => (
          <li key={nom}> {nom}
            <span className="links">
              <button onClick={() => leaveGroupe(nom)}>Quitter le groupe
              </button>
              <NavLink to={{
                pathname: '/ressource/rechercher',
                hash: 'results',
                search: `groupes=${encodeURIComponent(nom)}`
              }}>Voir les ressources du groupe
              </NavLink>
            </span>
            <pre>{description}</pre>
            <ul>
              Gestionnaire(s) :&nbsp;
              {gestionnaires.map((oid, index) => (
                <li key={oid}>{gestionnairesNames[index]} <span className="remarque">({oid})</span>
                </li>
              ))}
            </ul>
          </li>
        )
      )}
    </ul>
    <h2>Groupes suivis</h2>
    <p>
      <NavLink to="/groupe/public">Voir la liste des groupes publics</NavLink>
      <span className="remarque">(pour éventuellement suivre leurs publications)
      </span>
    </p>
    <ul className="liste">
      {(toDetailedList(groupesSuivis, groupes)).map(
        ({
          nom,
          description,
          gestionnaires,
          gestionnairesNames
        }) => (
          <li key={nom}> {nom}
            <span className="links">
              <button onClick={() => ignoreGroupe(nom)}>Ne plus suivre le groupe
              </button>
              <NavLink to={{
                pathname: '/ressource/rechercher',
                hash: 'results',
                search: `groupes=${encodeURIComponent(nom)}`
              }}>Voir les ressources du groupe
              </NavLink>
            </span>
            <pre>{description}</pre>
            <ul>
              Gestionnaire(s) :&nbsp;
              {gestionnaires.map((oid, index) => (
                <li key={oid}>{gestionnairesNames[index]} <span className="remarque">({oid})</span>
                </li>
              ))}
            </ul>
          </li>
        )
      )}
    </ul>
  </Fragment>
)

Groupes.propTypes = {
  groupes: PropTypes.object,
  groupesAdmin: PropTypes.array,
  groupesMembre: PropTypes.array,
  groupesSuivis: PropTypes.array,
  joinGroupe: PropTypes.func,
  leaveGroupe: PropTypes.func,
  followGroupe: PropTypes.func,
  ignoreGroupe: PropTypes.func,
  deleteGroupe: PropTypes.func
}

const mapDispatchToProps = {
  followGroupe,
  joinGroupe,
  deleteGroupe,
  ignoreGroupe,
  leaveGroupe
}

export default connect(null, mapDispatchToProps)(groupesLoader(Groupes))
