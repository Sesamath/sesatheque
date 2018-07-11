import PropTypes from 'prop-types'
import React, {Fragment} from 'react'
import groupeLoader from '../hoc/groupeLoader'

const GroupeDescription = ({
  description,
  gestionnaires,
  nom,
  public: publique,
  ouvert
}) => (
  <Fragment>
    <h1>Description du groupe</h1>
    <div className="groupe">
      <h1 id="titre">{nom}</h1>
      <span className="links">
        <a href="/groupe/quitter/groupe%20test">Quitter</a>
        <a href="/groupe/ignorer/groupe%20test">Ne plus suivre</a>
        <a href="/groupe/modifier/groupe%20test">Modifier</a>
        <a href="/groupe/supprimer/groupe%20test">Supprimer</a>
      </span>
      <ul>
        <li>Nom :&nbsp;{nom}</li>
        <li>Description :&nbsp;<pre>{description}</pre></li>
        <li>Ouvert à tous :&nbsp;
          {ouvert ? (<Fragment>
            oui <span className="remarque">(tout le monde peut en devenir membre)</span>
          </Fragment>) : (<Fragment>
            non <span className="remarque">(seul les gestionnaires peuvent ajouter des membres)</span>
          </Fragment>)}
        </li>
        <li>Public :&nbsp;
          {publique ? (<Fragment>
            oui <span className="remarque">(tout le monde peut suivre les publications)</span>
          </Fragment>) : (<Fragment>
            non <span className="remarque">(seuls les membres peuvent suivre les publications)</span>
          </Fragment>)}
        </li>
        <li>
          <ul>
            Gestionnaire(s) :&nbsp;
            <span className="remarque">Les gestionnaires peuvent modifier les propriétés du groupe et y ajouter des membres</span>
            {gestionnaires.map(pid => (
              <li key={pid}>Fill complete name <span className="remarque">{pid}</span>
              </li>
            ))}
          </ul>
        </li>
        <li>
          Ressources publiées dans ce groupe
          <ul className="liste">
            <p>To be done!!</p>
          </ul>
        </li>
      </ul>
    </div>
  </Fragment>
)

export default groupeLoader(GroupeDescription)
