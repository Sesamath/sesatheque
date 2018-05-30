import React, {Component} from 'react'
import {GET, POST} from '../utils/httpMethods'

const resourceLoader = (WrappedComponent) => {
  return class extends Component {
    constructor(props) {
      super(props)
      const {match: {params: {ressourceOid}}} = props
      this.ressourceOid = ressourceOid
      this.state = {
        ressource: null
      }
    }

    onSubmit(body) {
      return POST(`/api/ressource`, {body})
    }

    componentDidMount() {
      GET(`/api/ressource/${this.ressourceOid}`)
        .then((response) => response.json())
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
        />
      )
    }
  }
}

export default resourceLoader
