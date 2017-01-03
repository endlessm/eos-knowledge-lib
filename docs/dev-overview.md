# Knowledge Apps Development Overview

Understanding the architecture and components of a knowledge app can be complicated. We
have a large number of GitHub repos and names which can be really confusing to the
uninformed. This page aims to be a guide to working on and understanding knowledge apps.

# Anatomy of a Knowledge App Bundle

Let's look at a simple knowledge app. Knowledge apps are shipped as part of a bundle, and
you can fetch a bundle from our app server here:
https://appupdates.endlessm.com/api/v1/. I chose com.endlessm.astronomy-es for its
relatively small file size.

 * bin/eos-astronomy-es - a simple wrapper script to launch the application.
 * share/applications/com.endlessm.astronomy-es.desktop - a desktop file which contains
   metadata about the application (its icon and name to the rest of the system)
 * share/dbus-1/services/com.endlessm.astronomy-es.service - a DBus service file which is
   used for launching the application.
 * share/ekn/data/astronomy-es/db/ - a Xapian database used for searching the application
 * share/ekn/data/astronomy-es/media.shard - a shard file containing all of the data in
   the application (HTML files, PDFs, images and videos, along with JSON-LD metadata
   describing each entry).
 * share/eos-astronomy-es/app.gresource - a GResource file containing assets used by the
   application, like the logo, background images, and also the "app.json", which describes
   the presentation of the application.
 * share/gnome-shell/search-providers/eos-astronomy-es-search-provider.ini - a search
   provider used for global desktop search.
 * share/icons/ - icon files to represent the application.

You might notice that there is no code -- all the code for every knowledge app is shipped
as part of the core system, in a framework called "eos-knowledge-lib". The knowledge
application bundle only contains the data and some metadata about how to display it.

# Git repos

Now that we've gone over the basic structure, let's look at what repos are used on a day
to day basis.

 * [eos-knowledge-lib](https://github.com/endlessm/eos-knowledge-lib) - Contains the
   framework shared by every knowledge app. Shipped on every device as part of the OS.
 * [eos-knowledge-apps](https://github.com/endlessm/eos-knowledge-apps/) - Contains the
   descriptions of applications (app.json) and manifest for what data (db.json) should be
   inside the app. This repo builds bundles, like the one above, which are eventually
   shipped.
 * [endless-content-factory](https://github.com/endlessm/endless-content-factory) - Contains
   tools to build the database and shard file from a db.json.
 * [eos-shard](https://github.com/endlessm/eos-shard) - Contains an "EosShard" library
   which knows how to interpret the "shard file format". Used by both
   eos-knowledge-db-build (to build the shard on our servers) and eos-knowledge-lib (to
   read from the shard at runtime).

# Useful Terms

 * EOS - **EndlessOS**
 * EKN - **Endless KNowledge** - the overarching project for our Knowledge App Framework
   and Build Process.
 * KA - **Knowledge App**
 * SOMA - Codename for a new project which contains a rethink of our entire application
   framework and build system. Currently being developed.

# Building a Knowledge App

To build a knowledge app, the process can be a little convoluted. You will need checkouts
of two repos: eos-knowledge-apps and endless-content-factory. You will also need a relatively
recent version of eos-shard, so if you do not have it, build that from git as well.

`endless-content-factory` is a microservices-oriented system designed around cloud cluster
deployments, but there is limited support for running some of the services locally on your
development machine.

## db-build

The first microservice is `db-build`.

To build and install our build scripts for `db-build`, I use:

```
$ # Prerequisites
$ sudo apt-get install python-setuptools gobject-introspection python-gi python-xapian gir1.2-xapian-1.0
$ cd endless-content-factory/src/eos-knowledge-db-build
$ python setup.py install --user
```

This will install our scripts in `~/.local/bin/` and the library in
`~/.local/lib/python2.7/`.

The main script is called `get_app_content.py` and is the main powerhouse
behind our build process. This is in charge of fetching articles and
media, transforming and normalizing the content, sometimes calling out
to our lambda service, creating a Xapian database, and arranging and
massaging all the data so it is ready for packing.

## lambda

Another microservice, which is a helper microservice for our build process, is
lambda, which performs HTML sanitization and cleanup. It's written in node
because it's slightly more natural to use JavaScript for DOM manipulation.

To deploy it in a test system, use:

```
$ cd endless-content-factory/src/eos-lambda-services
$ # Prerequisites
$ sudo apt-get install npm
$ sudo npm install
$ npm run mock-server -- -f
```

This will install all of our requirements and then start up a server that
`db-build` can talk to.

## eos-knowledge-lib

This repo contains the building blocks of all eos-knowledge-apps including the UI, Xapian
interfaces, and any other common items between the apps

To build the eos-knowledge-lib:

```
$ sudo apt-get build-dep eos-knowledge-0
$ ./autogen.sh
```

To run tests after building:

```
$ # Install Jasmine
$ sudo apt-get isntall jasmine-gjs
$ # Many tests require a display so if you're connecting over SSH, export the DISPLAY variable
$ export DISPLAY=:0.0
$ make check
```

## eos-knowledge-apps

This repo contains a bunch of Makefile scripts and magic that use this
script to build each app individually. The eos-knowledge-apps repo
contains a number of complicated switches to build knowledge
apps. Let's build a single app, and to save time, don't download any
media (images, sounds, videos), and only include 10 articles.

```
$ sudo apt-get build-dep eos-knowledge-0
$ APP_ID=com.endlessm.animals-en NUM_ARTICLES=10 ./autogen.sh --enable-database=no-media
checking for blah...
$ DB_BUILD_USE_MOCK=1 make -j5
```

Yes, we are quite inconsistent between configure arguments,
environment variables during configure, and environment variables
during make. We should probably fix that some day.

This should put our build scripts into motion, which will download
everything specified in the db.json from Wikipedia and process it by
uploading it to your lambda instance, running locally, and then
process it some more. The separation of concerns between db-build and
lambda is a bit messy right now, but should be more clear as SOMA
develops.

If you are downloading a lot of data, please use our internal build
proxy so that the Wikimedia Foundation does not get mad. You can do
this with the `--enable-proxy` configure argument to
eos-knowledge-apps (caveat: you'll need to either be in the SF office
network, or connected to it via VPN for the proxy to work).

## Useful tools for development

# kermit
`kermit` is a tool to explore shard files and extract metadata from them. You can find this tool in `eos-knowledge-0-bin` package.

```
$ kermit grep ~/install/share/ekn/data/animals-en/media.shard Elephant
42bf022e85a8125950006b0c6551059be5f93b79 - image/jpeg - "File:African Elephant distribution map.svg"
7755613999585b5fd2e4fa09120ebe163c1ef019 - image/jpeg - "File:African Bush Elephant Skull.jpg"
7985071cfaf383912a5ac011fc2bc31734d15cea - image/jpeg - "File:African Bush Elephants.jpg"
7d967898cf519f144e231b0375573ec75658b994 - image/jpeg - "File:African Bush Elephant.jpg"
8b6814b2634cf78d609c44ba024d29361bba4c54 - text/html - "African Bush Elephant"
efa7ca51e93495d9b77849e315fe3ad0c7f7b059 - image/jpeg - "File:Elephant, Selous Game Reserve.jpg"

$ kermit dump ~/install/share/ekn/data/animals-en/media.shard 7755613999585b5fd2e4fa09120ebe163c1ef019 metadata | python -m json.tool
{
    "@context": "ekn://_context/ImageObject",
    "@id": "ekn://animals-en/7755613999585b5fd2e4fa09120ebe163c1ef019",
    "@type": "ekn://_vocab/ImageObject",
    "caption": "",
    "contentType": "image/jpeg",
    "contentURL": "7755613999585b5fd2e4fa09120ebe163c1ef019.jpeg",
    "copyrightHolder": "FSV",
    "encodingFormat": "image/jpeg",
    "license": "CC BY-SA 3.0",
    "sourceURI": "https://upload.wikimedia.org/wikipedia/commons/0/09/African_Bush_Elephant_Skull.jpg",
    "title": "File:African Bush Elephant Skull.jpg"
}

$ kermit query animals-en "african"
8b6814b2634cf78d609c44ba024d29361bba4c54 - text/html - "African Bush Elephant"
d117aee6a4cbd916e50f14fb5bfcf2870c817fc0 - text/html - "African Grey Parrot"
3819dfa2bbd9cc31e2184c004d9ba1765c14145a - text/html - "African Penguin"
```
