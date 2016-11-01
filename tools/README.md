Tools
=====

KA Customizer
-------------
KA Customizer is a small GUI tool to tweak modules and themes of a knowledge
app.

#### Installing
To install, open a terminal and copy and enter the following command.
```
bash -exc "$(wget https://raw.githubusercontent.com/endlessm/eos-knowledge-lib/master/tools/ka-customizer-installer -O -)"
```
Installing may take a while! The latest unstable versions of our flatpak
runtimes (all the libraries our apps need to run), will need to be downloaded.
When installing is done, you should see an icon called KA Customizer on your
desktop. Clicking it will open up the tool.

#### Using
The tool will run your app content against the very latest version of
eos-knowledge-lib. If you don't have any knowledge apps installed, you won't
be able to run this tool, so download some from the app store first.

The only required thing to select in the KA Customizer dialog is the knowledge
app to run. Other than that, only tweak what you need to tweak!

Kermit
------
Kermit is a shard inspection utility for Knowledge Apps. It is included in the
com.endless.Platform flatpak runtime.

Eminem
------
Eminem is a subscription inspection utility for Knowledge Apps. It is included
in the com.endless.Platform flatpak runtime.

Autobahn
--------
Autobahn is a utility for compiling YAML app descriptions, such as those included in the `data/preset/` directory, to the JSON format loaded by eos-knowledge-lib.
It is included in the com.endlessm.Sdk flatpak runtime.

The YAML app description format is meant to be easy to write by hand, and includes some shorthands for convenience.
Autobahn compiles it into the more machine-readable JSON format.

Usually you will not have to use this tool yourself, it will be called automatically when starting an app with a custom app description.

#### Using
Simple command to see how it works:
```
autobahn data/preset/encyclopedia.yaml
```
The above command spits out a big JSON object that is meant to be supplied to eos-knowledge-lib at the `resource:///app/app.json` path.

If you want to write your own YAML app description that imports one of the YAML presets, you will need to use the `--include` option:
```
echo '!import encyclopedia' | autobahn -I data/preset
```

There are other options for internationalizing app descriptions, see `autobahn --help`.

Picard
------
Picard is a tool for previewing card types and arrangements. It is included in
the com.endlessm.Sdk flatpak runtime.
