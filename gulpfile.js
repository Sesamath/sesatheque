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
  rework     = require('./node_modules/lassi/gulpTasks/gulp-path-rework'),
  launcher   = require('./node_modules/lassi/gulpTasks/launcher'),
  fs         = require('fs');


/**
 * L'instance de notre (re)démarreur de serveur (incluant un serveur livereload)
 */
var launcher = launcher('./build/application/index.js');

/**
 * La construction des sources côté serveur sont juste
 * une recopie du contenu de "construct" en excluant les sous-dossiers
 * public. On supprime aussi "server" et "shared" des chemins cible.
 */
gulp.task('build-server-sources', function () {
  gulp
    .src(['construct/**/*', '!construct/**/public/**/*'])
    .pipe(gulp.dest('build/application'))
    .pipe(launcher.changed())
})


/**
 * Construction des sources public en fusionnant le flux non modifié des sources
 * clients et la version compilée des templates.
 */
gulp.task('build-public-sources', function () {
  var merge = require('merge-stream');
  return merge(
    gulp
      .src(['construct/**/public/**/*.js', '!construct/**/vendors/**']),
    gulp
      .src(['construct/**/public/**/*.dust', '!construct/**/vendors/**'])
      .pipe(dust())
      )
  .pipe(concat('main.js'))
  .pipe(gulp.dest('build/public/scripts'))
  .pipe(launcher.livereload())
});

/**
 * Comme pour les sources, les styles sont d'abords construits dans le dossier build/tmp.
 * Chaque module pouvant avoir plusieurs feuilles de styles générées par SASS, toutes finissent
 * d'abord ici à l'issue de la compilation.
 */
gulp.task('build-public-styles', function () {
  gulp
    .src('construct/**/public/styles/*.scss')
    .pipe(sass({
      includePaths: [ './node_modules/lassi/sass-tools' ],
      errLogToConsole: true,
      sourceComments: 'map'}))
    .pipe(concat('main.css'))
    .pipe(gulp.dest('build/public/styles'))
    .pipe(launcher.livereload())
})


/**
 * La construction des assets consiste juste à une fusion des divers dossiers public/assets des
 * plugins vers build/public/assets.
 */
gulp.task('build-public-assets', function () {
  gulp
    .src(['construct/**/public/assets/**/*'])
    .pipe(rework.rebase('assets'))
    .pipe(gulp.dest('build/public'))
    .pipe(launcher.livereload())
})

/**
 * La construction des libs externes consiste juste à une fusion des divers dossiers public/vendors des
 * plugins vers build/public/vendors.
 */
gulp.task('build-public-vendors', function () {
  gulp
    .src(['construct/**/public/vendors/**/*'])
    .pipe(rework.rebase('vendors'))
    .pipe(gulp.dest('build/public'))
    .pipe(launcher.livereload())
})

/**
 * Tâche de regroupement pour construire l'aspect public de l'application.
 */
gulp.task('build-public', ['build-public-sources', 'build-public-styles', 'build-public-assets', 'build-public-vendors'], function () { });



/**
 * Tâche de construction globale de l'application
 */
gulp.task('build', [ 'build-server-sources', 'build-public' ], function () {});

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
  gulp.watch('construct/**/public/styles/**/*.scss', ['build-public-styles']);
  gulp.watch(['construct/**/*', '!construct/**/public/**/*'], ['build-server-sources']);
  gulp.watch(['modules/**/*.js', '!modules/*/node_modules']).on('change', function() { launcher.restart(); });
  gulp.watch(['construct/**/public/**/*.js', 'construct/**/public/**/*.dust'], ['build-public-sources'])
  launcher.start();
})

/*
gulp.task('doc', function() {
  gulp.src("construct/** /*.js")
    .pipe(jsdoc('./documentation'))
}); */

gulp.task('doc', function() {
  var infos = {
    plugins: ['plugins/markdown'],
    markdown: {
      parser: "gfm"
    }
  }
  gulp.src(['construct/**/*.js', 'README.md'])
      .pipe(jsdoc.parser(infos,'data'))
      .pipe(jsdoc.generator('./documentation'))
}); /* */

gulp.task('default', ['build', 'watch'])
