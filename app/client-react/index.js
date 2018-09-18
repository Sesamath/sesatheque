// inclusion des polyfills:
import '@babel/polyfill'
import 'whatwg-fetch'

import {createElement} from 'react'
import {render} from 'react-dom'
import App from './App'
import checkBrowser from './utils/checkBrowser'

checkBrowser()
render(createElement(App), document.getElementById('root'))
