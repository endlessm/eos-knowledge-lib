---
short-description: Installing the tools needed for the walkthrough
...
# Installing #

This section will walk through installing the tools needed for this walkthrough on Endless OS.

## Installing Flatpak ##

You will need Flatpak on your system to complete this walkthrough.
If you're using Endless OS, it is already included.
For other Linux distributions, check [Flatpak's installation instructions][flatpak-install].

> **NOTE:** It's possible to complete the walkthrough and make an app without Flatpak, but you're on your own — packaging and installing an application using a different file format is outside the scope of this tutorial.

[flatpak-install]: https://flatpak.org/getting.html

## Installing the Endless SDK ##

You'll need the Endless SDK, which is a Flatpak runtime.
Flatpak runtimes are split into the **platform**, which contains the minimum needed for _running_ an app, and the **SDK**, which contains all the development tools needed for _creating_ an app.
You will need both.
We'll use the latest stable version, which at the time of writing is 4.

If you're using Endless OS, you will already have the software source set up, and the platform runtime will already be installed.
You only need to install the SDK runtime:

```bash
flatpak install eos-sdk com.endlessm.apps.Sdk//4
```

For other distributions, you will need to add the software source and install both runtimes:
```bash
flatpak remote-add --from eos-sdk http://endlessm.github.io/eos-knowledge-lib/eos-sdk.flatpakrepo
flatpak install eos-sdk com.endlessm.apps.Platform//4
flatpak install eos-sdk com.endlessm.apps.Sdk//4
```
See also [the installation instructions][endless-sdk-install].

[endless-sdk-install]: http://endlessm.github.io/eos-knowledge-lib/contributing

## Installing NodeJS ##

If you are following this tutorial on Endless OS, you will need to install NodeJS, since it's not included by default and there isn't a package for it.

Go to [the NodeJS download page][nodejs-download] and download the correct "Linux Binaries" package for your system.
Most likely, you will want the "64-bit" package.
Create a `.local` folder in your home directory and unzip the downloaded package there:

```bash
mkdir -p ~/.local
tar -C ~/.local -xJf node-v8.9.4-linux-x64.tar.xz --strip-components=1
```

Check if `~/.local/bin` is in your path (`echo $PATH`) and if not, add the following line to your `~/.bashrc` file, then close and reopen the terminal:

```bash
export PATH="$HOME/.local/bin:$PATH"
```

[nodejs-download]: https://nodejs.org/en/download/

## Installing Hatch Previewer ##

You'll also need a tool called Hatch Previewer.
It's available on Flathub, so if you're following this tutorial on Endless OS, you can install it from the App Center, or use the command line:

```bash
flatpak install flathub com.endlessm.HatchPreviewer
```

If you're on a different OS, you can follow [Flathub's instructions][flathub-install] to add it as a software source, or install Hatch Previewer via NPM.
If you choose the latter, the way to run it will be slightly different.

[flathub-install]: https://flathub.org/

## Installing the Source Sans Pro fonts ##

We'll be using the Source Sans Pro font in our app.
You can find the latest release on its [GitHub page][source-sans-pro-releases].
Download the `.otf` versions of the fonts.

We'll build these fonts into our apps, but in order for Hatch Previewer to find them during development, you should also copy them into your local fonts directory:

```bash
mkdir -p ~/.fonts
cp ~/Downloads/SourceSans*.otf ~/.fonts
```

[source-sans-pro-releases]: https://github.com/adobe-fonts/source-sans-pro/releases/tag/variable-fonts
