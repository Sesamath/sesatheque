"use strict";
/*
 * This file is part of "Collection".
 *    Copyright 2009-2012, arNuméral
 *    Author : Yoran Brault
 *    eMail  : yoran.brault@arnumeral.fr
 *    Site   : http://arnumeral.fr
 *
 * "Collection" is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General client License as
 * published by the Free Software Foundation; either version 2.1 of
 * the License, or (at your option) any later version.
 *
 * "Collection" is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * General client License for more details.
 *
 * You should have received a copy of the GNU General client
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
  rework     = require('gulp-path-rework'),
  launcher   = require('launcher');


/**
 * L'instance de notre (re)démarreur de serveur (incluant un serveur livereload)
 */
var launcher = launcher('./build/application/index.js')

/**
 * La construction des sources côté serveur sont juste
 * une recopie du contenu de "construct" en excluant les sous-dossiers
 * client. On supprime aussi "server" et "shared" des chemins cible.
 */
gulp.task('build-server-sources', function () {
  gulp
    .src(['construct/**/*.js', '!construct/**/client/**/*'])
    .pipe(rework.remove(['server', 'shared']))
    .pipe(gulp.dest('build/application'))
    .pipe(launcher.changed())
})

/**
 * La construction des vues serveur se fait en gros comme pour les sources
 * à la différence près que l'on fusionne les dossiers views de chaques plugins
 * ce qui peut induire des collisions.
 */
gulp.task('build-server-views', function () {
  gulp
    .src(['construct/**/server/**/*.dust'])
    .pipe(rework.rebase('views'))
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
      .src(['construct/plugins/**/client/**/*.js', '!construct/**/vendors/**']),
    gulp
      .src(['construct/plugins/**/client/**/*.dust', '!construct/**/vendors/**'])
      .pipe(dust())
      )
  .pipe(concat('main.js'))
  .pipe(gulp.dest('build/public'))
  .pipe(launcher.livereload())
});

/**
 * Comme pour les sources, les styles sont d'abords construits dans le dossier build/tmp.
 * Chaque module pouvant avoir plusieurs feuilles de styles générées par SASS, toutes finissent
 * d'abord ici à l'issue de la compilation.
 */
gulp.task('build-public-styles', function () {
  gulp
    .src('construct/**/client/styles/*.scss')
    .pipe(sass({
      includePaths: [ './node_modules/sass-tools' ],
      errLogToConsole: true,
      sourceComments: 'map'}))
    .pipe(concat('main.css'))
    .pipe(gulp.dest('build/public'))
    .pipe(launcher.livereload())
})


/**
 * La construction des assets consiste juste à une fusion des divers dossiers client/assets des
 * plugins vers build/public/assets.
 */
gulp.task('build-public-assets', function () {
  gulp
    .src(['construct/plugins/**/client/assets/**/*'])
    .pipe(rework.rebase('assets'))
    .pipe(gulp.dest('build/public'))
    .pipe(launcher.livereload())
})

/**
 * La construction des libs externes consiste juste à une fusion des divers dossiers client/vendors des
 * plugins vers build/public/vendors.
 */
gulp.task('build-public-vendors', function () {
  gulp
    .src(['construct/plugins/**/client/vendors/**/*'])
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
gulp.task('build', [ 'build-server-sources', 'build-server-views', 'build-public' ], function () {
})


/**
 * Lance le serveur (node et livereload) puis se met en écoute des modification de fichier.
 */
gulp.task('watch', function () {
  gulp.watch('construct/**/client/styles/**/*.scss', ['build-public-styles']);
  gulp.watch(['construct/**/*.js', '!construct/**/client/**/*.js'], ['build-server-sources']);
  gulp.watch(['modules/**/*.js', '!modules/*/node_modules']).on('change', function() { launcher.restart(); });
  gulp.watch(['construct/**/client/**/*.js', 'construct/**/client/**/*.dust'], ['build-public-sources'])
  gulp.watch('construct/**/views/**/*.dust', ['build-server-views'])
  launcher.start();
})

gulp.task('doc', function() {
  gulp.src("construct/**/*.js")
    .pipe(jsdoc('./documentation-output'))
});
gulp.task('default', ['build', 'watch'])
