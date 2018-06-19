import moment from 'moment'
import PropTypes from 'prop-types'
import React, {Fragment} from 'react'
import {flowRight} from 'lodash'
import resourceLoader from './resourceLoader'
import NavMenu from './NavMenu'

const Description = ({
  initialValues: {
    titre,
    oid,
    publie,
    dateCreation,
    dateMiseAJour
  }
}) => {

  return (
    <Fragment>
      <h1 className="fl">{titre}</h1>
      <NavMenu ressourceOid={oid} />
      <div className="block ressource">
        <span className="publie">
          {publie ? 'Publié' : 'NON PUBLIÉ'}
        </span>
        <span className="restriction"></span>
        date de création : {moment(dateCreation).format('DD/MM/YYYY')}<br />
        date de mise à jour : {moment(dateMiseAJour).format('DD/MM/YYYY')}<br />
      </div>
    </Fragment>
  )
}

export default flowRight([
  resourceLoader,
])(Description)
