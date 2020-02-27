/* version module du client react (cf index.es5.js pour les ajouts destinés aux vieux navigateurs) */
import {createElement} from 'react'
import {render} from 'react-dom'
import App from './App'
import checkBrowser from './utils/checkBrowser'

checkBrowser()

const homeContentContainer = document.getElementById('homeContent')
const homeContent = homeContentContainer.innerHTML
document.body.removeChild(homeContentContainer)
render(createElement(App), document.getElementById('root'))

export default homeContent
