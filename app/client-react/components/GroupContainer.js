import React from 'react'
import {Fields} from 'redux-form'
import AddGroup from './AddGroup'
import GroupesSelector from './GroupesSelector'

const GroupContainer = () => (
  <fieldset>
    <Fields
      names={['groupes', 'groupesAuteurs']}
      component={GroupesSelector}
    />
    <AddGroup />
  </fieldset>
)

export default GroupContainer
