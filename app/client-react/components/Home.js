import React from 'react'
import homeContent from '..'

// homeContent est le contenu mis dans le source initial, mais pas à sa place,
// il est récupéré et mis de coté avant suppression du dom au chargement de
// l'appli (cf app/client-react/index.js)

const Home = () => (
  <div>
    <h1>Bienvenue sur cette Sésathèque</h1>
    <div dangerouslySetInnerHTML={{__html: homeContent}}></div>
  </div>
)

export default Home
