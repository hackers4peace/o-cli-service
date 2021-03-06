import gulp from 'gulp'
import { argv } from 'yargs'
import fs from 'fs'
import Storage from 'o-storage-forkdb'
import Dataset from 'o-utils-dataset'
import { promises as jsonld } from 'jsonld'
import _ from 'lodash'
import uuid from 'uuid'
import JsonldSerializer from 'rdf-serializer-jsonld'
import JsonldParser from 'rdf-parser-jsonld'

const parsers = {
  jsonld: new JsonldParser()
}

const serializers = {
  jsonld: new JsonldSerializer()
}

const prefixes = {
  sec: 'https://w3id.org/security#',
  ldp: 'http://www.w3.org/ns/ldp#',
  as: 'http://www.w3.org/ns/activitystreams#',
  foaf: 'http://xmlns.com/foaf/0.1/',
  schema: 'http://schema.org/'
}

const aliases = {
  rel: expand('ldp:hasMemberRelation'),
  rev: expand('ldp:isMemberOfRelation'),
  resource: expand('ldp:membershipResource')
}

function expand (string) {
  if (string.match(':')) {
    let [ prefix, term ] = string.split(':')
    return prefixes[prefix] + term
  } else if (aliases[string]) {
    return aliases[string]
  }
}

/*
 * prints document as expanded JSON-LD
 */
gulp.task('db:get', () => {
  console.log('db:get config: ', argv.config)
  console.log('db:get uri: ', argv.uri)
  let config = JSON.parse(fs.readFileSync(argv.config, 'utf8'))
  let db = new Storage(config.db)
  let dataset = new Dataset(db)
  dataset.getResource(argv.uri)
    .then((graph) => {
      return serializers.jsonld.serialize(graph)
    }).then((json) => {
      return console.log(JSON.stringify(json))
    }).catch((err) => {
      console.log(err)
    })
})

/*
 * assumes JSON-LD file
 * puts as Normalized RDF
 */
gulp.task('db:put', () => {
  console.log('db:put config: ', argv.config)
  console.log('db:put uri: ', argv.uri)
  console.log('db:put path: ', argv.path)
  let config = JSON.parse(fs.readFileSync(argv.config, 'utf8'))
  let db = new Storage(config.db)
  let dataset = new Dataset(db)
  let doc = JSON.parse(fs.readFileSync(argv.path, 'utf8'))
  parsers.jsonld.parse(doc)
    .then((graph) => {
      return dataset.updateResource(argv.uri, graph)
    }).then((resourceUri) => {
      return console.log('db:put saved:', resourceUri)
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
  let dataset = new Dataset(db)
  let doc = JSON.parse(fs.readFileSync(argv.path, 'utf8'))
  jsonld.expand(doc)
    .then((expanded) => {
      return Promise.all(_.map(expanded[0], (value, key) => {
        return parsers.jsonld.parse(value)
          .then((graph) => {
            return dataset.updateResource(key, graph)
          })
      }))
    }).then((arr) => {
      return arr.forEach((resourceUri) => {
        console.log('db:import saved: ', resourceUri)
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
  let dataset = new Dataset(db)
  let uriSpace = config.hapi.baseUri + uuid.v4() + '/'
  let identity = {
    '@id': uriSpace.replace(/\/$/, '#id'),
    '@type': [ expand('foaf:Person'), expand('schema:Person'), expand('as:Person') ],
    [ expand('schema:name') ]: argv.name
  }
  let containerUri = uriSpace + uuid.v4()
  let link = {
    [ expand('rel') ]: { '@id': expand('sec:publicKey') }
  }
  parsers.jsonld.parse(identity)
    .then((graph) => {
      return dataset.createResource(identity['@id'].replace('#id', ''), graph)
    }).then((resourceUri) => {
      console.log('idp:new created identity resource: ', resourceUri)
      return dataset.createLinkedContainer(containerUri, identity['@id'], link)
    }).then((containerUri) => {
      console.log('idp:new created container: ', containerUri)
      return dataset.getResource(containerUri)
    }).then((graph) => {
      return dataset.appendToResource(identity['@id'].replace('#id', ''), graph)
    }).then((resourceUri) => {
      console.log('idp:new added container to identity resource: ', resourceUri)
    }).catch((err) => {
      console.log('idp:new catched: ', err)
    })
})

/*
 * TODO:
 * * validate if in service namespace = config.hapi.baseUri
 * * validate if not already existing
 */
gulp.task('idp:add:key', () => {
  console.log('idp:add:key config: ', argv.config)
  console.log('idp:add:key identity: ', argv.identity)
  console.log('idp:add:key pem: ', argv.pem)
  let config = JSON.parse(fs.readFileSync(argv.config, 'utf8'))
  let pub = fs.readFileSync(argv.pem, 'utf8')
  let db = new Storage(config.db)
  let dataset = new Dataset(db)
  let uriSpace = argv.identity.replace('#id', '/')
  let key = {
    '@id': uriSpace + uuid.v4() + '#id',
    '@type': expand('sec:Key'),
    [ expand('sec:owner') ]: { '@id': argv.identity },
    [ expand('sec:publicKeyPem') ]: pub

  }
  parsers.jsonld.parse(key)
    .then((graph) => {
      return dataset.createResource(key['@id'].replace('#id', ''), graph)
    }).then((resourceUri) => {
      console.log('idp:add:key created resource for key: ', resourceUri)
      let link = {
        [ expand('rel') ]: expand('sec:publicKey')
      }
      return dataset.getLinkedContainerUri(argv.identity.replace('#id', ''), link)
    }).then((containerUri) => {
      return dataset.addMemberToContainer(containerUri, key['@id'])
    }).then((containerUri) => {
      console.log('idp:add:key updated container: ', containerUri)
    }).catch((err) => {
      console.log(err)
    })
})

gulp.task('idp:add:profile', () => {
  console.log('idp:add:profile config: ', argv.config)
  console.log('idp:add:profile identity: ', argv.identity)
  console.log('idp:add:profile profile: ', argv.profile)
  let config = JSON.parse(fs.readFileSync(argv.config, 'utf8'))
  let db = new Storage(config.db)
  let dataset = new Dataset(db)
  let profile = {
    '@id': argv.profile,
    '@type': [ expand('foaf:ProfileDocument'), expand('as:Profile') ],
    [ expand('foaf:primaryTopic') ]: { '@id': argv.identity }

  }
  let resourceUri = argv.identity.replace('#id', '')
  parsers.jsonld.parse(profile)
    .then((graph) => {
      return dataset.appendToResource(resourceUri, graph)
    }).then((uri) => {
      return console.log('idp:add:profile updated:', uri)
    }).catch((err) => {
      console.log(err)
    })
})

gulp.task('ws:new', () => {
  console.log('ws:new config: ', argv.config)
  console.log('ws:new identity: ', argv.identity)
  let config = JSON.parse(fs.readFileSync(argv.config, 'utf8'))
  let db = new Storage(config.db)
  let dataset = new Dataset(db)
  let uriSpace = config.hapi.baseUri + uuid.v4() + '/'
  let profile = {
    '@id': uriSpace + uuid.v4(),
    '@type': [ expand('foaf:ProfileDocument'), expand('as:Profile') ],
    [ expand('foaf:primaryTopic') ]: { '@id': argv.identity }
  }
  let containerUri = uriSpace + uuid.v4()
  let link = {
    [ expand('rev') ]:  [ { '@id': expand('as:actor') }, { '@id': expand('schema:agent') } ]
  }
  parsers.jsonld.parse(profile)
    .then((graph) => {
      return dataset.createResource(profile['@id'], graph)
    }).then((profileUri) => {
      console.log('ws:new created profile: ', profileUri)
      return dataset.createLinkedContainer(containerUri, argv.identity, link)
    }).then((containerUri) => {
      console.log('ws:new created container: ', containerUri)
      return dataset.getResource(containerUri)
    }).then((graph) => {
      return dataset.appendToResource(profile['@id'], graph)
    }).then((resourceUri) => {
      console.log('ws:new added container to profile: ', resourceUri)
    }).catch((err) => {
      console.log(err)
    })
})
