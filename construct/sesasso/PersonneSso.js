'use strict'
/**
 * Un constructeur pour les objets retournés par le sso
 * (module js standard, pas un composant lassi, utilisé par le composant sesasso)
 */

//var _ = require('underscore')._

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
  /* plus ces propriétés éventuelles que l'on utilise pas * /
  this.vip = sso.Ligne_VIP
  this.contactProjet = sso.TabProjetContact
  this.participantProjet = sso.TabProjetParticipant
  this.responsableProjet = sso.TabProjetResponsable
  this.profil = sso.user_profil // SesaProf ou ExtProf
  this.labomepId = sso.user_labomep_id
  this.emailDerog = sso.user_email_derog // si l'emailAcad n'en est pas un (donc par dérogation manuelle)
  this.genre = sso.user_genre
  /* */
}

/**
 * Converti une ssoPersonne en objet ayant les propriétés d'une entity Personne (sauf oid et _entity)
 * @returns {Object}
 */
PersonneSso.prototype.toPersonne = function() {
  if (!this.id) throw new Error("Impossible de convertir une personne sans id")

  // on met au format personne
  var personneMaj = {
    id:this.id,
    login:this.login,
    nom:this.nom,
    prenom:this.prenom,
    mail:this.emailPerso || this.emailAcad,
    roles:[],
    infos:{
      statut:this.statut,
      structures:this.structures,
      grpCollab:this.grpCollab,
      grpMepDev:this.grpMepDev,
      grpWiki:this.grpWiki
    }
  }
  // reste les roles, on reste basique
  if (this.statut && this.statut.Sesamath_CA_salarie) personneMaj.roles.push('admin')
  else if (this.statut && this.statut.Sesamath_Membre) personneMaj.roles.push('editor')

  return lassi.entity.Personne.create(personneMaj)
}

module.exports = PersonneSso

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
