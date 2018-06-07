# Electron offline content tools #

> **NOTE**: This tutorial is a draft and may be out of date.
> We aren't currently supporting this workflow, but will happily accept pull requests to fix mistakes in the tutorial.

EndlessOS is all about preloaded, searchable content.
You can plug into the OS's content libraries through Electron to write applications that can function without an internet connection.
This tutorial will get you started writing one.

This tutorial will build off the [Developing Electron applications on EndlessOS](electron-tutorial) tutorial; read that one first.
We will assume electron-forge has already been installed.

## Installing and running the Electron knowledge dev app ##

We will install another development app, `com.endlessm.ElectronKnowledgeDevApp`, to get our offline content libraries up and running.
Pull open a terminal and run
```sh
flatpak install https://s3-us-west-2.amazonaws.com/electron-flatpak.endlessm.com/electron-knowledge-dev-app-master.flatpakref
```

You can run the dev app to pull up a bash shell
```sh
flatpak run com.endlessm.ElectronKnowledgeDevApp
```
With this command you are now running inside a Flatpak sandbox with all the development tools needed.
The rest of the commands in this tutorial will be run from inside the sandbox.

## Cloning the application boilerplate ##

Building a knowledge application takes a fair amount of scaffolding to set up.
We've set up a boilerplate repository that will quickly get you up and running.
Let's clone the boilerplate repository:

```sh
git clone https://github.com/endlessm/eos-knowledge-electron-boilerplate my-new-electron-app
cd my-new-electron-app
```

Under the hood, the boilerplate is just combining a few tools to make a functional app.

 - [electron-forge] for flatpak packaging
 - [eos-knowledge-downloader-node] for downloading application content
 - [eos-knowledge-content-node] for displaying content in the application
 - [node-dbus] for global search integration

Feel free to read about any of these tools individually if the boilerplate does not meet your needs.

[electron-forge]: https://github.com/electron-userland/electron-forge
[eos-knowledge-downloader-node]: https://github.com/endlessm/eos-knowledge-downloader-node
[eos-knowledge-content-node]: https://github.com/endlessm/eos-knowledge-content-node
[node-dbus]: https://github.com/Shouqun/node-dbus

## Building the test application ##

You can get started running the application with just a few commands:
```sh
npm install
npm run download
npm start
```

That should pull open your new application window.
To build the application as a Flatpak, just run
```sh
npm run make
```
and the Flatpak bundle will be output at `out/make/org.example.AppName_master_x86_64.flatpak`.

## Write some application code ##

You are now up and running, but there's still basically nothing in our test app window.

There is a [`react` branch][react-branch] on the boilerplate repo which shows an example of building a content application using [React].
Looking through that example might help you get started, and may even be a good place to code from if you plan on using React.

All applications should support loading a query and an individual article when the application is launched from EndlessOS global search.
You can see two method stubs for this already in `src/index.html`.
These should be filled in as part of writing your code.

[react-branch]: https://github.com/endlessm/eos-knowledge-electron-boilerplate/commits/react
[React]: https://facebook.github.io/react/

## Using Endless's offline content APIs ##

To query for and display your application content, you will be using the [eos-knowledge-content-node] NPM module.
The GitHub page has documentation, take some time to read it.
The `src/index.html` page in our boilerplate has an example of getting search results from a query string and loading an individual article.
Both will be needed by your application.

The `eos-knowledge-content` library is set up in the Electron app's [main process]. To use it from the web process you will need to use electron's [remote API].
```javascript
const remote = require('electron').remote
const Eknc = remote.require('eos-knowledge-content')
```

The boilerplate will also set up a `ekn://` uri scheme to quickly load file content from the application. For example to load an image for a `MediaObjectModel`
```javascript
element.style.backgroundImage = `url(${model.ekn_id})`
```

[eos-knowledge-content-node]: https://github.com/endlessm/eos-knowledge-content-node
[main process]: https://github.com/electron/electron/blob/master/docs/tutorial/quick-start.md#main-process
[remote API]: https://github.com/electron/electron/blob/master/docs/api/remote.md

## Using different content ##

The boilerplate application is set up to use the Myths and Legends application content as a starting place.
You will likely want to display different content in your app.

The boilerplate will currently download its content using the [eos-knowledge-downloader-node] tool.
See the GitHub page for documentation.
Content is dowloaded by reading in an `app.json` file which describes the application's content.
You can change the default content application by modifying the `in/app.json` file.
After modifying the file, just run
```sh
npm run download
```
to update your content.

Alternately you may want to power multiple knowledge apps with the same front-end code you built.
You can build many Flatpaks with the same front-end and different `app.json` files.

You can use the
```
./template [app json path or uri]
```
script in the base of the boilerplate repo to quickly build a lot of Flatpaks with the same frontend code.

[eos-knowledge-downloader-node]: https://github.com/endlessm/eos-knowledge-downloader-node
