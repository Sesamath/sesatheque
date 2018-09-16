const xmlParser = new DOMParser()

const validate = ({parametres: {url, xml}}, errors) => {
  if (!url && !xml) {
    errors.parametres = errors.parametres || {}
    errors.parametres.xml = errors.parametres.url = 'Il faut renseigner l’un de ces deux champs'
    return
  }

  if (xml) {
    const xmlDOM = xmlParser.parseFromString(xml, 'text/xml')
    const error = xmlDOM.querySelector('parsererror')
    const {nodeName: rootName} = xmlDOM.documentElement
    if (error) {
      errors.parametres = errors.parametres || {}
      errors.parametres.xml = 'Ce champ doit contenir du xml valide'
    } else if (rootName !== 'INSTRUMENPOCHE') {
      errors.parametres = errors.parametres || {}
      errors.parametres.xml = 'Ce champ doit contenir du xml dont la racine est <INSTRUMENPOCHE>'
    }
  }
}

export default validate
