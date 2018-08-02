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
 * Sésathèque est distribué dans l'espoir qu'il sera utile, mais SANS AUCUNE GARANTIE,
 * sans même la garantie tacite de QUALITÉ MARCHANDE ou d'ADÉQUATION à UN BUT PARTICULIER.
 * Consultez la GNU Affero General Public License pour plus de détails.
 * Vous devez avoir reçu une copie de la GNU General Public License en même temps que Sésathèque
 * (cf LICENCE.txt et http://vvlibri.org/fr/Analyse/gnu-affero-general-public-license-v3-analyse
 * pour une explication en français)
 */

'use strict'

const Ressource = require('../../constructors/Ressource')

const ressourceSchema = require('./EntityRessource.schema')
const properties = {...ressourceSchema.properties, dateArchivage: {instanceof: 'Date'}}
const required = [...ressourceSchema.required, 'dateArchivage']
const archiveSchema = {...ressourceSchema, properties, required}

module.exports = function (component) {
  component.entity('EntityArchive', function () {
    const EntityArchive = this
    /**
     * Idem {@link EntityRessource}, avec dateArchivage en plus et moins d'index
     * @name EntityArchive
     * @entity EntityArchive
     * @extends Ressource
     * @extends Entity
     */
    EntityArchive.construct(function (data) {
      if (!data) throw Error('constructeur d’archive appelé sans ressource ni archive')
      if (!data.rid || !data.hasOwnProperty('version')) throw Error('rid et version sont obligatoires pour archiver une ressource')
      const ressource = new Ressource(data)
      Object.assign(this, ressource)

      // on ajoute une date d'archivage si y'en a pas
      this.dateArchivage = data.dateArchivage || new Date()

      // on force l'unicité en imposant l'oid à partir de ressourceOid + version
      // mais à priori y'a plus l'oid de la ressource dans ce qu'on nous passe (pour forcer la création, et ne pas risquer de se mélanger les oid)
      // @todo à décommenter après update 37
      // const ressourceOid = this.rid.substr(this.rid.indexOf('/') + 1)
      // this.oid = ressourceOid + '-' + this.version
    })

    EntityArchive.validateJsonSchema(archiveSchema)

    EntityArchive
      .defineIndex('rid')
      .defineIndex('version')

    // @todo après l'update 37 passé partout, virer ce beforeStore et décommenter la génération de l'oid dans le constructeur
    EntityArchive.beforeStore(function (next) {
      // y'a eu un moment avec des enfants qui se sont retrouvés null…
      if (this.enfants) this.enfants = this.enfants.filter(e => e)
      // idem pour ça
      // if (!this.parametres || Array.isArray(this.parametres)) this.parametres = {}

      const ressourceOid = this.rid.substr(this.rid.indexOf('/') + 1)
      const archiveOid = ressourceOid + '-' + this.version
      const thisArchive = this
      if (thisArchive.oid !== archiveOid) {
        // faut virer cet entity avant d'appeler next qui va la recréer avec le bon oid
        thisArchive.delete((error) => {
          if (error) return next(error)
          thisArchive.oid = archiveOid
          next()
        })
      } else {
        next()
      }
    })
  })
}
