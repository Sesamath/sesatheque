import React, {Component} from 'react'
import GroupPublicationEditor from './GroupPublicationEditor'
import {Field} from 'redux-form'

class GroupContainer extends Component {
  constructor () {
    super()

    // Temp
    let personneAPI = {
      groupesMembre: ['sesamath indexation', 'groupe de test'],
      groupesSuivis: ['test', 'groupe de test']
    }
    const groupes = [...personneAPI.groupesMembre, ...personneAPI.groupesSuivis]
    const uniqueGroupes = groupes.filter((v, i, a) => a.indexOf(v) === i)
    // TEMP

    this.state = {
      ...personneAPI,
      groupes: uniqueGroupes
    }
  }

  addGroup () {
    // ToDo
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
              name="createGroup"
              component="input"
              type="text"
            />
          </label>
          <label>
            <br />
            <button
              type="button"
              className="btn--success"
              onClick={this.addGroup.bind(this)}>Créer les groupes</button>
          </label>
        </div>
      </fieldset>
    )
  }
}

export default GroupContainer
