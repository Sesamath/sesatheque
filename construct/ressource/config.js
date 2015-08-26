/**
 * This file is part of Sesatheque.
 *   Copyright 2014-2015, Association Sésamath
 *
 * Sesatheque is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License version 3
 * as published by the Free Software Foundation.
 *
 * Sesatheque is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Sesatheque (LICENCE.txt).
 * @see http://www.gnu.org/licenses/agpl.txt
 *
 *
 * Ce fichier fait partie de l'application Sésathèque, créée par l'association Sésamath.
 *
 * Sésathèque est un logiciel libre ; vous pouvez le redistribuer ou le modifier suivant
 * les termes de la GNU Affero General Public License version 3 telle que publiée par la
 * Free Software Foundation.
 * Sésathèque est distribué dans l'espoir qu'il sera utile, mais SANS AUCUNE GARANTIE ;
 * sans même la garantie tacite de QUALITÉ MARCHANDE ou d'ADÉQUATION à UN BUT PARTICULIER.
 * Consultez la GNU Affero General Public License pour plus de détails.
 * Vous devez avoir reçu une copie de la GNU General Public License en même temps que Sésathèque
 * (cf LICENCE.txt et http://vvlibri.org/fr/Analyse/gnu-affero-general-public-license-v3-analyse
 * pour une explication en français)
 */

'use strict';

/**
 * Nos listes de types & co, qui changent rarement
 */
var ressourceConfig = {
  langueDefaut : 'fra',
  /**
   * Les listes de choix pour nos propriétés dont on enregistre des ids
   */
  listes : {
    typeTechnique : {
      'am'    : 'aide mathenpoche',
      'arbre' : 'arbre (liste hiérarchisée)',
      'calkc' : 'calculatrice cassée',
      'ec2'   : 'exercice calculatice',
      'em'    : 'exercice mathenpoche',
      'j3p'   : 'activité j3p',
      'mental': 'calcul mental',
      'url'   : 'page externe'
    },
    // les typeTechnique qui peuvent être utilisés pour une ressource perso
    typePerso : {
      'url'   : true
    },
    niveaux          : {
      11: 'CP',
      10: 'CE1',
      9 : 'CE2',
      8 : 'CM1',
      7 : 'CM2',
      6 : 'sixième',
      5 : 'cinquième',
      4 : 'quatrième',
      3 : 'troisième',
      2 : 'seconde',
      1 : 'première',
      12: 'terminale'
    },
    categories       : {
      1: "Activité fixe",
      2: "Activité animée",
      3: "Cours fixe",
      4: "Cours avec animation",
      5: "Exercice fixe",
      6: "Exercice avec animation",
      7: "Exercice interactif",
      8: "Liste de ressources",
      9: "À déterminer"
    },
    typePedagogiques : {
      // id de scolomfr-voc-010, « on s'en sert pour faire quoi ? »
      3  : "cours / présentation",
      9  : "exercice",
      91 : "corrigé d'exercice",
      92 : "énoncé d'exercice",
      191: "QCM (question à choix multiples)",
      7  : "évaluation",
      2  : "autoévaluation",
      81 : "sujet d'examen et de concours",
      82 : "préparation à l'examen",
      13 : "jeu éducatif",
      141: "manuel scolaire",
      151: "document de référence",
      21 : "simulation",
      22 : "tutoriel"
    },
    typeDocumentaires: {
      // id de scolomfr-voc-004, qui sont de la forme scolomfr-voc-004-num-NNN, on ne reprend ici que le NNN
      // @see http://www.lom-fr.fr/scolomfr/la-norme/manuel-technique.html?tx_scolomfr_pi1[detailElt]=49
      // http://www.cndp.fr/scolomfr//fileadmin/_scolomfr/04.xml
      // pour un exercice contenant texte et image faut mettre les deux
      5 : "vidéo / animation", // nommé image en mouvement dans le voc officiel
      9 : "ressource interactive",
      6 : "image fixe", // on laisse tomber le 4 image tout court
      12: "texte",
      11: "son",
      1 : "collection", // une liste de ressources
      2 : "ensemble de données"
    },
    relations        : {
      1 : "est associée à",
      4 : "est une version de",
      5 : "existe en une autre version",
      6 : "est remplacée par",
      7 : "remplace",
      8 : "est requis par",
      9 : "requiert",
      10: "est une partie de",
      11: "contient",
      12: "est référencé par",
      13: "contient une référence à",
      14: "est un format de",
      15: "existe dans un format",
      16: "est la traduction de",
      17: "fait l’objet d’une traduction",
      21: "a pour vignette",
      51: "a pour corrigé",
      52: "est la correction de"
    },
    langue           : {
      'deu': 'allemand',
      'eng': 'anglais',
      'ara': 'arabe',
      'eus': 'basque',
      'bre': 'breton',
      'cat': 'catalan',
      'spa': 'espagnol',
      'fra': 'français',
      'ita': 'italien',
      'por': 'portugais'
    },
    restriction      : {
      0: 'aucune',
      1: 'corrigé',
      2: 'groupe',
      3: 'privé'
    }
  },
  // lors de l'itération sur les listes, ça prend l'ordre numérique des noms de propriétés, on peut fixer notre ordre ici
  listesOrdonnees : {
    niveaux: [11,10,9,8,7,6,5,4,3,2,1,12],
    typeDocumentaires: [9,5,6,12,11,1,2],
    typePedagogiques : [3,9,91,92,191,7,2,81,82,13,141,151,21,22]
  }, // fin des listes

  /**
   * Donne la catégorie induite par le typeTechnique, mais ça peut être surchargé par l'utilisateur qui renseigne categories
   */
  typeTechniqueToCategories : {
    'am'    : [2],
    'arbre' : [8],
    'calkc' : [7],
    'ec2'   : [7],
    'em'    : [7],
    'mental': [7]
  },

  /**
   * Donne les types induits par la catégorie, mais ça peut être surchargé par l'utilisateur qui renseigne les champs
   */
  categoriesToTypes: {
    1: {
      typePedagogiques : [9],
      typeDocumentaires: [12]
    },
    2: {
      typePedagogiques : [9],
      typeDocumentaires: [5]
    },
    3: {
      typePedagogiques : [3],
      typeDocumentaires: [12]
    },
    4: {
      typePedagogiques : [3],
      typeDocumentaires: [5]
    },
    5: {
      typePedagogiques : [9],
      typeDocumentaires: [12]
    },
    6: {
      typePedagogiques : [9],
      typeDocumentaires: [5]
    },
    7: {
      typePedagogiques : [9],
      typeDocumentaires: [9]
    },
    8:{
      typePedagogiques : [],
      typeDocumentaires: [1]
    }
  },

  // les propriétés qui ne prennent qu'une seule valeur
  uniques          : {
    'typeTechnique': true,
    'langue'       : true,
    'restriction'  : true
  },

  // les propriétés obligatoires
  required         : {
    titre         : true,
    typeTechnique : true,
    categories    : true
    //'auteurs'
  },

  /** libellés que l'on affiche pour chaque champ obligatoire (les fonctions qui peuplent les vues bouclent dessus) */
  labels           : {
    oid              : "Identifiant",
    origine          : 'Origine',
    idOrigine        : "Identifiant d'origine",
    typeTechnique    : "Type technique",
    titre            : "Titre",
    resume           : "Résumé",
    description      : "Description",
    commentaires     : "Commentaires",
    parametres       : "Paramètres",
    niveaux          : "Niveau",
    categories       : "Catégories",
    typePedagogiques : "Type pédagogique",
    typeDocumentaires: "Type documentaire",
    relations        : "Ressources liées",
    auteurs          : "Auteurs",
    contributeurs    : "Contributeurs",
    groupes          : "Groupes",
    langue           : "Langue",
    publie           : "Publié",
    restriction      : "Restriction",
    dateCreation     : "Date de création",
    dateMiseAJour    : "Date de mise à jour",
    version          : "Version",
    indexable        : "Indexable",
    archiveOid       : 'Version précédente',
    displayUri       : 'Voir la ressource',
    describeUri      : 'Voir la description',
    dataUri          : 'url des données',
    // facultatifs
    enfants          : 'Enfants', // utilisé seulement pour les arbres (à la place de parametres)
  },

  // les propriétés dont la modif déclenche un upgrade de version
  versionTriggers : ['origine', 'idOrigine', 'parametres', 'enfants', 'auteurs', 'contributeurs'],

  // les types requis (il faut la même liste de propriétés que labels, et des valeurs * dont _.is* existe)
  typesVar         : {
    oid              : 'Number',
    origine          : 'String',
    idOrigine        : 'String',
    typeTechnique    : 'String',
    titre            : 'String',
    resume           : 'String',
    description      : 'String',
    commentaires     : 'String',
    parametres       : 'Object',
    niveaux          : 'Array',
    categories       : 'Array',
    typePedagogiques : 'Array',
    typeDocumentaires: 'Array',
    relations        : 'Array',
    auteurs          : 'Array',
    contributeurs    : 'Array',
    groupes          : 'Array',
    langue           : 'String',
    publie           : 'Boolean',
    restriction      : 'Number',
    dateCreation     : 'Date',
    dateMiseAJour    : 'Date',
    version          : 'Number',
    indexable        : 'Boolean',
    archiveOid       : 'Number',
    displayUri       : 'String',
    describeUri      : 'String',
    dataUri          : 'String',
    // facultatifs
    enfants          : 'Object', // en fait un Array, mais pas un array d'id, et comme un Array est aussi un Object...
  },

  /**
   * Des constantes pour rendre le code plus lisible
   * (en gros un reverse sur les listes d'ids de nos propriétés)
   */
  constantes       : {
    categories       : {
      activiteFixe      : 1,
      activiteAnimee    : 2,
      coursFixe         : 3,
      coursAnime        : 4,
      exerciceFixe      : 5,
      exerciceAnime     : 6,
      exerciceInteractif: 7,
      liste             : 8,
      aucune            : 9 // déclenchera un warning dans $ressourceControl.valide
    },
    typePedagogiques : {
      cours            : 3,
      exercice         : 9,
      corrigeExercice  : 91,
      enonceExercice   : 92,
      qcm              : 191,
      evaluation       : 7,
      autoEvaluation   : 2,
      sujetExam        : 81,
      prepareExam      : 82,
      jeuEduc          : 13,
      manuel           : 141,
      documentReference: 151,
      simulation       : 21,
      tutoriel         : 22
    },
    typeDocumentaires: {
      animation : 5,
      interactif: 9,
      imageFixe : 6,
      texte     : 12,
      son       : 11,
      collection: 1,
      dataSet   : 2
    },
    relations        : {
      assocA           : 1,
      estVersionDe     : 4,
      existeAussi      : 5,
      estRemplacePar   : 6,
      remplace         : 7,
      estRequisPar     : 8,
      requiert         : 9,
      estPartieDe      : 10,
      contient         : 11,
      estRefPar        : 12,
      contientRefA     : 13,
      estUnFormatDe    : 14,
      existeDansFormat : 15,
      estTraductionDe  : 16,
      estTraduitAvec   : 17,
      aPourVignette    : 21,
      aPourCorrige     : 51,
      estLaCorrectionDe: 52
    },
    restriction      : { // l'inverse id => label est dans listes
      aucune    : 0,
      correction: 1,
      groupe    : 2,
      prive     : 3
    },
    // des constantes pour nos routes
    routes : {
      api : '',
      display:'voir',
      preview:'apercevoir',
      create : 'ajouter',
      edit: 'modifier',
      describe:'decrire',
      delete:'supprimer',
      search:'rechercher'
    }
  }, // fin constantes
  /**
   * Des formats d'affichage
   */
  formats : {
    jour : 'DD/MM/YYYY'
  },
  limites : {
    maxSql : 500,
    listeNbDefault : 25
  },
  cacheTTL : 3600
};

module.exports = ressourceConfig