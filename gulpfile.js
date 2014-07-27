"use strict";
/*
 * This file is part of "Collection".
 *    Copyright 2009-2012, arNuméral
 *    Author : Yoran Brault
 *    eMail  : yoran.brault@arnumeral.fr
 *    Site   : http://arnumeral.fr
 *
 * "Collection" is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General public License as
 * published by the Free Software Foundation; either version 2.1 of
 * the License, or (at your option) any later version.
 *
 * "Collection" is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * General public License for more details.
 *
 * You should have received a copy of the GNU General public
 * License along with "Collection"; if not, write to the Free
 * Software Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301 USA, or see the FSF site: http://www.fsf.org.
 */



/**
 * Fichier de construction et de gestion du projet.
 *
 * Installation des éléments externes (ckeditor, etc.)
 *  $$ gulp install
 *
 * Construction du projet
 *  $$ gulp build
 *
 * Développement
 *  $$ gulp start
 */

var
  gulp       = require('gulp'),
  fs         = require('fs'),
  buildTasks = require('./node_modules/lassi/gulpTasks/builder');


buildTasks(gulp).launch('./construct/index.js');


/**
 * Lance l'analyse de notre code serveur
 */
gulp.task('hintServer', function() {
  var config = require('./package.json').jshintConfig;
  gulp.src(['construct/**/*.js', '!construct/**/public/**/*'])
      .pipe(jshint(config))
      .pipe(jshint.reporter('jshint-stylish'))
});

/**
 * Lance l'analyse de notre code client
 */
gulp.task('hintClient', function() {
  var config = require('./package.json').jshintConfig;
  // faut changer le contexte
  config.node = false;
  config.browser = true;
  gulp.src(['construct/**/public/**/*.js', '!construct/**/public/vendors/**/*'])
      .pipe(jshint(config))
      .pipe(jshint.reporter('jshint-stylish'))
});

/**
 * Lance l'analyse de notre code avec jsHint
 */
gulp.task('hint', ['hintServer', 'hintClient']);

/**
 * On ajoute toutes les tâches du dossier gulptasks s'il existe
 * Chaque fichier doit exporter une fonction qui sera exécutée à l'appel de la tâche
 */
var taskDir = './gulptasks';
if (fs.existsSync(taskDir)) {
  fs.readdirSync(taskDir).forEach(function (file, index) {
    var name;
    if (file.substr(-3) === '.js') {
      name = file.substr(0, file.length -3);
      gulp.task(name, require(taskDir + '/' + file));
    }
  })
}

