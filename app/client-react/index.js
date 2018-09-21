// inclusion des polyfills:
import '@babel/polyfill'
import 'whatwg-fetch'
import 'url-polyfill'

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
