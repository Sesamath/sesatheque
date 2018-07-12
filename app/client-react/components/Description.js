import moment from 'moment'
import PropTypes from 'prop-types'
import React, {Fragment} from 'react'
import {NavLink} from 'react-router-dom'
import resourceLoader from '../hoc/resourceLoader'
import NavMenu from './NavMenu'
import {formats, listes, labels} from '../../server/ressource/config'
import './Description.scss'

const {jour: dateFormat} = formats

const newlineRegex = /(\n)/g

const nl2br = (str) => {
  return str.split(newlineRegex).map((part, index) => {
    if (part.match(newlineRegex)) return <br key={index} />
    return part
  })
}

const restrictionToString = {
  0: 'Public',
  1: 'prof',
  2: 'groupe',
  3: 'auteur'
}

const getRestriction = (restriction) => {
  if (restriction == null || restriction === 0) return restrictionToString[0]

  return `${labels.restriction} : ${restrictionToString[restriction] || 'inconnue'}`
}

/**
 * Page de description d'une ressource
 */
const Description = ({
  ressource: {
    _droits: droits,
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
    dataUrl,
    _enfants = [],
    _auteurs = [],
    _contributeurs = [],
    _relations = [],
    groupes
  }
}) => (
  <Fragment>
    <NavMenu
      droits={droits}
      ressourceOid={oid}
      titre={titre}
    />
    <div className="block ressource">
      <span className="publie btn fr tag">{publie ? 'Publié' : 'NON PUBLIÉ'}</span>
      <span className="restriction btn fr tag">{getRestriction(restriction)}</span>

      <section className="grid-5 has-gutter">
        <div className="txtright">Oid :</div>
        <div className="col-4">
          {oid} <i>({origine}{ idOrigine ? `/${idOrigine}` : null},&nbsp;
            {labels.type} {type},&nbsp;{labels.version} {version}
            {dataUrl ? (
              <NavLink
                to={dataUrl}
                target="_blank"
              >json</NavLink>
            ) : null})</i>
        </div>

        {aliasOf && aliasOf.url ? (
          <Fragment>
            <div className="txtright"><strong>Alias de</strong></div>
            <div className="col-4">
              <NavLink
                to={aliasOf.url}
                target="_blank"
              >{aliasOf.value}</NavLink>
            </div>
          </Fragment>
        ) : null}

        <div className="txtright">{labels.dateCreation} :</div>
        <div className="col-4">{moment(dateCreation).format(dateFormat)}</div>

        <div className="txtright">{labels.dateMiseAJour} :</div>
        <div className="col-4">{moment(dateMiseAJour).format(dateFormat)}</div>

        <div className="txtright">{labels.langue} :</div>
        <div className="col-4">{listes.langue[langue]}</div>

        <div className="txtright">{labels.niveaux} :</div>
        <div className="col-4">{niveaux.map((niveau) => listes.niveaux[niveau]).join(', ')}</div>

        <div className="txtright">{labels.categories} :</div>
        <div className="col-4">{categories.map((categorie) => listes.categories[categorie]).join(', ')}</div>

        <div className="txtright">{labels.typePedagogiques} :</div>
        <div className="col-4">{typePedagogiques.map((typePedagogique) => listes.typePedagogiques[typePedagogique]).join(', ')}</div>

        <div className="txtright">{labels.typeDocumentaires} :</div>
        <div className="col-4">{typeDocumentaires.map((typeDocumentaire) => listes.typeDocumentaires[typeDocumentaire]).join(', ')}</div>

        <div className="txtright">{labels.resume} :</div>
        <div className="col-4">{nl2br(resume)}</div>

        <div className="txtright">{labels.description} :</div>
        <div className="col-4">{nl2br(description)}</div>

        <div className="txtright">{labels.commentaires} :</div>
        <div className="col-4">{nl2br(commentaires)}</div>

        {_enfants.length ? (
          <Fragment>
            <div className="txtright">Liens vers les enfants :</div>
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

        {_auteurs.length ? (
          <Fragment>
            <div className="txtright">{labels.auteurs} :</div>
            <div className="col-4">
              <ul>
                {_auteurs.map(auteur => (
                  <li key={auteur}>{auteur}</li>
                ))}
              </ul>
            </div>
          </Fragment>
        ) : null}

        {_contributeurs.length ? (
          <Fragment>
            <div className="txtright">{labels.contributeurs} :</div>
            <div className="col-4">
              <ul>
                {_contributeurs.map(contributeur => (
                  <li key={contributeur}>{contributeur}</li>
                ))}
              </ul>
            </div>
          </Fragment>
        ) : null}

        {_relations.length ? (
          <Fragment>
            <div className="txtright">{labels.relations} :</div>
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

        {groupes.length ? (
          <Fragment>
            <div className="txtright">{labels.groupes} :</div>
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

Description.propTypes = {
  /** La ressource dont on veut afficher la description */
  ressource: PropTypes.object
}

export default resourceLoader(Description)
