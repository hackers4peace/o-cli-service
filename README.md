# o-cli-service

## features

* [ ] put resource ( to fork db )
* [ ] get resource ( from fork db )
* [ ] import data ( to fork db from JSON-LD with graph names )
* [ ] export data ( from fork db - the whole account to JSON-LD with graph names )
* [ ] create idp account ( with default container rel: "sec:publicKey" )
 * /(:uuid)#id - identity
 * /(:uuid)/ - dataset, void:uriSpace, ws:uriPrefix
 * /(:uuid)/(:uuid) - Resources/Containers in dataset
* [ ] create pod account ( with containers, including one for activities rev: "as:actor" )
 * /(:uuid)/ - dataset, void:uriSpace, ws:uriPrefix
 * /(:uuid)/(:uuid) - Resources/Containers in dataset
* [ ] create a new container in an existing dataset
* [ ] verify signature

## dependencies

### o-*

* o-api-client

### common
* gulp
* yargs
* lodash
* level
* forkdb
 * sprom ( promises wrapper )
* node-uuid
* jsonld-signatures
