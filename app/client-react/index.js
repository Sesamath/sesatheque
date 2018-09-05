// inclusion des polyfills:
import 'babel-polyfill'
import 'whatwg-fetch'

import {createElement} from 'react'
import {render} from 'react-dom'
import App from './App'

render(createElement(App), document.getElementById('root'))
