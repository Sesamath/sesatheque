import React, {Component} from 'react'
import {GET, POST} from '../utils/httpMethods'

const resourceLoader = (WrappedComponent) => {
  return class extends Component {
    constructor(props) {
      super(props)
      const {match: {params: {ressourceOid}}} = props
      this.ressourceOid = ressourceOid
      this.state = {
        ressource: null,
        saveError: null
      }
      this.onSubmit = this.onSubmitInner.bind(this)
    }

    onSubmitInner(body) {
      return POST(`/api/ressource`, {body})
        .catch(saveError => {
          this.setState({
            saveError
          }, () => {
            setTimeout(() => this.setState({
              saveError: null
            }), 5000)
          })
        })
    }

    componentDidMount() {
      GET(`/api/ressource/${this.ressourceOid}`)
        .then((ressource) => {
          this.setState({
            ressource
          })
        })
    }

    render() {
      if (this.state.ressource === null) return null

      return (
        <WrappedComponent
          initialValues={this.state.ressource}
          onSubmit={this.onSubmit}
          {...this.props}
          saveError={this.state.saveError}
        />
      )
    }
  }
}

export default resourceLoader
