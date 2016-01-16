# o-cli-service

## features

* put resource ( to fork db )
 * [x] as normalized RDF
* get resource ( from fork db )
 * [x] as expanded JSON-LD
 * [ ] as compacted JSON-LD
* [ ] import data ( to fork db from JSON-LD with graph names )
* [ ] export data ( from fork db - the whole account to JSON-LD with graph names )
* [ ] create idp account ( with default container rel: "sec:publicKey" )
 * /(:uuid)#id - identity
 * /(:uuid)/ - dataset, void:uriSpace, ws:uriPrefix
 * /(:uuid)/(:uuid) - Resources/Containers in dataset
* [ ] create workspace account ( with containers, including one for activities rev: "as:actor" )
 * /(:uuid)/ - dataset, void:uriSpace, ws:uriPrefix
 * /(:uuid)/(:uuid) - Resources/Containers in dataset
* [ ] create a new container in an existing dataset
* [ ] verify signature

## usage

### put

```
gulp db:put --config /path/to/service/config.json --uri https://foo.example --path /path/to/file.jsonld
```

### get

```
gulp db:get --config /path/to/service/config.json --uri https://foo.example
```

## dependencies

### o-*

* o-api-client

### common
* gulp
* yargs
* lodash
* level
* forkdb
 * forkdb-promised
* node-uuid
* jsonld
* jsonld-signatures
