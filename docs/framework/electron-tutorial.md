# Electron application tools #

> **NOTE**: This tutorial is a draft and may be out of date.
> We aren't currently supporting this workflow, but will happily accept pull requests to fix mistakes in the tutorial.

[Electron] is a powerful framework way to write native applications using web technology.
You can run these apps on EndlessOS.

The following tutorial will walk you through building a Electron application [Flatpak] bundle on EndlessOS.
This Flatpak application can be installed and run on any other Linux system that supports Flatpak, including EndlessOS and many popular Linux distributions.

Endless ships its core operating system with few development tools available, so to gain acess to tools like `git` and `node` we will do our work out of a Flatpak application specifically for developing Electron apps.

This tutorial will use a tool called [electron-forge] for making Electron apps, which makes project setup fairly quick and painless.
However, electron-forge is not required for making an Electron app.
For plugging Flatpak support directly into an Electron app have a look at [electron-installer-flatpak] and [flatpak-bundler].

EndlessOS version 3.1 or later is required to complete this tutorial.

[Electron]: https://electron.atom.io/
[Flatpak]: http://flatpak.org/
[electron-forge]: https://github.com/electron-userland/electron-forge
[electron-installer-flatpak]: https://github.com/endlessm/electron-installer-flatpak
[flatpak-bundler]: https://github.com/endlessm/flatpak-bundler

## Installing and running the Electron dev app ##

We will install the `io.atom.electron.DevApp` flatpak application.
This application is to be run in the terminal and will give us access to `node` and `git`.

Pull open a terminal and run
```sh
flatpak install https://s3-us-west-2.amazonaws.com/electron-flatpak.endlessm.com/electron-dev-app-master.flatpakref
```

Now you can run the dev app to pull up a bash shell with NodeJS available.
```sh
flatpak run io.atom.electron.DevApp
```
With this command you are now running inside a flatpak sandbox with development
tools available.
You can test this by running `node --version`.
Future commands in this document will be run from inside the dev application bash shell.

## Installing electron-forge ##

Next we will install the electron-forge tool globally for development.
There are many ways to configure npm to install packages globally, but we suggest setting up a directory in your home dir, as [described by npm here][npm-default-dir].

Once NPM is configured, you can get started using electron-forge:
```sh
npm install -g electron-forge
electron-forge init my-new-app
cd my-new-app
electron-forge start
```
You should see your new Electron application window pop up!

[npm-default-dir]: https://docs.npmjs.com/getting-started/fixing-npm-permissions#option-2-change-npms-default-directory-to-another-directory

## Setting up your app for flatpak distribution ##

Finally, we need to set up your new app for flatpak distribution.
In your new app directory, open up your [package.json] file. In the `"make-targets"` section, replace
```json
"linux": [
  "deb",
  "rpm"
]
```
with
```json
"linux": [
  "flatpak"
]
```

It would also be a good idea to set an [application ID] for your app.
Beneath the `"make-targets"` section add a new object, replacing the app ID as appropriate.
```json
"electronInstallerFlatpak": {
  "id": "org.example.AppName"
}
```

That's it! You can now run
```sh
electron-forge make
```
To build your application as a flatpak.
You should find your app in an `out/make` subdirectory for your new app, e.g. `out/make/org.example.AppName_master_x86_64.flatpak`

[package.json]: https://docs.npmjs.com/files/package.json
[application ID]: http://docs.flatpak.org/en/latest/introduction.html#naming

## Get developing! ##

As you develop, you can just run
```sh
electron forge start
```
to quickly test changes to your app.

If you want to test your built flatpak, open a new terminal outside of the dev
app sandbox, and run
```sh
flatpak install out/make/org.example.AppName_x86_64.flatpak
flatpak run org.example.AppName
```

See the [electron-forge documentation] for details on how to publish your app directly to GitHub.

See the [electron-forge templates] to get started using React, Angular, Jade, and other common web frameworks.

[electron-forge documentation]: https://github.com/electron-userland/electron-forge
[electron-forge templates]: https://beta.electronforge.io/templates

## Troubleshooting ##

If you are having trouble with the packaging phase of your application it may help to use the [debug tool].
For example, to turn on output for electron-forge, and the flatpak modules it uses, run
```sh
DEBUG=electron-forge,electron-installer-flatpak,flatpak-bundler npm run make
```
That should get you a lot more output to help the debugging process.

[debug tool]: https://www.npmjs.com/package/debug