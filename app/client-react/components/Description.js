import moment from 'moment'
import PropTypes from 'prop-types'
import React, {Fragment} from 'react'
import {NavLink} from 'react-router-dom'
import resourceLoader from './resourceLoader'
import NavMenu from './NavMenu'
import {formats, listes, labels} from '../../server/ressource/config'

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

const Description = ({
  initialValues: {
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
    <h1 className="fl">{titre}</h1>
    <NavMenu ressourceOid={oid} />
    <div className="block ressource">
      <span className="publie">
        {publie ? 'Publié' : 'NON PUBLIÉ'}
      </span>
      <span className="restriction">
        {getRestriction(restriction)}
      </span>
      oid : {oid} ({origine}{ idOrigine ? `/${idOrigine}` : null},&nbsp;
      {labels.type} {type},&nbsp;{labels.version} {version}
      {dataUrl ? (
        <NavLink
          to={dataUrl}
          target="_blank"
        >json</NavLink>
      ) : null}
      )<br />
      {aliasOf && aliasOf.url ? (
        <div>
          <strong>Alias de</strong>
          <NavLink
            to={aliasOf.url}
            target="_blank"
          >{aliasOf.value}</NavLink>
        </div>
      ) : null}
      {labels.dateCreation} : {moment(dateCreation).format(dateFormat)}<br />
      {labels.dateMiseAJour} : {moment(dateMiseAJour).format(dateFormat)}<br />
      {labels.langue} : {listes.langue[langue]}<br />
      {labels.niveaux} : {
        niveaux.map((niveau) => listes.niveaux[niveau]).join(', ')
      }<br />
      {labels.categories} : {
        categories.map((categorie) => listes.categories[categorie]).join(', ')
      }<br />
      {labels.typePedagogiques} : {
        typePedagogiques.map((typePedagogique) => listes.typePedagogiques[typePedagogique]).join(', ')
      }<br />
      {labels.typeDocumentaires} : {
        typeDocumentaires.map((typeDocumentaire) => listes.typeDocumentaires[typeDocumentaire]).join(', ')
      }<br />

      <p>{labels.resume} : {nl2br(resume)}</p>
      <p>{labels.description} : {nl2br(description)}</p>
      <p>{labels.commentaires} : {nl2br(commentaires)}</p>
      {_enfants.length ? (
        <div>
          <ul>Liens vers les enfants :
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
          <p>{labels.enfants} :
            <pre>{JSON.stringify(_enfants)}</pre>
          </p>
        </div>
      ) : null}
      {_auteurs.length ? (
        <ul>{labels.auteurs} :
          {_auteurs.map(auteur => (
            <li key={auteur}>{auteur}</li>
          ))}
        </ul>
      ) : null}
      {_contributeurs.length ? (
        <ul>{labels.contributeurs} :
          {_contributeurs.map(contributeur => (
            <li key={contributeur}>{contributeur}</li>
          ))}
        </ul>
      ) : null}
      {_relations.length ? (
        <ul className="relations">{labels.relations}
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
      ) : null}
      {groupes.length ? (
        <ul className="groupes">{labels.groupes}
          {groupes.map(groupe => (
            <li key={groupe}>{groupe}</li>
          ))}
        </ul>
      ) : null}

    </div>
  </Fragment>
)

Description.propTypes = {
  initialValues: PropTypes.shape({})
}

export default resourceLoader(Description)
