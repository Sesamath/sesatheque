import PropTypes from 'prop-types'
import React, {Fragment} from 'react'
import {connect} from 'react-redux'
import {NavLink} from 'react-router-dom'
import groupesListeLoader from './hoc/groupesListeLoader'
import {joinGroupe, leaveGroupe} from './utils/groupesOperations'
import {getGroupesOuvertsUrl} from '../../apiRoutes'

/**
 * La liste des groupes ouverts (auth)
 * @type PureComponent
 * @param {object} props
 * @param {function} props.groupes
 * @param {function} props.joinGroupe
 * @param {function} props.leaveGroupe
 * @param {function} props.groupesMembre
 */
const GroupesOuverts = ({
  groupes,
  joinGroupe,
  leaveGroupe,
  groupesMembre
}) => (
  <Fragment>
    <h1>Tous les groupes ouverts</h1>
    {groupes.length ? (
      <ul className="liste">
        {groupes.map(
          ({
            nom,
            description,
            public: publicStatus,
            gestionnaires,
            gestionnairesNames
          }) => {
            return (
              <li key={nom}><strong>{nom}</strong> ({publicStatus ? 'public' : 'privé'})
                <span className="links">
                  {groupesMembre.includes(nom) ? (
                    <button className="btn--info" onClick={() => leaveGroupe(nom)}>
                      <i className="fa fa-sign-out-alt"></i>Quitter
                    </button>
                  ) : (
                    <button className="btn--info" onClick={() => joinGroupe(nom)}>
                      <i className="fa fa-sign-in-alt"></i>Rejoindre
                    </button>
                  )}
                  <NavLink
                    className="btn--info"
                    to={{
                      pathname: '/ressource/rechercher',
                      hash: 'results',
                      search: `groupes=${encodeURIComponent(nom)}`
                    }}><i className="fa fa-bookmark"></i>Voir les ressources du groupe
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
    ) : (
      <p>Il n’y a aucun groupe ouvert</p>
    )}
  </Fragment>
)

GroupesOuverts.propTypes = {
  groupes: PropTypes.array,
  joinGroupe: PropTypes.func,
  leaveGroupe: PropTypes.func,
  groupesMembre: PropTypes.array
}

const mapStateToProps = ({session}) => ({
  groupesMembre: (session && session.personne && session.personne.groupesMembre) || []
})
const mapDispatchToProps = {
  joinGroupe,
  leaveGroupe
}

// groupesListeLoader contient ensureLogged
export default groupesListeLoader(getGroupesOuvertsUrl())(
  connect(mapStateToProps, mapDispatchToProps)(GroupesOuverts)
)
