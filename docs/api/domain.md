---
short-description: Domains
...
# Domains

The convention used by this document is to explain paths in context of a
com.endlessm.example.en app, and with files starting from the bundle
root. So the file EKN_VERSION would be listed as
`/share/ekn/data/com.endlessm.example.en/EKN_VERSION`.

## Content ##

A set of content is called a "domain". The format of content shipped in
a domain is specified with a file,
`/share/ekn/data/com.endlessm.example.en/EKN_VERSION`, shipped in each
bundle, which contains a number. The currently supported version,
described in this document, is 3.

Domains have two major parts: 1. a Xapian database of records which is
used for finding records by their tags for category searches, or doing
queries based on article title or similar, and 2. one or more "shard
files" which contain actual content. The "shard" is a custom archive or
packfile format similar to .zip or .tar, but with Endless-specific
enhacements.

## Database ##

Each record is accompanied by JSON metadata describing its title, its
license, its tags, and other various kinds, along with content for it.
This metadata is placed in the shard, indexed by its ID, a 20-byte
identifier.

The motivation for this setup was to cut down on the use of Xapian for
critical path data and lookup, since at the time each use of Xapian
required an HTTP request to a separate server.

The Xapian database is embedded directly in the shard, allowing shard
files to be completely self-contained pieces of searchable data. It
is a Xapian single-file "Honey" database, containing a position table, a
postlist table, a record table, etc.

As an example of a metadata file, here's one:

```
    {
      "@type": "ekn://_vocab/ImageObject",
      "@id": "ekn:///96e17232727d9e86490160be01fbe45650d3ed90",
      "copyrightHolder": "LoKiLeCh",
      "caption": "Barbarossa chandelier",
      "contentType": "image/jpeg",
      "title": "File:Barbarossaleuchter.jpg",
      "tags": [
        "EknMediaObject"
      ],
      "license": "CC BY-SA 3.0",
      "sourceURI": "https://upload.wikimedia.org/wikipedia/commons/2/2a/Barbarossaleuchter.jpg",
      "lastModifiedDate": "2007-05-20T21:17:48",
      "matchingLinks": [
          "https://commons.wikimedia.org/wiki/File:Barbarossaleuchter.jpg",
          "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Barbarossaleuchter.jpg/220px-Barbarossaleuchter.jpg"
      ],
      "width": 757
      "height": 600,
    }
```

Fields like "@type" and "@id" are part of [JSON-LD](http://json-ld.org/),
a specification for hypermedia-style linked data.
We don't implement the JSON-LD specification entirely, but these schemas
are roughly based on equivalents from schema.org.

## Subscriptions ##

The main content is delivered through a mechanism known as
"subscriptions". The exact nature and workings of subscriptions is out
of scope of this document, but it allows content to be updated
independently from the application.

Each subscription contains a number of shard files, and a manifest to
list each of the shards as well as various metadata about the
subscription.

Each bundle comes preloaded with a set of
subscriptions, packed into the bundle at e.g.
`/share/ekn/data/com.endlessm.prensa_libre.es_GT/com.endlessm.subscriptions`.
This set of subscriptions is often the only thing that changes in an application update.

To help inspect applications and subscriptions, eos-knowledge-lib ships
with a tool called `eminem`. Please run `eminem` for more details on
usage.

