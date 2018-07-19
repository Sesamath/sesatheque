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

/**
 * Retourne un array de groupe à partir de tous les groupes et la sélection demandée
 * @private
 * @param {string[]} noms Les groupes que l'on veut
 * @param {Object} allGroupes Tous les groupes, le nom en propriété et le groupe en valeur
 * @return {Groupe[]} La sélection demandée
 */
const toDetailedList = (noms = [], allGroupes) => noms.map(nom => allGroupes[nom])

const displayAdmins = (gestionnaires, gestionnairesNames) => {
  if (!gestionnaires.length) return (<p>Aucun gestionnaire</p>)
  if (gestionnaires.length === 1) return (<p>Gestionnaire(s)&nbsp;: {gestionnairesNames[0]} <span className="remarque">({gestionnaires[0]})</span></p>)
  return (
    <ul>Gestionnaire(s) :&nbsp;
      {gestionnaires.map((oid, index) => (
        <li key={oid}>
          {gestionnairesNames[index]} <span className="remarque">({oid})</span>
        </li>
      ))}
    </ul>
  )
}

/**
 * Composant qui liste "Mes groupes" (auth)
 * @type {PureComponent}
 * @param {object} props
 * @param {function} props.followGroupe action redux pour suivre
 * @param {function} props.joinGroupe action redux pour devenir membre
 * @param {function} props.deleteGroupe action redux
 * @param {function} props.ignoreGroupe action redux pour ne plus suivre
 * @param {function} props.leaveGroupe action redux pour ne plus être membre
 * @param {string[]} props.groupesAdmin fourni par groupesLoader
 * @param {string[]} props.groupesMembre fourni par groupesLoader
 * @param {string[]} props.groupesSuivis fourni par groupesLoader
 * @param {Groupe[]} props.groupes fourni par groupesLoader
 */
const GroupesPerso = ({
  followGroupe,
  joinGroupe,
  deleteGroupe,
  ignoreGroupe,
  leaveGroupe,
  groupesAdmin,
  groupesMembre,
  groupesSuivis,
  groupes
}) => {
  // nos listes
  const adminList = toDetailedList(groupesAdmin, groupes)
  const memberList = toDetailedList(groupesMembre, groupes)
  const followList = toDetailedList(groupesSuivis, groupes)

  // à l'affichage, y'a que les liens qui changent suivant le type
  const getAdminLinks = (nom) => (
    <span className="links">
      <a href="#" onClick={() => deleteGroupe(nom)}>Supprimer</a>
      <NavLink to={`/groupe/editer/${encodeURIComponent(nom)}`}>Modifier</NavLink>
      <NavLink to={{
        pathname: '/ressource/rechercher',
        hash: 'results',
        search: `groupes=${encodeURIComponent(nom)}`
      }}>Voir les ressources du groupe</NavLink>
      {groupesMembre.includes(nom)
        ? null // le lien quitter sera dans la liste des groupesMembre
        : (<button onClick={() => joinGroupe(nom)}>Rejoindre</button>)
      }
      {groupesSuivis.includes(nom)
        ? null // le lien "ne plus suivre sera dans la liste des groupesSuivis
        : (<button onClick={() => followGroupe(nom)}>Suivre</button>)
      }
    </span>
  )

  const getMemberLinks = (nom) => (
    <span className="links">
      <NavLink to={{
        pathname: '/ressource/rechercher',
        hash: 'results',
        search: `groupes=${encodeURIComponent(nom)}`
      }}>Voir les ressources du groupe</NavLink>
      <button onClick={() => leaveGroupe(nom)}>Quitter le groupe</button>
    </span>
  )

  const getFollowLinks = (nom) => (
    <span className="links">
      <NavLink to={{
        pathname: '/ressource/rechercher',
        hash: 'results',
        search: `groupes=${encodeURIComponent(nom)}`
      }}>Voir les ressources du groupe
      </NavLink>
      <button onClick={() => ignoreGroupe(nom)}>Ne plus suivre le groupe</button>
    </span>
  )

  // la fct générique d'affichage d'un groupe
  const displayGroup = (groupe, getLinks) => {
    const {
      nom,
      description,
      ouvert,
      public: isPublic,
      gestionnaires,
      gestionnairesNames
    } = groupe
    return (
      <li key={nom}>
        <strong>{nom}</strong> ({ouvert ? 'ouvert' : 'fermé'} {isPublic ? 'public' : 'privé'})
        {getLinks(nom)}
        <pre>{description}</pre>
        {displayAdmins(gestionnaires, gestionnairesNames)}
      </li>
    )
  }

  // la fct générique d'affichage d'une liste
  const displayList = (list, getLinks) => (
    <ul className="liste">
      {list.map(groupe => displayGroup(groupe, getLinks))}
    </ul>
  )

  return (
    <Fragment>
      <h1>Mes groupes</h1>
      <h2>Groupes dont je suis gestionnaire</h2>

      <p><NavLink to="/groupe/ajouter">Créer un groupe</NavLink></p>

      {adminList.length
        ? displayList(adminList, getAdminLinks)
        : (<p>Vous n’êtes gestionnaire d’aucun groupe.</p>)
      }

      <h2>Groupes dont je suis membre</h2>
      <p>
        <NavLink to="/groupes/ouverts">Voir la liste des groupes ouverts</NavLink>
        <span className="remarque"> (pour éventuellement en devenir membre)</span>
      </p>
      {memberList.length
        ? displayList(memberList, getMemberLinks)
        : (<p>Vous n’êtes membre d’aucun groupe.</p>)
      }

      <h2>Groupes suivis</h2>
      <p>
        <NavLink to="/groupes/publics">Voir la liste des groupes publics</NavLink>
        <span className="remarque"> (pour éventuellement suivre leurs publications)</span>
      </p>

      {followList.length
        ? displayList(followList, getFollowLinks)
        : (<p>Vous ne suivez les publications d’aucun groupe.</p>)
      }
    </Fragment>
  )
}

GroupesPerso.propTypes = {
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

// groupesLoader a déjà du ensureLogged
export default connect(null, mapDispatchToProps)(
  groupesLoader(GroupesPerso)
)
