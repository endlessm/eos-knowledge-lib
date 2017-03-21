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
Shards are our atomic unit for content delivery in Knowledge Apps. The `kermit` tool
inspects shards files. It is included in the com.endless.Platform flatpak runtime.

To list all records in a shard, use `kermit list <path_to_shard_file>`.

To retrieve a blob in a record, use `kermit dump <path_to_shard_file> <record_id> <blob_name>`,
where `<blob_name>` is commonly "data" or "metadata" to fetch those blobs for a given record.

To do a basic search over a shard, use `kermit grep <path_to_shard_file> <regex>` to
find any records that have metadata that matches that regex.

To get basic statistics and makeup of a shard file, use `kermit stat <path_to_shard_file>`.

Basin
--------
Basin is a tool for creating content shards. It is included in the com.endlessm.Sdk flatpak runtime.

To create a content shard, use `basin <path_to_input_json> <path_to_output_shard>`.

Eminem
------
Subscriptions are our mechanism for updating content in Knowledge Apps. A subscription
consists of multiple shards. The `eminem` tool inspects and manipulates subscriptions.
It is included in the com.endless.Platform flatpak runtime.

To retrieve the subscription ID(s) for a given app ID, use `eminem inspect-app-id <app_id>`.

After that, you can use `eminem freeze` and `eminem unfreeze` to marshal the state of
the subscription to a file that can be passed around for debugging. If you're seeing
bizarre content in a subscription and are afraid of the article "being lost" before you
can investigate, you can use `freeze` and `unfreeze` to capture the state of a subscription
and allow you to restore it for later.

Subscriptions work through a `manifest.json` file that contains the shards that make up
the current state of the subscription. While normally these manifest files are generated
by SOMA, if you are trying to build shards locally, it can be helpful to just be able to
drop an additional shard into a directory and regenerate the `manifest.json` file to include
the new shard. `eminem regenerate <directory>` allows you to do that.

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
Picard is a tool for previewing card types and arrangements. Content within our
knowledge apps is displayed in ContentGroups. Each content group has an
`arrangement` slot and each arrangement has a `card` slot. The arrangement +
card combo determine how content is displayed on a page.

Picard allows you to experiment with different combinations of arrangements
and card types to see what works best for your application.

#### Using

Simply enter `picard` into the terminal and hit enter. A GUI will appear,
allowing you to select both arrangement and card types at ease. There are also
convenience buttons for resizing the window, so you can see how your
arrangement will look at different resolutions.
