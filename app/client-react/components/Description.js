import moment from 'moment'
import PropTypes from 'prop-types'
import React, {Fragment} from 'react'
import {NavLink} from 'react-router-dom'
import resourceLoader from '../hoc/resourceLoader'
import NavMenu from './NavMenu'
import {formats, listes, labels} from '../../server/ressource/config'
import {baseId} from '../../server/config'
import {getRestrictionString} from '../utils/labels'

import './Description.scss'

const {jour: dateFormat} = formats

/**
 * Remplace les \n par des <br key="i" />
 * @private
 * @param {string} str
 * @return du jsx
 */
const nl2br = (str) => {
  if (!str) return null
  // on ajoute des parenthèses capturantes dans la regex pour avoir les \n comme élément de tableau
  // (sinon un split('\n') suffisait mais ça obligeait à mettre du <Fragment> dans le retour du map)
  return str.split(/(\n)/g).map((part, index) => {
    return (part === '\n') ? (<br key={index} />) : part
  })
}

/**
 * Page de description d'une ressource
 * @type {PureComponent}
 * @return {Fragment}
 */
export const Description = ({
  ressource: {
    _droits: droits,
    _urls,
    titre,
    oid,
    publie,
    restriction,
    aliasOf,
    dateCreation,
    dateMiseAJour,
    langue,
    niveaux,
    categories,
    typePedagogiques,
    typeDocumentaires,
    resume,
    description,
    commentaires,
    origine,
    idOrigine,
    type,
    version,
    _enfants = [],
    _auteurs = [],
    _contributeurs = [],
    _groupesAuteurs = [],
    _relations = [],
    groupes = []
  }
}) => {
  // on précalcule quelques flags & labels pour la lisibilité

  // origine/idOrigine si y'a
  const externalId = (origine !== baseId && idOrigine) ? (<i> ({origine}/{idOrigine})</i>) : null

  // lien en target _blank
  const getLink = (type, label) => {
    const url = _urls[type]
    if (!url) return null
    // NavLink n'accepte que des urls locales
    if (url.startsWith('/')) return (<NavLink to={url} target="_blank">{label}</NavLink>)
    return (<a href={url} target="_blank" rel="noopener noreferrer">{label}</a>)
  }

  return (
    <Fragment>
      <NavMenu
        droits={droits}
        ressourceOid={oid}
        titre={titre + (aliasOf ? ' (alias)' : '')}
      />
      <div className="block ressource">
        <span className="btn fr tag">{publie ? 'Publié' : 'NON PUBLIÉ'}</span>
        <span className="btn fr tag">{labels.restriction}&nbsp;:&nbsp;{getRestrictionString({restriction, groupes})}</span>

        <section className="grid-5 has-gutter clear-right">
          <div className="txtbold">{labels.oid}&nbsp;:</div>
          <div className="col-4">
            {oid}{externalId} {getLink('dataUrl', 'json')}
          </div>

          <div className="txtbold">{labels.type}&nbsp;:</div>
          <div className="col-4">{type}</div>
          <div className="txtbold">{labels.version}&nbsp;:</div>
          <div className="col-4">{version}</div>

          {aliasOf ? (
            <Fragment>
              <div className="txtbold"><strong>Alias de</strong></div>
              <div className="col-4">{getLink('describeUrl', titre)}</div>
            </Fragment>
          ) : (
            <Fragment>
              <div className="txtbold">{labels.dateCreation}&nbsp;:</div>
              <div className="col-4">{moment(dateCreation).format(dateFormat)}</div>

              <div className="txtbold">{labels.dateMiseAJour}&nbsp;:</div>
              <div className="col-4">{moment(dateMiseAJour).format(dateFormat)}</div>

              <div className="txtbold">{labels.langue}&nbsp;:</div>
              <div className="col-4">{listes.langue[langue]}</div>

              <div className="txtbold">{labels.niveaux}&nbsp;:</div>
              <div className="col-4">{niveaux.map((niveau) => listes.niveaux[niveau]).join(', ')}</div>

              <div className="txtbold">{labels.typePedagogiques}&nbsp;:</div>
              <div className="col-4">{typePedagogiques.map((typePedagogique) => listes.typePedagogiques[typePedagogique]).join(', ')}</div>

              <div className="txtbold">{labels.typeDocumentaires}&nbsp;:</div>
              <div className="col-4">{typeDocumentaires.map((typeDocumentaire) => listes.typeDocumentaires[typeDocumentaire]).join(', ')}</div>
            </Fragment>
          )}

          <div className="txtbold">{labels.categories}&nbsp;:</div>
          <div className="col-4">{categories.map((categorie) => listes.categories[categorie]).join(', ')}</div>

          <div className="txtbold">{labels.resume}&nbsp;:</div>
          <div className="col-4">{nl2br(resume)}</div>

          <div className="txtbold">{labels.description}&nbsp;:</div>
          <div className="col-4">{nl2br(description)}</div>

          <div className="txtbold">{labels.commentaires}&nbsp;:</div>
          <div className="col-4">{nl2br(commentaires)}</div>

          {_enfants.length ? (
            <Fragment>
              <div className="txtbold">Liens vers les enfants&nbsp;:</div>
              <div className="col-4">
                <ul>
                  {_enfants.map(({url, titre}, index) => (
                    <li key={index.toString()}>
                      {url ? (
                        <NavLink
                          to={url}
                          target="_blank"
                        >
                          {titre}
                        </NavLink>
                      ) : titre}
                    </li>
                  ))}
                </ul>
                <div>{labels.enfants} :
                  <pre>{JSON.stringify(_enfants)}</pre>
                </div>
              </div>
            </Fragment>
          ) : null}

          {!aliasOf && _auteurs.length ? (
            <Fragment>
              <div className="txtbold">{labels.auteurs}&nbsp;:</div>
              <div className="col-4">
                {_auteurs.length > 1 ? (
                  <ul>
                    {_auteurs.map(auteur => (
                      <li key={auteur}>{auteur}</li>
                    ))}
                  </ul>
                ) : _auteurs[0]}
              </div>
            </Fragment>
          ) : null}

          {!aliasOf && _contributeurs.length ? (
            <Fragment>
              <div className="txtbold">{labels.contributeurs}&nbsp;:</div>
              <div className="col-4">
                <ul>
                  {_contributeurs.map(contributeur => (
                    <li key={contributeur}>{contributeur}</li>
                  ))}
                </ul>
              </div>
            </Fragment>
          ) : null}

          {!aliasOf && _relations.length ? (
            <Fragment>
              <div className="txtbold">{labels.relations}&nbsp;:</div>
              <div className="col-4">
                <ul className="relations">
                  {_relations.map(({predicat, rid, titre, type, url}) => (
                    <li key={rid}>
                      <img src={`/plugins/${type}/${type}.gif`} />
                      {predicat}
                      <NavLink
                        to={url}
                        target="_blank"
                      >
                        {titre}
                      </NavLink>
                      ({rid})
                    </li>
                  ))}
                </ul>
              </div>
            </Fragment>
          ) : null}

          {!aliasOf && groupes.length ? (
            <Fragment>
              <div className="txtbold">{labels.groupes}&nbsp;:</div>
              <div className="col-4">
                <ul className="groupes">
                  {groupes.map(groupe => (
                    <li key={groupe}>{groupe}</li>
                  ))}
                </ul>
              </div>
            </Fragment>
          ) : null}

        </section>
      </div>
    </Fragment>
  )
}

Description.propTypes = {
  /** La ressource dont on veut afficher la description */
  ressource: PropTypes.object
}

export default resourceLoader(Description)
