import {baseId, baseUrl, sesatheques} from '../../server/config'
import {addSesatheque} from 'sesatheque-client/src/sesatheques'

// init de cette sesatheque et des autres pour sesatheque-client
addSesatheque(baseId, baseUrl)
if (sesatheques.length) {
  sesatheques.forEach(({baseId, baseUrl}) => addSesatheque(baseId, baseUrl))
}
