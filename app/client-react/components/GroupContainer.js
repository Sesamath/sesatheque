import PropTypes from 'prop-types'
import React from 'react'
import {connect} from 'react-redux'
import {NavLink} from 'react-router-dom'
import {Fields} from 'redux-form'
import GroupesSelector from './GroupesSelector'

const GroupContainer = ({groupesList}) => {
  if (groupesList.length) {
    return (
      <fieldset>
        <Fields
          names={['groupes', 'groupesAuteurs']}
          component={GroupesSelector}
          groupesList={groupesList}
        />
        <div className="alert--info">Vous pouvez gérer vos groupes depuis la page <NavLink to="/groupes/perso">Mes groupes</NavLink>.</div>
      </fieldset>
    )
  }
  return (
    <p>Vous n’êtes membre d’aucun groupe (pour y publier cette ressource ou déléguer des droits de modification)</p>
  )
}

GroupContainer.propTypes = {
  groupesList: PropTypes.arrayOf(PropTypes.string)
}

const mapStateToProps = ({session}) => ({
  groupesList: (session && session.personne && session.personne.groupesMembre) || []
})

export default connect(mapStateToProps)(GroupContainer)
