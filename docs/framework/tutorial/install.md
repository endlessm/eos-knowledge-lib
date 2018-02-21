---
short-description: Installing the tools needed for the walkthrough
...
# Installing #

This section will walk through installing the tools needed for this walkthrough on Endless OS.

## Installing NodeJS ##

If you are following this tutorial on Endless OS, you will need to install NodeJS, since it's not included by default and there isn't a package for it.

Go to [the NodeJS download page][nodejs-download] and download the correct "Linux Binaries" package for your system.
Most likely, you will want the "64-bit" package.
Create a `.local` folder in your home directory and unzip the downloaded package there:

```bash
mkdir -p ~/.local
tar -C ~/.local -xjf node-v8.9.4-linux-x64.tar.xz
```

Check if `~/.local/bin` is in your path (`echo $PATH`) and if not, add the following line to your `~/.bashrc` file, then close and reopen the terminal:

```bash
export PATH="$HOME/.local/bin:$PATH"
```

[nodejs-download]: https://nodejs.org/en/download/
