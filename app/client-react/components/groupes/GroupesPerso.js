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
 * Composant qui liste les gestionnaires d'un groupe
 * @type {PureComponent}
 * @param {object} props
 * @param {string[]} props.gestionnairesNames liste des noms
 */
const Admins = ({
  gestionnairesNames
}) => {
  // cf versions avant 2019-05-17 pour avoir aussi l'affichage des oid (il vaudrait mieux les pids
  // vu que c'est ça qu'il faut saisir pour ajouter des gestionnaires, mais on préfère ne jamais
  // les afficher pour obliger à demander le pid à qqun avant de le mettre gestionnaire)
  if (!gestionnairesNames || !gestionnairesNames.length) return (<p>Aucun gestionnaire</p>)
  if (gestionnairesNames.length === 1) return (<p>Gestionnaire&nbsp;: {gestionnairesNames[0]}</p>)
  return (
    <ul className="admins">Gestionnaires :&nbsp;
      {gestionnairesNames.map((name, index) => (<li key={index}>{name}</li>))}
    </ul>
  )
}

Admins.propTypes = {
  gestionnairesNames: PropTypes.arrayOf(PropTypes.string)
}

/**
 * Composant qui liste les liens d'un groupe dont on est gestionnaire
 * @type {PureComponent}
 * @param {object} props
 * @param {function} props.followGroupe action redux pour suivre
 * @param {function} props.joinGroupe action redux pour devenir membre
 * @param {function} props.deleteGroupe action redux
 * @param {string} props.nom nom du groupe
 * @param {string[]} props.groupesMembre
 * @param {string[]} props.groupesSuivis
 */
const AdminLinksInner = ({
  nom,
  groupesMembre,
  groupesSuivis,
  deleteGroupe,
  joinGroupe,
  followGroupe
}) => (
  <span className="links">
    <a href="#" onClick={() => deleteGroupe(nom)} className="btn--info"><i className="fa fa-trash"></i>Supprimer</a>
    <NavLink to={`/groupe/editer/${encodeURIComponent(nom)}`} className="btn--info"><i className="fa fa-edit"></i>Modifier</NavLink>
    <NavLink
      className="btn--info"
      to={{
        pathname: '/ressource/rechercher',
        hash: 'results',
        search: `groupes=${encodeURIComponent(nom)}`
      }}><i className="fa fa-bookmark"></i> Voir les ressources du groupe</NavLink>
    {groupesMembre.includes(nom)
      ? null // le lien quitter sera dans la liste des groupesMembre
      : (<button className="btn--info" onClick={() => joinGroupe(nom)}><i className="fa fa-sign-in-alt"></i>Rejoindre</button>)
    }
    {groupesSuivis.includes(nom)
      ? null // le lien "ne plus suivre sera dans la liste des groupesSuivis
      : (<button className="btn--info" onClick={() => followGroupe(nom)}><i className="fa fa-eye"></i>Suivre</button>)
    }
  </span>
)

AdminLinksInner.propTypes = {
  nom: PropTypes.string,
  groupesMembre: PropTypes.arrayOf(PropTypes.string),
  groupesSuivis: PropTypes.arrayOf(PropTypes.string),
  deleteGroupe: PropTypes.func,
  joinGroupe: PropTypes.func,
  followGroupe: PropTypes.func
}

const AdminLinks = connect(null, {
  deleteGroupe,
  joinGroupe,
  followGroupe
})(AdminLinksInner)

/**
 * Composant qui liste les liens d'un groupe dont on est membre
 * @type {PureComponent}
 * @param {object} props
 * @param {function} props.leaveGroupe action redux pour quitter
 * @param {string} props.nom nom du groupe
 */
const MemberLinksInner = ({nom, leaveGroupe}) => (
  <span className="links">
    <NavLink
      className="btn--info"
      to={{
        pathname: '/ressource/rechercher',
        hash: 'results',
        search: `groupes=${encodeURIComponent(nom)}`
      }}><i className="fa fa-bookmark"></i> Voir les ressources du groupe</NavLink>
    <button className="btn--info" onClick={() => leaveGroupe(nom)}><i className="fa fa-sign-out-alt"></i>Quitter le groupe</button>
  </span>
)

MemberLinksInner.propTypes = {
  nom: PropTypes.string,
  leaveGroupe: PropTypes.func
}

const MemberLinks = connect(null, {
  leaveGroupe
})(MemberLinksInner)

/**
 * Composant qui liste les liens d'un groupe dont on est suiveur
 * @type {PureComponent}
 * @param {object} props
 * @param {function} props.ignoreGroupe action redux pour se désabonner
 * @param {string} props.nom nom du groupe
 */
const FollowLinksInner = ({nom, ignoreGroupe}) => (
  <span className="links">
    <NavLink
      className="btn--info"
      to={{
        pathname: '/ressource/rechercher',
        hash: 'results',
        search: `groupes=${encodeURIComponent(nom)}`
      }}><i className="fa fa-bookmark"></i> Voir les ressources du groupe
    </NavLink>
    <button className="btn--info" onClick={() => ignoreGroupe(nom)}><i className="fa fa-eye-slash"></i>Ne plus suivre le groupe</button>
  </span>
)

FollowLinksInner.propTypes = {
  nom: PropTypes.string,
  ignoreGroupe: PropTypes.func
}

const FollowLinks = connect(null, {
  ignoreGroupe
})(FollowLinksInner)

// la fct générique d'affichage d'un groupe
const Groupe = ({
  groupe: {
    nom,
    description,
    ouvert,
    public: isPublic,
    gestionnaires,
    gestionnairesNames
  },
  GroupeLinks,
  ...others
}) => (
  <li key={nom}>
    <strong>{nom}</strong> ({ouvert ? 'ouvert' : 'fermé'} {isPublic ? 'public' : 'privé'})
    <pre>{description}</pre>
    <Admins gestionnairesNames={gestionnairesNames} />
    <GroupeLinks nom={nom} {...others} />
  </li>
)

Groupe.propTypes = {
  groupe: PropTypes.shape({
    nom: PropTypes.string.isRequired,
    description: PropTypes.string,
    ouvert: PropTypes.bool,
    public: PropTypes.bool,
    gestionnaires: PropTypes.arrayOf(PropTypes.string),
    gestionnairesNames: PropTypes.arrayOf(PropTypes.string)
  }).isRequired,
  GroupeLinks: PropTypes.func
}

// la fct générique d'affichage d'une liste
const List = ({list, component, groupes, ...others}) => {
  const missing = list.filter(nom => !groupes[nom])
  if (missing.length) console.error(Error(`l'api a renvoyé des listes incohérentes, il manque les groupes « ${missing.join(' », « ')} »`))
  return (
    <ul className="liste">
      {missing.map(nom => (
        <li key={nom}>Le groupe {nom} a été supprimé</li>
      ))}
      {list.filter(nom => groupes[nom]).map(nom => (
        <Groupe
          key={nom}
          groupe={groupes[nom]}
          GroupeLinks={component}
          {...others}
        />
      ))}
    </ul>
  )
}

List.propTypes = {
  list: PropTypes.array,
  component: PropTypes.func,
  groupes: PropTypes.object
}

/**
 * Composant qui liste "Mes groupes" (auth)
 * @type {PureComponent}
 * @param {object} props
 * @param {string[]} props.groupesAdmin fourni par groupesLoader
 * @param {string[]} props.groupesMembre fourni par groupesLoader
 * @param {string[]} props.groupesSuivis fourni par groupesLoader
 * @param {Groupe[]} props.groupes fourni par groupesLoader
 */
const GroupesPerso = ({
  groupes,
  groupesAdmin,
  groupesMembre,
  groupesSuivis
}) => (
  <Fragment>
    <h1>Mes groupes</h1>
    <section className="groupHeader">
      <NavLink to="/groupe/ajouter" className="fr btn--success">
        <i className="fa fa-plus"></i>
        Créer un groupe
      </NavLink>
      <ul>
        <li>
          <NavLink to="/groupes/ouverts">Voir les groupes ouverts</NavLink>
          <span className="remarque"> (pour éventuellement en devenir membre)</span>
        </li>
        <li>
          <NavLink to="/groupes/publics">Voir les groupes publics</NavLink>
          <span className="remarque"> (pour éventuellement suivre leurs publications)</span>
        </li>
      </ul>
    </section>
    <section className="groupes">
      <h2>Groupes dont je suis gestionnaire</h2>
      {groupesAdmin.length
        ? (<List
          groupes={groupes}
          list={groupesAdmin}
          component={AdminLinks}
          groupesMembre={groupesMembre}
          groupesSuivis={groupesSuivis}
        />)
        : (<p>Vous n’êtes gestionnaire d’aucun groupe.</p>)
      }

      <h2>Groupes dont je suis membre</h2>
      {groupesMembre.length
        ? (<List
          groupes={groupes}
          list={groupesMembre}
          component={MemberLinks}
        />)
        : (<p>Vous n’êtes membre d’aucun groupe.</p>)
      }

      <h2>Groupes suivis</h2>
      {groupesSuivis.length
        ? (<List
          groupes={groupes}
          list={groupesSuivis}
          component={FollowLinks}
        />)
        : (<p>Vous ne suivez les publications d’aucun groupe.</p>)
      }
    </section>
  </Fragment>
)

GroupesPerso.propTypes = {
  groupes: PropTypes.object.isRequired,
  groupesAdmin: PropTypes.arrayOf(PropTypes.string).isRequired,
  groupesMembre: PropTypes.arrayOf(PropTypes.string).isRequired,
  groupesSuivis: PropTypes.arrayOf(PropTypes.string).isRequired
}

// groupesLoader a déjà du ensureLogged
export default groupesLoader(GroupesPerso)
