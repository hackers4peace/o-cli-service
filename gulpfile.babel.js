import gulp from 'gulp'
import { argv } from 'yargs'
import fs from 'fs'
import level from 'level'
import forkdb from 'forkdb'
import forkp from 'forkdb-promise'
import { promises as jsonld } from 'jsonld'

/*
 * TODO support aliasing services in local config
 */
function getDb (configPath) {
  let config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
  let fdb = forkdb(level(config.db.level), {dir: config.db.fork})
  return {
    put: (uri, doc) => {
      return forkp.put(fdb, uri, doc)
    },
    get: (uri) => {
      return forkp.get(fdb, uri)
    }
  }
}

/*
 * assumes JSON-LD file
 * puts as Normalized RDF
 */
gulp.task('db:put', () => {
  console.log('db:put config: ', argv.config)
  console.log('db:put path: ', argv.path)
  console.log('db:put uri: ', argv.uri)
  let db = getDb(argv.config)
  let doc = JSON.parse(fs.readFileSync(argv.path, 'utf8'))
  jsonld.normalize(doc, { algorithm: 'URDNA2015', format: 'application/nquads' })
    .then((normalized) => {
      return db.put(argv.uri, normalized)
    }).then((hash) => {
      return console.log('db:put hash:', hash)
    }).catch((err) => {
      console.log(err)
    })
})

/*
 * gets Normalized RDF
 * prints as expanded JSON-LD
 * TODO: add support for JSON-LD compaction using --context
 */
gulp.task('db:get', () => {
  console.log('db:get config: ', argv.config)
  console.log('db:get uri: ', argv.uri)
  let db = getDb(argv.config)
  db.get(argv.uri)
    .then((doc) => {
      return jsonld.fromRDF(doc, { format: 'application/nquads' })
    }).then((expanded) => {
      return console.log(expanded)
    }).catch((err) => {
      console.log(err)
    })
})
