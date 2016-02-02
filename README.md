# o-cli-service

## features

### storage
* put resource ( to fork db )
 * [x] as normalized RDF
* get resource ( from fork db )
 * [x] as expanded JSON-LD
* [x] import data ( to fork db from JSON-LD with graph names )
* [ ] export data ( from fork db - the whole account to JSON-LD with graph names )

### identity
* [x] create idp account ( with default container rel: "sec:publicKey" )
 * /(:uuid)#id - identity
 * /(:uuid)/ - dataset, void:uriSpace, ws:uriPrefix
 * /(:uuid)/(:uuid) - Resources/Containers in dataset
* [x] add profile (in a workspace) for identity

### workspace
* [x] create workspace account ( with containers, including one for activities rev: "as:actor" )
 * /(:uuid)/ - dataset, void:uriSpace, ws:uriPrefix
 * /(:uuid)/(:uuid) - Resources/Containers in dataset

### misc
* [ ] create a new container in an existing dataset
* [ ] verify signature

## usage

### db:get

```
gulp db:get --config /path/to/service/config.json --uri https://foo.example
```

### db:put

```
gulp db:put --config /path/to/service/config.json --uri https://foo.example --path /path/to/file.jsonld
```

### db:import

```
gulp db:import --config /path/to/service/config.json --path /path/to/file.jsonld
```

### idp:new

```
gulp idp:new --config /path/to/service/config.json --name 'Justine Testing'
```

### idp:add:key

```
gulp idp:add:key --config /path/to/service/config.json --identity https://idp.example/ba7afc12-99fe-4f19-bbc1-4b18914f2cf9#id --pem /path/to/pubkey.pem
```

### idp:add:profile

```
gulp idp:add:profile --config /path/to/service/config.json --identity https://idp.example/ba7afc12-99fe-4f19-bbc1-4b18914f2cf9#id --profile https://ws.example/82301ed4-fe79-4372-8b04-e5a9d45101be/9bfa1cae-a330-4686-b930-daa3d1f2c428
```

### ws:new

```
gulp ws:new --config /path/to/service/config.json --identity https://idp.example/ba7afc12-99fe-4f19-bbc1-4b18914f2cf9#id
```

## dependencies

### o-*

* o-utils-dataset
* o-storage-forkdb
* o-api-client

### common
* gulp
* yargs
* lodash
* uuid
* jsonld
* jsonld-signatures
