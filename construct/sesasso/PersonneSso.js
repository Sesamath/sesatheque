'use strict';

/**
 * Un constructeur pour les objets retournés par le sso
 * (module js standard, pas un composant lassi, utilisé par le composant sesasso)
 */

var _ = require('underscore')._
var flow = require('seq');

/**
 * Constructeur appelé au retour de sso, ce n'est pas une entity
 * @param {Object} sso l'objet 'SSO' retourné par le serveur sso
 * @constructor
 */
function PersonneSso(sso) {
  this.id = sso.user_id
  this.login = sso.user_login
  this.statut = sso.STATUT
  this.nom = sso.user_nom
  this.prenom = sso.user_prenom
  this.structures = sso.structure_id || []
  this.grpCollab = grpToArray(sso.contributeur_int_collab_groupes)
  this.grpMepDev = grpToArray(sso.contributeur_mepdevel_groupes)
  this.grpWiki = grpToArray(sso.contributeur_wiki_groupes)
  this.emailAcad = sso.user_email_acad
  this.emailPerso = sso.user_email_supp
  //this.vip = sso.Ligne_VIP
  this.contactProjet = sso.TabProjetContact // {idProjet1:idProjet1, idProjet2:idProjet2, ...}
  this.participantProjet = sso.TabProjetParticipant
  this.responsableProjet = sso.TabProjetResponsable
  this.profil = sso.user_profil // SesaProf ou ExtProf
  this.labomepId = sso.user_labomep_id
  //this.emailDerog = sso.user_email_derog // si l'emailAcad n'en est pas un (donc par dérogation manuelle)
  //this.genre = sso.user_genre
  /* */
}

/**
 * Converti une ssoPersonne en objet ayant les propriétés d'une entity Personne (sauf oid et _entity)
 * @param {EntityInstance~StoreCallback} next callback appellée avec (error, personne)
 */
PersonneSso.prototype.toPersonne = function(next) {
  if (!this.id) throw new Error("Impossible de convertir une personne sans id")

  // on met au format personne
  var personneMaj = {
    id:this.id,
    login:this.login,
    nom:this.nom,
    prenom:this.prenom,
    mail:this.emailPerso || this.emailAcad,
    permissions:{},
    // on garde tout pour le moment, mais la plupart devrait dégager
    infos:this /*{
      statut:this.statut,
      structures:this.structures,
      grpCollab:this.grpCollab,
      grpMepDev:this.grpMepDev,
      grpWiki:this.grpWiki
    } /* */
  }

  // reste les permissions et les groupes
  var personne = lassi.entity.Personne.create(personneMaj)
  var personneSso = this
  personneSso.addPermissions(personne, function(error, personne) {
    personneSso.addGroupes(personne, next)
  })
}

/**
 * Ajoute les permissions d'après le statut
 * On utilise une callback au cas où on aurait besoin d'aller lire des infos en bdd ou en écrire
 * @param {EntityInstance} personne
 * @param {EntityInstance~StoreCallback} next appelée avec (null, personne)
 */
PersonneSso.prototype.addPermissions =  function (personne, next) {
  var s = this.statut
  /**
   * La liste des statuts possibles
   *
   * Authentifie
   * Collaboratif_Dezoneur
   * Collaboratif_Interface
   * Collaboratif_MepDevel
   * Collaboratif_WikiExterne
   * Prof_Correction
   * Prof_Labomep
   * Prof_Valide
   * SesaProf_Valide
   * Sesamath_CA": false,
   * Sesamath_CA_salarie
   * Sesamath_Contact_LaboMEP
   * Sesamath_Devel
   * Sesamath_Gestion_Asso
   * Sesamath_Gestion_User
   * Sesamath_Membre
   * Sesamath_Participant_LaboMEP
   * Sesamath_Participant_MutuaMath
   * Sesamath_ProjetContact
   * Sesamath_ProjetParticipant
   * Sesamath_ProjetResponsable
   * Sesamath_Responsable_LaboMEP
   * Sesamath_Salarie
   * Sesamath_WikiInterne
   */
  if (s.Prof_Valide) personne.addRolePermissions('prof')
  if (s.Sesamath_CA_salarie) personne.addRolePermissions('admin')
  if (s.Sesamath_Membre) personne.addRolePermissions('editor')
  next(null, personne)
}

/**
 * Ajoute les groupes à personne
 * @param {Personne} personne
 * @param {EntityInstance~StoreCallback} next appelée avec (null, personne)
 */
PersonneSso.prototype.addGroupes =  function (personne, next) {
  /** Les groupes que l'on va ajouter (liste de noms) */
  var groupeNoms = []
  /** Les groupes venant de SSO sous la forme nomGroupe:true|false */
  var grpSso = {}
  lassi.tools.update(grpSso, this.statut)
  // sauf cette propriété toujours vrai qui nous intéresse pas comme groupe...
  if (grpSso.hasOwnProperty('Authentifie')) delete grpSso.Authentifie
  lassi.tools.update(grpSso, this.grpCollab)
  lassi.tools.update(grpSso, this.grpMepDev)
  lassi.tools.update(grpSso, this.grpWiki)
  _.each(grpSso, function(has, name) {
    if (has) groupeNoms.push(name)
  })
  // on ajoute les projets Sesamath
  _.each(this.contactProjet, function(projetId) {
    groupeNoms.push('contactProjet_' +projetId)
  })
  _.each(this.participantProjet, function(projetId) {
    groupeNoms.push('participantProjet' +projetId)
  })
  _.each(this.responsableProjet, function(projetId) {
    groupeNoms.push('responsableProjet' +projetId)
  })

  // reste à ajouter tous ces groupes
  flow(groupeNoms)
      .parEach(function(groupeNom) {
        personne.addGroupeByName(groupeNom, this)
      })
      .empty()
      .seq(function () {
        next(null, personne)
      })
      .catch(next)
}

module.exports = PersonneSso

/**
 * Transforme une chaine de liste de groupes en objet
 * @param {string} grpString La liste des groupes renvoyée par sso (avec virgule au début et à la fin)
 * @returns {Object} objet avec une propriété du nom du groupe (valant true) par groupe trouvé
 */
function grpToArray(grpString) {
  var groupes = {}
  if (grpString && grpString.length > 2) {
    grpString.split(',').forEach(function(grp) {
      if (grp) groupes[grp] = true
    })
  }

  return groupes
}

/* le retour de SSO ressemble à
   "id"               : <integer>,
   "login"            : "<string>",
   "statut"           : {
     // tous les statuts sont listés
     "Authentifie"                   : <boolean>,
     "Collaboratif_Dezoneur"         : <boolean>,
     "Collaboratif_Interface"        : <boolean>,
     "Collaboratif_MepDevel"         : <boolean>,
     "Collaboratif_WikiExterne"      : <boolean>,
     "Prof_Correction"               : <boolean>,
     "Prof_Labomep"                  : <boolean>,
     "Prof_Valide"                   : <boolean>,
     "SesaProf_Valide"               : <boolean>,
     "Sesamath_CA"                   : <boolean>,
     "Sesamath_CA_salarie"           : <boolean>,
     "Sesamath_Contact_LaboMEP"      : <boolean>,
     "Sesamath_Devel"                : <boolean>,
     "Sesamath_Gestion_Asso"         : <boolean>,
     "Sesamath_Gestion_User"         : <boolean>,
     "Sesamath_Membre"               : <boolean>,
     "Sesamath_Participant_LaboMEP"  : <boolean>,
     "Sesamath_Participant_MutuaMath": <boolean>,
     "Sesamath_ProjetContact"        : <boolean>,
     "Sesamath_ProjetParticipant"    : <boolean>,
     "Sesamath_ProjetResponsable"    : <boolean>,
     "Sesamath_Responsable_LaboMEP"  : <boolean>,
     "Sesamath_Salarie"              : <boolean>,
     "Sesamath_WikiInterne"          : <boolean>
   },
   "nom"              : "CAILLIBAUD",
   "prenom"           : "Daniel",
   "structures"       : [],
   "grpCollab"        : {
     // seuls les groupes auquel on appartient sont listés (sinon user:false)
     "user"                  : true,
     "admin"                 : true,
     "admin_complements"     : true,
     "admin_xml"             : true,
     "flash"                 : true,
     "iep"                   : true,
     "ooo_cahier_mathenpoche": true,
     "ooo_corrections"       : true,
     "ooo_manuel_sesamath"   : true,
     "tableur"               : true,
     "tep"                   : true,
     "ooo_lycee"             : true,
     "labomep_gt_j3p"        : true
   },
   "grpMepDev"        : {
     // seuls les groupes auquel on appartient sont listés (sinon user:false)
     "user"              : true,
     "developpeur"       : true,
     "developpeur_junior": true
   },
   "grpWiki"          : {
     // seuls les groupes auquel on appartient sont listés (sinon user:false)
     "user"      : true,
     "admin"     : true,
     "nxmanuel"  : true,
     "j3p"       : true,
     "indexation": true,
     "redmine"   : true,
     "mutuamath" : true,
     "dev_www"   : true
   },
   "emailAcad"        : "<adresse officielle, peut être personnelle en cas de dérogation>",
   "emailPerso"       : "<adresse perso ou chaine vide>",
   "contactProjet"    : {
     // liste de projets sous la forme
     "<int, l'id du projet>": <le même int>,
     "<int, l'id du 2nd projet>": <le même int>
   },
   "participantProjet": {
     // liste de projet sous la même forme
   },
   "responsableProjet": {
     // liste de projet sous la même forme
   },
   "profil"           : "<actuellement SesaProf|ExtProf>",
   "labomepId"        : <id labomep, utilisé par le labomep 2013, les suivants vont recencer eux même (sourceAuth,id)>
 }
*/
