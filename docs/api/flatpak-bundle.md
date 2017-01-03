# Anatomy of a Knowledge App Flatpak Bundle

Let's look at a simple knowledge app. Knowledge apps are shipped as part of a bundle, and
you can fetch a bundle from our Flatpak repository here:
`flatpak install com.endlessm.astronomy.es eos3`. I chose com.endlessm.astronomy.es for its
relatively small file size.
You can examine the files included by looking in `/var/lib/flatpak/app/com.endlessm.astronomy.es/current/active/files`:

 * bin/com.endlessm.astronomy.es - a simple wrapper script to launch the
   application.
 * share/app-info/ - AppStream metadata used to show the application in
   the app center.
 * share/applications/com.endlessm.astronomy.es.desktop - a desktop file
   which contains
   metadata about the application (its icon and name to the rest of the system)
 * share/dbus-1/services/com.endlessm.astronomy.es.service - a DBus
   service file which is
   used for launching the application.
 * share/ekn/data/com.endlessm.astronomy.es/ - the application's
   content. The format is explained in `domain-versions.md`. In any case
   this includes a shard file containing all of the data in
   the application (HTML files, PDFs, images and videos, along with JSON-LD metadata
   describing each entry).
 * share/com.endlessm.astronomy.es/app.gresource - a GResource file
   containing assets used by the
   application, like the logo, background images, and also the "app.json", which describes
   the presentation of the application.
 * share/gnome-shell/search-providers/com.endlessm.astronomy.es-search-provider.ini -
   a search
   provider used for global desktop search.
 * share/icons/ - icon files to represent the application.

You might notice that there is no code -- all the code for every knowledge app is shipped
as part of the core system, in a framework called "eos-knowledge-lib". The knowledge
application bundle only contains the data and some metadata about how to display it.
