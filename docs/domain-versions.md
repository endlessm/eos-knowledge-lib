# Domain versions

The convention used by this document is to explain paths in context of domain
"example-en", and with files starting from the bundle root. So the file EKN_VERSION would
be listed as `/share/ekn/data/example-en/EKN_VERSION`.

Since knowledge-lib is part of the core OS, and is updated separately from application
bundles, this means that knowledge-lib needs some form of backwards compatibility with
bundles, even if we change parts of the bundles.

A set of content is called a "domain". The format of content shipped in a domain is
specified with a file, `/share/ekn/data/example-en/EKN_VERSION`, shipped in each bundle,
which contains a number. If it's missing, it's assumed to be a version 1 domain.

Domains have two major parts: 1. a Xapian database of records which is used for finding
records by their tags for category searches, or doing queries based on article title or
similar, and 2. a media directory which contains actual data.

Each record has with it a series of JSON metadata describing its ID, its title, its
license, its tags, and other various kinds, along with content for it.

The code that "parses" these domains is in js/search/domain.js.

Note that other components are versioned similarly, for instance the app.json used by the
modular system to define the app version, or the shard file format used by some domain
versions. There is currently no correlation between versions, and e.g. a V2 app.json
could be used with a V1 domain.

## Version 1

The Xapian database is located at `/share/ekn/data/example-en/db/`. It is a folder which
contains a Xapian "Chert" database, containing a position table, a postlist table, a
record table, etc.

The bodies of documents in the Xapian database are the metadata JSON as described
before. Xapian doesn't have native JSON object support; the document bodies to Xapian's
view are opaque strings.

For HTML articles, which have text as bodies, there is a key in this JSON, "articleBody",
which contain the HTML loaded by the web view.

Images (along with PDF articles) still have records in the Xapian database, but instead
of an "articleBody", they are given a key called "contentURL", which is not a URL but a
relative path from the media directory. The media directory is located at
`/share/ekn/data/example-en/media`. To cut down on directory pollution, much like git, we
use a prefix-directory scheme, where the two first digits of the hash are pulled out into
a different directory. As an example of a media metadata file, here's one, taken from the
travel-en domain:

    {
      "@type": "ekn://_vocab/ImageObject",
      "@id": "ekn://travel-en/7ec07025139a5c22",
      "@context": "ekn://_context/ImageObject",
      "copyrightHolder": "Lokilech",
      "caption": "The Barbarossa chandelier under the dome of the Octagon",
      "encodingFormat": "image/jpeg",
      "title": "File:Barbarossaleuchter.jpg",
      "tags": [
        "EknMediaObject"
      ],
      "language": "en",
      "license": "GNU Free Documentation License",
      "sourceURI": "http://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Barbarossaleuchter.jpg/799px-Barbarossaleuchter.jpg",
      "contentURL": "7e/c07025139a5c22.jpeg"
    }

Fields like "@type", "@context" and "@id" are part of [JSON-LD](http://json-ld.org/),
a specification for hypermedia-style linked data.

## Version 2

Domain version 2 makes three major changes from version 1.

1. For HTML articles, the document has been pulled out of the metadata JSON, and placed
into a separate file, similar to how other media files work.

2. The media directory has been replaced with one file, the "shard". The "shard" is a
custom archive or packfile format similar to .zip or .tar, but with Endless-specific
enhacements. The shard file for V2 domains is located at
`/share/ekn/data/example-en/media.shard`.

3. The Xapian database does not contain the metadata JSON as record bodies
anymore. Instead, this metadata is placed in the shard, indexed by their "EKN ID",
a 20 byte identifier.

The motivation for these changes was to cut down on the use of Xapian for critical path
data and lookup, since each use of Xapian requires an HTTP request to a separate
server.

## Version 3

Domain version 3 is a radical departure from versions 1 and 2. The main content is
delivered through a mechanism known as "subscriptions". The exact nature and workings of
subscriptions is out of this document, but it allows content to be updated independently
from the application.

Each subscription contains a number of shards, as introduced in Domain Version 2, and a
manifest to list each of the shards as well as various metadata about the
subscription. However, V3 shards have one major difference -- the Xapian DB is embedded
directly in the shard, allowing shard files to be completely self-contained pieces of
searchable data.

The plumbing that contains the "tie" between an application and its set of subscriptions
is in a file called `subscriptions.json`, placed in the same directory as
`EKN_VERSION`. For instance, for the Prensa Libre app, our first subscriptions-based
application, the `subscriptions.json` file is located in
`/share/ekn/data/prensa-libre-es_GT/subscriptions.json`.

The file simply contains a list of subscriptions, like:

```
{
    "subscriptions": [
        {"id": "10521bb3a18b573f088f84e59c9bbb6c2e2a1a67"}
    ]
}
```

While the `subscriptions.json` file gives the appearance that an application can support
more than one subscription, currently, eos-knowledge-lib only supports one subscription.

The shards are downloaded and stored in the user's home directory, in the directory
`~/.local/share/com.endlessm.subscriptions/`. Each subscription ID is given its own
directory for the manifest and shards.

While subscriptions can be downloaded from Endless's servers at any given time, each
bundle can also come preloaded with a set of subscriptions, packed into the bundle at
e.g. `/share/ekn/data/prensa-libre-es_GT/com.endlessm.subscriptions`. On first start of
the application, if missing, the manifest and shards will be symlinked into the user's
home directory.

At runtime, the user's computer checks for updates to each subscription and downloads new
shards in the background.

To help inspect Domain V3 applications and subscriptions, eos-knowledge-lib ships with a
tool called `eminem`. Please run `eminem` for more details on usage.

