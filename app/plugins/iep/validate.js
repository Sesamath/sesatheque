const xmlRe = /^\s*<INSTRUMENTPOCHE>[^]*<\/INSTRUMENTPOCHE>\s*$/

const validate = ({parametres: {url, xml}}, errors) => {
  if (!url && !xml) {
    errors.parametres = errors.parametres || {}
    errors.parametres.xml = errors.parametres.url = 'Il faut renseigner l\'un de ces deux champs'
    return
  }

  if (xml && !xmlRe.test(xml)) {
    errors.parametres = errors.parametres || {}
    errors.parametres.xml = 'Ce champs doit contenir du xml valide de la forme: <INSTRUMENTPOCHE>...</INSTRUMENTPOCHE>'
  }
}

export default validate
