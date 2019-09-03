/* global db print */
db.EntityRessource.find({type: 'ec2'}).sort({dateCreation: 1}).forEach(r => {
  let msg
  const data = JSON.parse(r._data)
  if (data.parametres) {
    if (data.parametres.fichier) msg = `fichier ${data.parametres.fichier}`
    else if (data.parametres.swf) msg = `swf ${data.parametres.swf}`
    else msg = 'none ' + JSON.stringify(data.parametres)
  } else {
    msg = 'noParameters'
  }
  print(r._id, msg, r.dateCreation, r.titre)
})
