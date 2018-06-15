import React, { Component } from 'react'
import { connect } from 'react-redux'
import { formValues, Field } from 'redux-form'
import GroupPublicationEditor from './GroupPublicationEditor'
import { addGroupes } from '../actions/personne'

class GroupContainer extends Component {
  constructor (props) {
    super(props)

    // Temp
    const user = this.props.user || { groupesMembre: [], groupesSuivis: [] }
    const groupes = [...user.groupesMembre, ...user.groupesSuivis]
    const uniqueGroupes = groupes.filter((v, i, a) => a.indexOf(v) === i)
    // TEMP

    this.state = {
      ...user,
      groupes: uniqueGroupes
    }
  }

  render () {
    return (
      <fieldset>
        <div>
          <label>Publication dans les groupes</label>
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Nom du groupe</th>
                <th scope="col">Publié dans ce groupe</th>
                <th scope="col">Les membres du groupe peuvent modifier cette ressource</th>
              </tr>
            </thead>
            <tbody>
              {
                this.state.groupes.map((groupeName, index) => (
                  <GroupPublicationEditor
                    key={index}
                    index={index}
                    name={groupeName}
                    disabled={this.state.groupesMembre.indexOf(groupeName) === -1}
                  />
                ))
              }
            </tbody>
          </table>
        </div>
        <div className="grid-3">
          <label>
            Nouveaux groupes à créer (à séparer par des virgules)
            <Field
              name="groupNames"
              component="input"
              type="text"
            />
          </label>
          <label>
            <br />
            <button
              type="button"
              className="btn--success"
              onClick={() => this.props.addGroupes(this.props.groupNames)}>Créer les groupes</button>
          </label>
        </div>
      </fieldset>
    )
  }
}

const mapStateToProps = (state) => ({
  user: state.personne
})

GroupContainer = connect(
  mapStateToProps,
  { addGroupes }
)(GroupContainer)

export default formValues({
  groupNames: 'groupNames'
})(GroupContainer)
