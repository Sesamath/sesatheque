import PropTypes from 'prop-types'
import React, {Fragment} from 'react'
import NavMenu from './NavMenu'
import resourceLoader from './resourceLoader'

const Preview = ({
  ressource: {oid: ressourceOid, titre}
}) => (
  <Fragment>
    <h1 className="fl">Aperçu de la ressource {titre}</h1>
    <NavMenu ressourceOid={ressourceOid} />
    <iframe src={`/ressource/voir/${ressourceOid}`} />
  </Fragment>
)

Preview.propTypes = {
  ressource: PropTypes.shape({
    oid: PropTypes.string,
    titre: PropTypes.string
  })
}

export default resourceLoader(Preview)
