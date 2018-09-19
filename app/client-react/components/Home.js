import React from 'react'
import homeContent from '..'

// @todo récupérer le contenu de _private/home.inc.html s'il existe (à faire au build)

const Home = () => (
  <div>
    <h1>Bienvenue sur cette Sésathèque</h1>
    <div dangerouslySetInnerHTML={{__html: homeContent}}></div>
  </div>
)

export default Home
