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
Autobahn is a utility for compiling yaml preset descriptions to json. It is
included in the com.endlessm.Sdk flatpak runtime.

Picard
------
Picard is a tool for previewing card types and arrangements. It is included in
the com.endlessm.Sdk flatpak runtime.
