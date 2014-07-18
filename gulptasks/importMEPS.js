/**
 * Ce script passe en revue les tables MEPS et AIDES de mepcol et envoie tout ça à l'api (en http)
 *
 * Ça lui permettra d'être déplacé sur un autre serveur et de tourner de manière autonome
 * sans l'appli bibliothèque ni lassi
 */
'use strict';

var knex = require('knex');
var _ = require('underscore');
// conf de l'appli
var config = require('../construct/ressource/config.js');
// constantes
var tdCode = config.constantes.typeDocumentaires;
var tpCode = config.constantes.typePedagogiques;
var catCode = config.constantes.categories;
var relCode = config.constantes.relations;

// databases
var dbConfigBibli = require(__dirname + '/../_private/dbconfig/index.js');
var dbConfigMepCol = require(__dirname + '/../_private/dbconfig/mepcol.js');
// les connexions aux bases
var kmepcol = knex(dbConfigMepCol);
var kbibli = knex(dbConfigBibli);

// le décalage d'id
var decalageAm = 6000;

// les ids traités
var oidsParsed = [];
var oidsInserted = [];
var oidsUpdated = [];
var oidFailed = [];
var pendingRelations = {};

/**
 * Renvoie le codeTechnique d'un resultSet Mep
 * @param mepRow
 * @returns {string}
 */
function getCodeTechnique(mepRow) {
  if (mepRow.mep_modele === '1') {
    return 'mep1';
  } else if (mepRow.mep_modele === '2' && mepRow.mep_modele2 === 'college') {
    return 'mep2col';
  } else if (mepRow.mep_modele === '2' && mepRow.mep_modele2 === 'college') {
    return 'mep2lyc';
  } else {
    throw new Error("mep_modele incohérent " + mepRow.mep_modele + ' ' + mepRow.mep_modele2);
  }
}

/**
 * Renvoie le code langue à 3 char d'après le code à 2 char
 * @param mep_langue_id
 * @returns {*}
 */
function getLangue(mep_langue_id) {
  var corres = {
    'ar': 'ara',
    'br': 'bre',
    'ca': 'cat',
    'de': 'deu',
    'en': 'eng',
    'es': 'spa',
    'eu': 'eus',
    'fr': 'fra',
    'it': 'ita',
    'pt': 'por'
  };
  if (corres[mep_langue_id]) {
    return corres[mep_langue_id];
  } else {
    console.error(mep_langue_id + " n'est pas un code connu");
    return 'fra';
  }
}

/**
 * OBSOLETE
 * Récupère la date de création
 * @param row
 * @returns {Date}
 */
function getDateCreation(row) {
  // 1072911600 => 2004-01-01
  if (row.mep_swf_date > 1072911600 && row.mep_swf_date < (new Date()).getTime() / 1000) {
    return new Date(row.mep_swf_date * 1000);
  } else {
    // faut aller chercher ça dans DEV_FILES
    kmepcol()
        .select('dev_file_date')
        .from('DEV_FILES')
        .where({dev_file_id: row.mep_swf_id, dev_file_type: 'exswf'})
        .limit(1)
        .orderBy('dev_file_date', 'desc')
        .then(function (results) {
          var ts;
          if (results[0] && results[0]['dev_file_date']) {
            ts = results[0]['dev_file_date'];
            if (ts > 1072911600 && ts < (new Date()).getTime() / 1000) {
              return new Date(ts * 1000);
            } else {
              console.error("On a trouvé " + ts + " dans DEV_FILES.dev_file_date pour swf_id " + row.mep_swf_id);
              return null;
            }
          } else {
            console.error("La requete " + this.toSQL() + " a échouée");
            return null;
          }
        });
  }
}

/**
 * Convertie un timestamp (en s) en objet Date
 * Retourne null si le timestamp est dans le futur (+2h) ou avant le 01/01/2004
 * @param ts
 * @returns {Date}
 */
function getDate(ts) {
  // 7260 en cas de décalage horaire (fuseau mal réglé)
  if (ts > 1072911600 && ts < (new Date()).getTime() / 1000 + 7260) {
    return new Date(ts * 1000);
  } else {
    return null;
  }
}

/**
 * Note dans la var globale pendingRelations une relation à ajouter plus tard
 * @param id
 * @param relation
 */
function addPendingRelation(id, relation) {
  if (!pendingRelations[id]) pendingRelations[id] = [];
  pendingRelations[id].push(relation);
}

/**
 * Convertit un recordset MEPS en objet Ressource que l'on pourra poster à l'api
 * @param row
 * @returns {Ressource}
 */
function initRessourceMep(row) {
  var relations = [];
  var contenu = {};
  // raccourci
  var id = row.mep_id;
  // contenu
  contenu.nbq_defaut = row.mep_nbq_defaut; // obligatoire
  if (row.mep_swf_id !== id)    contenu.swf_id          = row.mep_swf_id;
  if (row.mep_projet !== 'mep')         contenu.projet          = row.mep_projet;
  if (row.mep_old)                      contenu.old             = row.mep_old;
  if (row.mep_suite_formateur !== 'o')  contenu.suite_formateur = row.mep_suite_formateur;
  if (row.mep_aide_formateur !== 'o')   contenu.aide_formateur  = row.mep_aide_formateur;
  if (row.mep_nb_wnk)                   contenu.nb_wnk          = row.mep_nb_wnk;
  // contenu + relations
  // aide
  if (row.mep_aide_id) {
    contenu.aide_id         = row.mep_aide_id;
    relations.push([relCode.requiert, row.mep_aide_id]);
    addPendingRelation(row.mep_aide_id + decalageAm, [relCode.estRequisPar, id]);
  }
  // traduction
  if (row.mep_id_fr !== id) {
    contenu.id_fr = row.mep_id_fr;
    relations.push([relCode.estTraductionDe, row.mep_id_fr]);
    addPendingRelation(row.mep_id_fr, [relCode.estTraduitAvec, id]);
  }
  // on regarde si on a des relations à ajouter
  if (pendingRelations[id]) {
    relations = relations.concat(pendingRelations[id]);
    delete pendingRelations[id];
  }

  // @todo regarder mep_swf_utilisateur_id pour récupérer les auteurs et ajouter les mep_txt_utilisateur_id dans les contributeurs
  return {
    oid              : id,
    codeTechnique    : getCodeTechnique(row),
    titre            : row.mep_titre,
    resume           : row.mep_descriptif,
    description      : '',
    commentaires     : row.mep_commentaire,
    niveaux          : [],
    categories       : [catCode.exerciceInteractif],
    typePedagogiques : [tpCode.exercice, tpCode.autoEvaluation],
    typeDocumentaires: [tdCode.interactif],
    relations        : relations,
    contenu          : contenu,
    // auteurs
    // contributeurs
    langue           : getLangue(row.mep_langue_id),
    publie           : (row.mep_statut_public === 'en_public' ? true : false),
    restriction      : 0,
    dateCreation     : getDate(row.dateCreation),
    dateMiseAJour    : getDate(row.dateMiseAJour)
  };
}

/**
 * Convertit un recordset AIDES en objet Ressource
 * @param row
 * @returns {Ressource}
 */
function initRessourceAm(row) {
  var relations = [];
  var id = row.aide_id + decalageAm;
  // on regarde si on a des relations à ajouter
  if (pendingRelations[id]) {
    relations = relations.concat(pendingRelations[id]);
    delete pendingRelations[id];
  }
  return {
    oid              : id,
    codeTechnique    : 'am',
    titre            : row.aide_titre,
    categories       : [7],
    typePedagogiques : [3],
    typeDocumentaires: [9],
    relations        : relations,
    contenu          : {},
    // auteurs
    // contributeurs
    langue           : 'fra',
    publie           : true,
    restriction      : 0,
    dateCreation     : getDate(row.dateCreation),
    dateMiseAJour    : getDate(row.dateMiseAJour)
  };
}

/**
 * Importe la table MEPS dans ressource
 */
function importMEPS() {
  // sous-requete sur DEV_FILES pour aller chercher les dates
  var dates;
  // dates = kmepcol.raw("SELECT min(dev_file_date) as dateCreation, max(dev_file_date) as dateMiseAJour FROM DEV_FILES WHERE dev_file_identifiant = m.mep_swf_id AND dev_file_type = 'exswf' ORDER BY mep_id DESC");
  /* dates = kmepcol('DEV_FILES')
      /* .select(kmepcol.raw("min(dev_file_date) as dateCreation, max(dev_file_date) as dateMiseAJour"))
      .whereRaw("dev_file_identifiant = m.mep_swf_id AND dev_file_type = 'exswf' ")
      // pour tomber sur les traductions en 1er et économiser des requetes d'ajout de relations ultérieures
      .orderBy('mep_id', 'desc') */
  /* dates = kmepcol('DEV_FILES')
      .select("min(dev_file_date)").as('dateCreation')
      .select('max(dev_file_date)').as('dateMiseAJour')
      .whereRaw("dev_file_identifiant = m.mep_swf_id AND dev_file_type = 'exswf' ")
      .orderBy('mep_id', 'desc');
  tout ça marche pas, on essaie de coller plus près de http://knexjs.org/#Raw-queries-wrapped * /
  dates = kmepcol.raw("SELECT min(dev_file_date) as dateCreation, max(dev_file_date) as dateMiseAJour FROM DEV_FILES WHERE dev_file_identifiant = m.mep_swf_id AND dev_file_type = 'exswf'")
      .wrap('(', ')'); */
  var dateCreation = kmepcol('DEV_FILES')
      .min('dev_file_date')
      //.whereRaw('dev_file_identifiant = m.mep_swf_id')
      //.andWhere('dev_file_type', 'exswf')
      .whereRaw("dev_file_identifiant = m.mep_swf_id AND dev_file_type', 'exswf'")
      // .as('dateCreation');
  var dateMiseAJour = kmepcol
      .max('dev_file_date')
      .from('DEV_FILES')
      .whereRaw('dev_file_identifiant = m.mep_swf_id')
      .andWhere('dev_file_type', 'exswf')
      .as('dateMiseAJour');
  // le select sur MEPS
  kmepcol()
      .select('*', dateCreation, dateMiseAJour)
      .from('MEPS as m')
      .whereRaw('mep_id < 100')
      .map(function (row) {
        var r;
        oidsParsed.push(row.mep_id);
        r = initRessourceMep(row);
        insertOrUpdate(r);
      })
      .then(function() {
        // le then sert juste à attendre que tout le monde ait fini
        return true;
      });
}

/**
 * Importe la table AIDES dans ressource
 */
function importAIDES() {
  kmepcol()
      .select()
      .from('AIDES')
      .whereRaw('aide_id < 100')
      .map(function (row) {
        var r;
        oidsParsed.push(row.aide_id + decalageAm);
        r = initRessourceAm(row);
        insertOrUpdate(r);
      })
      .then(function() {
        // le then sert juste à attendre que tout le monde ait fini
        return true;
      })
}

function flushPendingRelations() {
  _.each(pendingRelations, function(pendingRelations, id) {
    kbibli()
        .select('data')
        .where({oid:id})
        .map(function(row) {
          var ressource, data;
          ressource = JSON.parse(row.data);
          ressource.relations = ressource.relations.concat(pendingRelations);
          data = JSON.stringify(ressource);
          kbibli('ressource')
              .update({data:data})
              .where({oid: id});
          console.log("Relations ajoutées à " + id);
        })
        .catch(function(e) {
          console.error(e);
        });
  });
}

/**
 * Insert r dans la table ressource, et fait un update si l'insert plante
 * @param r
 */
function insertOrUpdate(r) {
  var data;
  try {
    data = JSON.stringify(r);
    kbibli
        .insert({data:data})
        .into('ressource');
    oidsInserted.push(r.oid);
  } catch (error) {
    try {
      kbibli('ressource')
          .update({data:data})
          .where({oid: r.oid});
      oidsUpdated.push(r.oid);
    } catch (error) {
      oidFailed.push(r.oid);
      throw error;
    }
  }
}

module.exports = function () {
  try {
    console.log('task ' + __filename);
     //console.log(dbConfigMepCol); return;
    importMEPS();
    importAIDES();
    console.log("L'insertion ou update des ressources suivantes a échoué : \n" + oidFailed.join(', '));
    flushPendingRelations();
  } catch (error) {
    console.error(error);
    throw error;
  }

  return true;
}
