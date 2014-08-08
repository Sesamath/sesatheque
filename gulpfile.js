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

var gulp   = require('gulp');
var sass   = require('gulp-sass');
var jsdoc  = require('gulp-jsdoc');
var jshint = require('gulp-jshint');
var fs     = require('fs');
require('lassi');

gulp.task('compile-sass', function () {
  gulp
    .src('construct/**/public/styles/*.scss', {base: './'})
    .pipe(sass({
      errLogToConsole: true,
      sourceComments: 'map'}))
    .pipe(gulp.dest('./'));
})

gulp.task('watch', function() {
  var launcher = new lassi.tools.Launcher({ path: 'construct/index.js' });
  launcher.observe('config').including('**/*.js').restart();
  launcher.observe('construct').including('**/*.+(js|dust)').excluding('**/public').restart();
  launcher.observe('construct').including('**/public/styles/**/*.scss').do(function() { gulp.start('compile-sass') });
  launcher.observe('construct').including('**/public/**/*.+(css|js)').reload();
  launcher.observe('node_modules/lassi').including('**/*.js').excluding('**/node_modules').restart();
  launcher.start();
})


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
});


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
  if (fs.lstatSync(file).isFile()) {
    fs.unlinkSync(file)
    console.log(file +' effacé')
  }
  // et les logs
  var dirLogs = './logs'
  if (fs.existsSync(dirLogs) && fs.lstatSync(dirLogs).isDirectory()) {
    fs.readdirSync(dirLogs).forEach(function (log) {
      file = dirLogs + '/' + log
      if (fs.lstatSync(file).isFile()) {
        fs.unlinkSync(file);
        console.log(file +' effacé')
      }
    })
  } else {
    console.log('pas de dossier ' +dirLogs)
  }
});

gulp.task('reset', ['purge', 'compile-sass', 'watch'])

gulp.task('default', ['compile-sass', 'watch'])

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