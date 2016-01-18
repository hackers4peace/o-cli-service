import gulp from 'gulp'
import { argv } from 'yargs'
import fs from 'fs'
import Storage from 'o-storage-forkdb'
import { promises as jsonld } from 'jsonld'
import _ from 'lodash'

function put(db, uri, doc) {
  return jsonld.normalize(doc, { algorithm: 'URDNA2015', format: 'application/nquads' })
    .then((normalized) => {
      return db.put(uri, normalized)
    }).then((hash) => {
      return {
        uri: uri,
        hash: hash
      }
    })
}

/*
 * assumes JSON-LD file
 * puts as Normalized RDF
 */
gulp.task('db:put', () => {
  console.log('db:put config: ', argv.config)
  console.log('db:put path: ', argv.path)
  console.log('db:put uri: ', argv.uri)
  let config = JSON.parse(fs.readFileSync(argv.config, 'utf8'))
  let db = new Storage(config.db)
  let doc = JSON.parse(fs.readFileSync(argv.path, 'utf8'))
  put(db, argv.uri, doc)
    .then((result) => {
      return console.log('db:put hash:', result.hash)
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
  let config = JSON.parse(fs.readFileSync(argv.config, 'utf8'))
  let db = new Storage(config.db)
  db.get(argv.uri)
    .then((doc) => {
      return jsonld.fromRDF(doc, { format: 'application/nquads' })
    }).then((expanded) => {
      return console.log(JSON.stringify(expanded))
    }).catch((err) => {
      console.log(err)
    })
})

/*
 * assumes JSON-LD file with named graphs
 * puts each graph as Normalized RDF
 */
gulp.task('db:import', () => {
  console.log('db:import config: ', argv.config)
  console.log('db:import path: ', argv.path)
  let config = JSON.parse(fs.readFileSync(argv.config, 'utf8'))
  let db = new Storage(config.db)
  let doc = JSON.parse(fs.readFileSync(argv.path, 'utf8'))
  jsonld.expand(doc)
    .then((expanded) => {
      return Promise.all(_.map(expanded[0], (value, key) => {
        return put(db, key, value)
      }))
    }).then((arr) => {
      return arr.forEach((result) => {
        console.log('db:import uri: ', result.uri)
        console.log('db:import hash:', result.hash)
      })
    }).catch((err) => {
      console.log(err)
    })
})
