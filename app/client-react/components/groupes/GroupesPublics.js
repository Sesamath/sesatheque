import PropTypes from 'prop-types'
import React, {Fragment} from 'react'
import {connect} from 'react-redux'
import {NavLink} from 'react-router-dom'
import groupesListeLoader from './hoc/groupesListeLoader'
import {followGroupe, ignoreGroupe} from './utils/groupesOperations'
import {getGroupesPublicsUrl} from '../../apiRoutes'

/**
 * La liste des groupes publics (auth)
 * @type PureComponent
 * @param {object} props
 * @param {Groupe[]} props.groupes
 * @param {function} props.followGroupe
 * @param {function} props.ignoreGroupe
 * @param {function} props.groupesSuivis
 */
const GroupesPublics = ({
  groupes,
  followGroupe,
  ignoreGroupe,
  groupesSuivis
}) => (
  <Fragment>
    <h1>Tous les groupes publics</h1>
    {groupes.length ? (
      <ul className="liste">
        {groupes.map(
          ({
            nom,
            description,
            ouvert,
            gestionnairesNames
          }) => {
            return (
              <li key={nom}><strong>{nom}</strong> ({ouvert ? 'ouvert' : 'fermé'})
                <pre>{description}</pre>
                <ul className="admins">
                  Gestionnaire(s) :&nbsp;
                  {gestionnairesNames.map((name, index) => (<li key={index}>{name}</li>))}
                </ul>

                <span className="links">
                  {groupesSuivis.includes(nom) ? (
                    <button className="btn--info" onClick={() => ignoreGroupe(nom)}>
                      <i className="fa fa-eye-slash"></i>Ne plus suivre
                    </button>
                  ) : (
                    <button className="btn--info" onClick={() => followGroupe(nom)}>
                      <i className="fa fa-eye"></i>Suivre
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
              </li>
            )
          }
        )}
      </ul>
    ) : (
      <p>Il n’y a aucun groupe public</p>
    )}
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

// groupesListeLoader contient ensureLogged
export default groupesListeLoader(getGroupesPublicsUrl())(
  connect(mapStateToProps, {followGroupe, ignoreGroupe})(
    GroupesPublics
  )
)
