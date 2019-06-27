// inclusion des polyfills
// cf rmq dans app/client/page/index.js
import 'core-js/stable'
import 'regenerator-runtime/runtime'

import 'whatwg-fetch'

import {createElement} from 'react'
import {render} from 'react-dom'
import App from './App'
import checkBrowser from './utils/checkBrowser'

checkBrowser()

const homeContentContainer = document.getElementById('homeContent')
const homeContent = homeContentContainer.innerHTML
document.body.removeChild(homeContentContainer)
export default homeContent

render(createElement(App), document.getElementById('root'))
