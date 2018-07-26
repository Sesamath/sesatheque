import PropTypes from 'prop-types'
import React, {Fragment} from 'react'
import {connect} from 'react-redux'

const origUrl = 'https://ressources.sesamath.net/coll/'

const getUrl = (parametres) => {
  const code = parametres && parametres.ouvrage_code
  if (code) return `https://zoneur.sesamath.net/?sel_ouvrage=${code}`
  return 'https://zoneur.sesamath.net'
}

const EditorExternal = ({
  parametres
}) => {
  const url = getUrl(parametres)

  return (
    <Fragment>
      <p>Cette ressource ne peut pas être éditée ici, vous devez le faire via <a href={url}>{url}</a>.</p>
      <p>(Le lien ci-dessus pointe sur le découpage de l’atome dans le manuel, mais la source originale est sur <a href={origUrl}>{origUrl}</a>)</p>
    </Fragment>
  )
}

EditorExternal.propTypes = {
  parametres: PropTypes.object
}

const mapStateToProps = ({ressource: {parametres}}) => ({parametres})

export default connect(mapStateToProps)(EditorExternal)
