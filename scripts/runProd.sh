#!/bin/bash

dirInitial="$PWD"
dirApp=$(dirname $0)/../
PM2=_private/pm2.json5

function fin() {
  cd "$dirInitial"
}

function usage() {
  echo "Lance l'application en mode production (avec $PM2)"
  echo "option facultative"
  echo "  -c : pour indiquer un autre fichier de déploiement que $PM2"
  echo "  -h : afficher cette aide"
  echo "  -x : arrête les process pm2 sesatheque qui pourraient tourner"
  exit 0
}

function del() {
  delete="$(sed -nre "s/^[^#]*name[ \"':\t]+([a-zA-Z0-9_\-\.]+).*/\1/p;" $PM2 |head -1)"
  [ -z "$delete" ] && delete=sesatheque
}

# on veut exécuter fin avant de sortir
trap fin EXIT

cd "$dirApp"

# check des options
dest=''
delete=''
while getopts "c:hx" OPTION
do
  case $OPTION in
    c ) PM2="$OPTARG";;
    x ) del;;
    * ) usage;;
  esac
done

[ ! -f "$PM2" ] && echo "le fichier $PM2 n'existe pas" >&2 && exit 1

if [ -n "$delete" ]
then
  pm2 delete $delete
  exit 0
fi

pm2 startOrGracefulReload _private/pm2.json5 --env production
