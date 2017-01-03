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
