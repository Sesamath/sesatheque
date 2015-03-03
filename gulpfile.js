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
"use strict"

var gulp   = require('gulp')
var spawn   = require('child_process').spawn
var jshint = require('gulp-jshint')
var fs     = require('fs')
var del     = require('del')
var childProcess = require('child_process')
require('lassi')

var config = require('./config')

// gulp.task('watch', function() {
//  var launcher = new lassi.tools.Launcher({ path: 'construct/index.js' });
//  launcher.observe('config').including('**/*.js').restart();
//  launcher.observe('construct').including('**/*.+(js|dust)').excluding('**/public').restart();
//  launcher.observe('construct').including('**/public/styles/**/*.scss').do(function() { gulp.start('compile-sass') });
//  launcher.observe('construct').including('**/public/**/*.+(css|js)').reload();
//  launcher.observe('node_modules/lassi').including('**/*.js').excluding('**/node_modules').restart();
//  launcher.start();
//})

/**
 * Lance le serveur (node et livereload) puis se met en écoute des modification de fichier.
 */
gulp.task('launch', function () {
  var server
  gulp.watch(['construct/**/*', '!construct/**/public/**/*']).on('change', function() {
    server.restart();
  });
  server.start();
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
  fs.readdirSync(taskDir).forEach(function (file) {
    var name;
    if (file.substr(-3) === '.js') {
      name = file.substr(0, file.length -3);
      gulp.task(name, require(taskDir + '/' + file));
    }
  })
}

gulp.task('purge', function() {
  // on efface la session
  var file = './temp/sessions.json'
  if (fs.existsSync(file) && fs.lstatSync(file).isFile()) {
    fs.unlink(file, 2)
    console.log(file +' effacé')
  }
  // et les logs
  var dirLogs = './logs'
  if (fs.existsSync(dirLogs) && fs.lstatSync(dirLogs).isDirectory()) {
    fs.readdirSync(dirLogs).forEach(function (log) {
      file = dirLogs + '/' + log
      if (fs.lstatSync(file).isFile()) {
        fs.truncateSync(file, 0);
        console.log(file +' effacé')
      }
    })
  } else {
    console.log('pas de dossier ' +dirLogs)
  }
});

gulp.task('reset', ['purge', 'compile-sass', 'watch'])

gulp.task('default', ['launch'])

/**
 * On conserve ce bout de code qui pourrait resservir
 * Tâche qui efface build
 * /
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
/* */