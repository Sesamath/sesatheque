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
  sass       = require('gulp-sass'),
  dust       = require('gulp-dust'),
  concat     = require('gulp-concat'),
  jsdoc      = require("gulp-jsdoc"),
  jshint     = require("gulp-jshint"),
  rework     = require('./node_modules/lassi/gulpTasks/gulp-path-rework'),
  launcher   = require('gulp-launcher'),
  fs         = require('fs');


/**
 * L'instance de notre (re)démarreur de serveur (incluant un serveur livereload)
 */
var launcher = launcher('./construct/index.js');

/**
 * Comme pour les sources, les styles sont d'abords construits dans le dossier build/tmp.
 * Chaque module pouvant avoir plusieurs feuilles de styles générées par SASS, toutes finissent
 * d'abord ici à l'issue de la compilation.
 */
gulp.task('build-public-styles', function () {
  gulp
    .src('construct/**/public/**/scss/*.scss', {base: './'})
    .pipe(sass({
      includePaths: [ './node_modules/lassi/sass-tools' ],
      errLogToConsole: true,
      sourceComments: 'map'}))
    .pipe(rework.replace({'scss': 'styles'}))
    .pipe(gulp.dest('./'))

    .pipe(launcher.livereload())
})

/**
 * Tâche de construction globale de l'application
 */
gulp.task('build', [ 'build-public-styles' ], function () {});

/**
 * Tâche qui efface build
 */
gulp.task('clean', function () {
  // thanks to http://stackoverflow.com/a/12761924
  // works on windows ?
  function deleteFolderRecursive(path) {
    var files = [];
    if (fs.existsSync(path)) {
      files = fs.readdirSync(path);
      files.forEach(function (file, index) {
        var curPath = path + "/" + file;
        if (fs.lstatSync(curPath).isDirectory()) { // recurse
          deleteFolderRecursive(curPath);
        } else { // delete file
          fs.unlinkSync(curPath);
        }
      });
      fs.rmdirSync(path);
    }
  }

  deleteFolderRecursive('./build');
});

/**
 * Tâche qui efface build et le reconstruit
 */
gulp.task('rebuild', [ 'clean', 'build' ], function () {});


/**
 * Lance le serveur (node et livereload) puis se met en écoute des modification de fichier.
 */
gulp.task('watch', function () {
  gulp.watch('construct/**/public/**/scss/**/*.scss', ['build-public-styles']);
  gulp.watch(['construct/**/*', '!construct/**/public/**/*']).on('change', function() { launcher.restart(); });
  gulp.watch(['modules/**/*.js', '!modules/*/node_modules']).on('change', function() { launcher.restart(); });
  launcher.start();
})


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

/**
 * La tâche par défaut relance un build puis l'appli
 */
gulp.task('default', ['build', 'watch']);
