import gulp from 'gulp'
import { argv } from 'yargs'
import fs from 'fs'
import Storage from 'o-storage-forkdb'
import { promises as jsonld } from 'jsonld'
import _ from 'lodash'
import uuid from 'uuid'

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

function imp(db, doc) {
  return jsonld.expand(doc)
    .then((expanded) => {
      return Promise.all(_.map(expanded[0], (value, key) => {
        return put(db, key, value)
      }))
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
  imp(db, doc)
    .then((arr) => {
      return arr.forEach((result) => {
        console.log('db:import uri: ', result.uri)
        console.log('db:import hash:', result.hash)
      })
    }).catch((err) => {
      console.log(err)
    })
})

gulp.task('idp:new', () => {
  console.log('idp:new config: ', argv.config)
  console.log('idp:new name: ', argv.name)
  let config = JSON.parse(fs.readFileSync(argv.config, 'utf8'))
  let db = new Storage(config.db)
  let doc = { '@context': 'https://w3id.org/plp/v1' }
  let baseUri = config.hapi.baseUri + uuid.v4()
  let id = baseUri + '#id'
    let profile = {
    "id": id,
    "type": [ "foaf:Person", "schema:Person", "as:Person" ],
    "name": argv.name
  }
  let container = {
    "id": baseUri + '/' + uuid.v4(),
    "type": "Container",
    "resource": id,
    "rel": "sec:publicKey"
  }
  doc[baseUri] = [ profile, container ]
  doc[container.id] = [ container ]
  imp(db, doc)
    .then((arr) => {
      return arr.forEach((result) => {
        console.log('idp:new uri: ', result.uri)
        console.log('idp:new hash:', result.hash)
      })
    }).catch((err) => {
      console.log(err)
    })
})

gulp.task('ws:new', () => {
  console.log('ws:new config: ', argv.config)
  console.log('ws:new identity: ', argv.identity)
  let config = JSON.parse(fs.readFileSync(argv.config, 'utf8'))
  let db = new Storage(config.db)
  let doc = { '@context': 'https://w3id.org/plp/v1' }
  let baseUri = config.hapi.baseUri + uuid.v4()
  let profile = {
    "id": baseUri + '/' + uuid.v4(),
    "type": [ "foaf:ProfileDocument", "as:Profile" ],
    "describes": argv.identity
  }
  let container = {
    "id": baseUri + '/' + uuid.v4(),
    "type": "Container",
    "resource": argv.identity,
    "rev": [ "as:actor", "schema:agent" ]
  }
  doc[profile.id] = [ profile, container ]
  doc[container.id] = [ container ]
  imp(db, doc)
    .then((arr) => {
      return arr.forEach((result) => {
        console.log('ws:new uri: ', result.uri)
        console.log('ws:new hash:', result.hash)
      })
    }).catch((err) => {
      console.log(err)
    })
})
