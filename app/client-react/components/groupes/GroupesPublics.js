import PropTypes from 'prop-types'
import React, {Fragment} from 'react'
import {connect} from 'react-redux'
import {NavLink} from 'react-router-dom'
import groupesListeLoader from './hoc/groupesListeLoader'
import {followGroupe, ignoreGroupe} from './utils/groupesOperations'

const GroupesPublics = ({
  groupes,
  followGroupe,
  ignoreGroupe,
  groupesSuivis
}) => (
  <Fragment>
    <h1>Tous les groupes publics</h1>
    <ul className="liste">
      {groupes.map(
        ({
          nom,
          description,
          ouvert,
          gestionnaires,
          gestionnairesNames
        }) => {
          return (
            <li key={nom}> {nom} ({ouvert ? 'ouvert' : 'fermé'})
              <span className="links">
                {groupesSuivis.includes(nom) ? (
                  <button onClick={() => ignoreGroupe(nom)}>
                    Ne plus suivre
                  </button>
                ) : (
                  <button onClick={() => followGroupe(nom)}>
                    Suivre
                  </button>
                )}
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
        }
      )}
    </ul>
  </Fragment>
)

GroupesPublics.propTypes = {
  groupes: PropTypes.array,
  followGroupe: PropTypes.func,
  ignoreGroupe: PropTypes.func,
  groupesSuivis: PropTypes.array
}

const mapStateToProps = ({session}) => ({
  groupesSuivis: (session && session.personne && session.personne.groupesSuivis) || []
})

export default groupesListeLoader('/api/groupes/publics')(
  connect(mapStateToProps, {followGroupe, ignoreGroupe})(
    GroupesPublics
  )
)
