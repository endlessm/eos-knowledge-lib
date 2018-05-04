---
short-description: Creating a user interface and putting it together with the content
...
# The app #

In this section we'll put the shards, that we created in the previous section, into an app, design a UI for it, and write CSS theming.
Then we'll build that into a Flatpak bundle and learn how to distribute it.

For most of the commands in this section, you'll need to enter a command shell in the Flatpak sandbox, giving it permission to access the current directory and the display server, and to export our app ID on the session bus:
```bash
flatpak run --socket=x11 --socket=wayland --own-name=org.example.CreativeCommonsBlog --filesystem=$(pwd) --command=bash com.endlessm.apps.Sdk
```

> **NOTE:** When you're done with the shell, use `exit` to get out of it.

## Testing the content ##

At this point, we have all our content and can put it in a pre-fabricated app UI just to see how it looks.

An app first needs an app ID, which is a ["reverse domain name"][reverse-domain-name].
We'll pick `org.example.CreativeCommonsBlog` for this tutorial.

For the app, we need a description of the UI in a file called `app.yaml`.
We build UIs using a **declarative** YAML syntax.
(Declarative here means that there's no programming language in which you can program the app's behavior; only a description of which parts there are and how they fit together.)

We'll describe this file format, as well as use it to customize our app, more in the [next section](#tweaking-the-app-ui).
For now, we'll just import a pre-fabricated app UI template:
```yaml
!import blog
```

We also need a theme, which we'll cover in [a following section](#theming-the-app).
For now, we'll create `overrides.scss` and import the default theme that goes along with the pre-fabricated template we picked above:
```scss
@import 'blog';
```

We also need a [GResource bundle][gresource], which for testing the app can simply be empty.
GResource bundles are a way to make auxiliary files available to an app, without worrying about what path they are installed at.
You can read more in the [documentation][gresource].
To create it we'll write an empty GResource manifest file, called `app.gresource.xml`:
```xml
<?xml version='1.0' encoding='utf-8'?>
<gresources>
    <gresource prefix="/app">
    </gresource>
</gresources>
```
Build the GResource with this command:
```bash
glib-compile-resources app.gresource.xml
```

Finally, we'll need a content manifest file.
Copy the `output.shard` and `sets.shard` from [the previous section](tutorial/shard.md) into the directory where you're building your app.
Then, generate the manifest with a tool called [`eminem`](tools.md#eminem):
```bash
eminem regenerate .
```

To run the app, we use a script called `ekn-app-runner`, which gets the app ID and the path to the GResource bundle.
We also pass it a few options to tell it where to find the UI file, the theme, and the content:
```bash
ekn-app-runner org.example.CreativeCommonsBlog app.gresource -J app.yaml -O overrides.scss -p .
```

You should see something like this:

![Screenshot of Creative Commons Blog app](images/ccapp-screenshot1.png)

You can browse the app, try a few searches, and see that the content is all there.
However, in the next sections we'll do some simple customizations to make it look less like a generic app and more like a Creative Commons app.

[reverse-domain-name]: https://en.wikipedia.org/wiki/Reverse_domain_name_notation
[gresource]: https://developer.gnome.org/gio/stable/GResource.html

## Tweaking the app UI ##

We're using the "Blog" app preset.
You can read more about it in the [presets documentation](concepts/presets.md#blog).
In this section, we're going to change a few things in order to make the app not completely a standard copy of the "Blog" preset.

### Logo ###

First of all we are going to add a logo to the app.
There is already space for a logo in the Blog preset, although nothing is occupying it right now, so all we need to do is find a logo to add.
Luckily, there's one in this tutorial that you can reuse.
You can find it in the [full code](tutorial/app-full-code.md#assets/titleImage.svg); right-click to download it, and save it as `assets/titleImage.svg` in your app directory. Also make a copy _without the `.svg` extension_, as this is needed for the GResource path below.

The preset includes an `App.Banner` module, and from its [documentation](Banner.App) you can see that it will look for a logo at the GResource path `/app/assets/titleImage`.
Add a line to the GResource manifest:
```xml
<file compressed="true" preprocess="xml-stripblanks">assets/titleImage</file>
```
Then recompile the GResource bundle as above:
```bash
glib-compile-resources app.gresource.xml
```

Run the app with the same command as above, and you'll see the logo in its place in the upper left corner, at the top of the side menu.

<img src="images/ccapp-logo.png"
     alt="Closeup of Creative Commons Blog app's logo"
     width="300"/>

### Customizing the front page UI ###

In the presets documentation, you'll see a list of "variable names" and what parts of the UI they control.
These variables can also be customized in the `app.yaml` file.
The format of this file is described in [the documentation](concepts/yaml_format.md), and the variables are specifically described in the ["Overrides" section](concepts/yaml_format.md#overrides).
We'll customize one of the variables in this section, to give you an idea of how it works.

For a customization that we can see the effect of immediately, let's customize the arrangement of cards on the app's home page.
As you can see from the [Blog preset's documentation](concepts/presets.md#blog), there is a variable named `home-featured-articles-arrangement` that seems to do what we want.
Let's replace the current [Arrangement.List] with an [Arrangement.Half].
(You can read more about arrangements through the documentation links above.)

Add these lines to your `app.yaml` file before the `!import` declaration, then run the app again to see the effect:
```yaml
overrides:
  home-featured-articles-arrangement:
    type: Arrangement.Half
    styles:
      - main-arrangement
---
```

> **NOTE**:The `styles` key is there to give the new module the same CSS class as the old one.
> That's a bit obscure, though. Currently the only way to find that out is to look at the [source code for the Blog preset][blog-yaml].)

![Screenshot of Creative Commons Blog app](images/ccapp-screenshot2.png)

The images look a bit nicer now, since they fit better with the size of the cards in this arrangement.

[blog-yaml]: https://github.com/endlessm/eos-knowledge-lib/blob/master/data/preset/blog.yaml

## Theming the app ##

In this section we'll try to make the app match the Creative Commons brand from their website a bit more.

### Colors and fonts ###

First of all, we need to get the app to use the colors and typography that we also [customized in the ingester](tutorial/shard.md#customizing-the-fonts-and-colors).

We do this in our SCSS file, much in the same way as we did it in the ingester.
Add the following lines to `overrides.scss`, _above_ the `@import` line so that the variables are picked up by the default theme:

```scss
$primary-light-color: #fb7928;
$primary-medium-color: #ee5b32;
$accent-light-color: #049bce;
$accent-dark-color: #464646;
$background-light-color: white;
$background-dark-color: #e9e9e9;

$body-font: 'Source Sans Variable';
$title-font: 'Source Sans Variable';
$display-font: 'Source Sans Variable';
$logo-font: 'Source Sans Variable';
$context-font: 'Source Sans Variable';
$support-font: 'Source Sans Variable';
```

Run the app again and compare it to the earlier screenshot:

![Screenshot of Creative Commons Blog app](images/ccapp-screenshot3.png)

The Source Sans font looks very similar to the default theme's Fira Sans font, so the difference in fonts isn't immediately obvious.

### Theme changes ###

The default "Blog" theme was apparently intended for apps with shorter category names; our side menu doesn't look good right now.
The category names are ellipsized, and they don't have padding on the right hand that visually balances the padding on the left.

To experiment in a CSS "playground", and find out the CSS classes that need to be customized, you can run the app with the [GTK inspector][inspector].
Prepend `GTK_DEBUG=interactive` to the command that you run the app with, to start the inspector.

We'll use the inspector to take a look at the side menu. Use `Alt`+```` to switch to the inspector window, and click the targeting tool on the side menu.
This will bring up some basic information about the widget, and you can see for example that it is about 250 pixels wide.
Change from the "Miscellaneous" screen to the "CSS Selector" screen and you can see that one of the CSS selectors for the outermost widget occupying that space is `.sidebar`.

This gives us all the information we need to switch to the "CSS" tab in the inspector and live-tweak the width.
We'll use the full selector including the parent [Layout.Sidebar] module, `.LayoutSidebar .sidebar`, because a lot of the default theme is written on a module basis.
If you use only `.sidebar` then it could conflict with other modules that might have a `.sidebar` selector, and it also might not have enough [specificity] to override the default rule.
Write in the CSS field:
```css
.LayoutSidebar .sidebar {
    min-width: 400px;
}
```

We can now copy this CSS into our `overrides.scss`.
Make sure to put it _below_ the `@import` line, so that it overrides the default theme.
Try it and run the app again, and you'll see the change take effect.

Next, we should make our logo a bit bigger to fit with the new width of the sidebar:
```css
.BannerApp .ThemeableImage {
    min-width: 300px;
}
```

We also want to change the background color of the sidebar since the "background-dark" theme color is still a little bit light for the white Creative Commons logo.
Let's use the "accent-dark" color instead. Add
```scss
background-color: $accent-dark-color;
```
to your `overrides.scss` file.

> **NOTE**: Unfortunately, since the GTK inspector uses plain CSS, not SCSS, the variables won't work there, but you can still experiment with it by putting the color directly.

Let's also add a bit of shadow to the side menu.
Fire up the app again, switch to the inspector, and write in the CSS field:
```css
.LayoutSidebar .sidebar {
    box-shadow:
}
```

You can use the online [box shadow generator] as a visual tool that helps you generate the CSS box shadow syntax.
Then you can fill it in to the inspector, and see how it looks in the app.

Here's an example of what the final side menu override might look like, and the final product:
```scss
.LayoutSidebar .sidebar {
    min-width: 400px;
    background-color: $accent-dark-color;
    box-shadow: 3px 0px 10px $accent-dark-color;
}
```

![Screenshot of Creative Commons Blog app](images/ccapp-screenshot4.png)

[inspector]: https://wiki.gnome.org/Projects/GTK%2B/Inspector
[specificity]: https://developer.mozilla.org/en-US/docs/Web/CSS/Specificity
[box shadow generator]: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Background_and_Borders/Box-shadow_generator

## Creating a Flatpak bundle ##

Now that the app is created, we'll have to package and distribute it.
In this section we'll create a [Meson build file][meson] that will put everything together, and create a [Flatpak-builder manifest][flatpak-manifest] with which we can create a Flatpak package.

### Meson build file ###

To start with, we'll need a `meson.build` file to indicate how to build and install the app, and a helper build script called `database_manifest.sh`.
We'll skip over the details of this, but just copy the one from the [full code](tutorial/app-full-code.md#meson.build).

In short, the `meson.build` file automates all the file-generating commands that we used above, plus a few more.
In particular, we need to convert the human-readable `app.yaml` file into a more explicit but repetitive `app.json`, and convert the `overrides.scss` into plain CSS.
Previously these conversions were done automatically by `ekn-app-runner` when we ran the app.
In the Meson file you can see the Meson targets that do this:
```meson
overrides_css = custom_target('sass', input: 'overrides.scss',
    output: 'overrides.css',
    command: [sassc, '-I', theme_path, '@INPUT@', '@OUTPUT@'])

app_json = custom_target('autobahn', input: 'app.yaml', output: 'app.json',
    command: [autobahn, '@INPUT@', '-o', '@OUTPUT@', '-I', preset_path])
```

We'll also need to add the generated `app.json` and `overrides.css` files to our GResource bundle.
It's not required to add the original `app.yaml` and `overrides.scss` files, but it makes debugging easier at a small size cost, so we'll add them as well:
```xml
<file compressed="true">app.json</file>
<file compressed="true">app.yaml</file>
<file compressed="true">overrides.css</file>
<file compressed="true">overrides.scss</file>
```

To test the build, inside the sandbox, we can build the app and install it into a staging directory named `_install`:
```bash
mkdir _build
meson _build
ninja -C _build
DESTDIR=../_install ninja -C _build install
```

### Flatpak manifest ###

Next, we'll need a build manifest for Flatpak-builder.
Here's a manifest that we can start with:
```json
{
    "app-id": "org.example.CreativeCommonsBlog",
    "runtime": "com.endlessm.apps.Platform",
    "runtime-version": "4",
    "sdk": "com.endlessm.apps.Sdk",
    "command": "org.example.CreativeCommonsBlog",

    "finish-args": [
        "--socket=x11",
        "--socket=wayland",
        "--device=dri"
    ],

    "modules": [
        {
            "name": "org.example.CreativeCommonsBlog",
            "buildsystem": "meson",
            "sources": [
                {
                    "type": "shell",
                    "commands": ["mkdir -p assets"]
                },
                { "type": "file", "path": "app.gresource.xml" },
                { "type": "file", "path": "app.yaml" },
                { "type": "file", "path": "database_manifest.py" },
                { "type": "file", "path": "meson.build" },
                { "type": "file", "path": "output.shard" },
                { "type": "file", "path": "overrides.scss" },
                { "type": "file", "path": "sets.json" },
                {
                    "type": "file",
                    "path": "assets/titleImage.svg",
                    "dest-filename": "assets/titleImage"
                },
                {
                    "type": "script",
                    "dest-filename": "org.example.CreativeCommonsBlog",
                    "commands": [
                        "ekn-app-runner org.example.CreativeCommonsBlog /app/share/app.gresource"
                    ]
                }
            ],
            "build-commands": [
                "install -Dm755 -t /app/bin ../org.example.CreativeCommonsBlog"
            ]
        }
    ]
}

```
It lists our source files and instructs Flatpak to use Meson to build the app.
We also include a startup script to run `ekn-app-runner`, and install it in the correct place inside the bundle.
With `"finish-args"` we grant the app permission to access the display server and use the direct rendering device (important for accelerated graphics.)

Build it with `flatpak-builder` (exit the sandbox first if you are in one):
```bash
flatpak-builder _build --force-clean --repo=_repo org.example.CreativeCommonsBlog.json
```

This clears out the `_build` directory and does a build of the Flatpak in it, then exports it to a Flatpak repository in the `repo` directory.
You can then export a single-file Flatpak bundle from the repository, install it, and test it out:
```bash
flatpak build-bundle _repo test.flatpak org.example.CreativeCommonsBlog
flatpak install --bundle test.flatpak
flatpak run org.example.CreativeCommonsBlog
```

### Fonts ###

You will notice that the UI font is displayed as designed, using the Source Sans Variable font.
However, this is just by coincidence, since you installed Source Sans locally on your machine in the [Installing](tutorial/install.md) step.
If you were to delete those fonts from `~/.fonts`, the fonts wouldn't show up correctly in the Flatpak version of the app.

For this, we can add another section to the manifest, under `modules`:
```json
{
    "name": "source-sans-font",
    "buildsystem": "simple",
    "build-commands": [
        "install -D -m644 *.otf -t /app/share/fonts"
    ],
    "sources": [
        {
            "type": "file",
            "url": "https://github.com/adobe-fonts/source-sans-pro/releases/download/variable-fonts/SourceSansVariable-Roman.otf",
            "sha256": "afd685a2b43feafbb4c47deaa7a2c0fcd826940d3473abe42e4aaa56d39754af"
        },
        {
            "type": "file",
            "url": "https://github.com/adobe-fonts/source-sans-pro/releases/download/variable-fonts/SourceSansVariable-Italic.otf",
            "sha256": "62c5d0991d6a9571a89c8e137f2b76e3ff57f671e0d1bce832af98422ce13a6d"
        }
    ]
}
```
This downloads the same font files that we installed earlier, and installs them into the `/app/share/fonts` directory inside the bundle.

Try building it again, and you can verify that the fonts are being included by removing them from your `~/.fonts` directory (though make sure to save them somewhere else if you don't want to download them again!)

### App icon ###

When you run the app you can see in your taskbar or app switcher (Alt-Tab) that the app is represented by a blank "missing image" icon.
This doesn't look very good, so we should do something about it.

We've already prepared an app icon, using the same sheep as we used for the logo.
You can find it in the [full code](tutorial/app-full-code.md#assets/icon.svg); right-click to download it, and save it as `assets/icon.svg` in your app directory.
We've also prepared 64 and 128-pixel PNG versions of the icon which you can also download.

Flatpak apps can "export" certain files, and an app icon is one of them.
In order for the OS to find the icon, we also need to export a [desktop file].

To do this, first add the icon files to the Flatpak manifest:
```json
{
    "type": "file",
    "path": "assets/icon.svg",
    "dest-filename": "assets/icon.svg"
},
{
    "type": "file",
    "path": "assets/icon-64.png",
    "dest-filename": "assets/icon-64.png"
},
{
    "type": "file",
    "path": "assets/icon-128.png",
    "dest-filename": "assets/icon-128.png"
},
```

Then create a file named `org.example.CreativeCommonsBlog.desktop`:
```
[Desktop Entry]
Version=1.0
Type=Application
Name=Commons Blog
Exec=/usr/bin/flatpak run org.example.CreativeCommonsBlog
Icon=org.example.CreativeCommonsBlog
Comment=Blog posts from the Creative Commons organization, offline!
```

Also add it to the Flatpak manifest:
```json
{ "type": "file", "path": "org.example.CreativeCommonsBlog.desktop" },
```

Then add some new commands to the array of `build-commands` in the Flatpak manifest, to install the files in the location where they will be exported, and with the correct names:
```json
"install -Dm755 -t /app/bin ../org.example.CreativeCommonsBlog",
"install -Dm644 -t /app/share/applications ../org.example.CreativeCommonsBlog.desktop",
"install -Dm644 ../assets/icon-64.png /app/share/icons/hicolor/64x64/apps/org.example.CreativeCommonsBlog.png",
"install -Dm644 ../assets/icon-128.png /app/share/icons/hicolor/128x128/apps/org.example.CreativeCommonsBlog.png",
"install -Dm644 ../assets/icon.svg /app/share/icons/hicolor/scalable/apps/org.example.CreativeCommonsBlog.svg"
```

Now, when you rebuild the app, you should notice a few lines near the end of the build process mentioning that these four files are being exported.
And when you run the app, you'll see the icon.

### Attributing the assets ###

We used a Creative Commons-licensed [sheep icon, from The Noun Project,][sheep] in order to create the logo and the app icon.
So, we need to provide proper credit to the creator of the sheep icon.
The toolkit provides a facility for doing this.
All we have to do is include a file called `credits.json` in a certain format in the GResource bundle.

Create the file `credits.json`.
We'll show only one entry here, but you can see the whole thing in the [full code section](tutorial/app-full-code.md#credits.json):
```json
[
    {
        "credit": "Razlan Hanafiah",
        "credit_uri": "https://thenounproject.com/razlanisme/",
        "license": "CC-BY 3.0",
        "thumb_uri": "resource:///app/titleImage",
        "uri": "https://thenounproject.com/term/sheep/6049/",
        "comment": "Derived from 'Sheep' by Razlan Hanafiah from the Noun Project"
    }
]
```

Then add the file to the GResource bundle, by adding the following lines to `app.gresource.xml`:
```xml
<file compressed="true">credits.json</file>
```

Don't forget to add the file to the Flatpak manifest too:
```json
{ "type": "file", "path": "credits.json" },
```

Once that is done, rebuild the app, and you will be able to see the credits by hovering the mouse over the space just to the left of the minimize button in the title bar.
An "info" icon will appear, and if you click on it, you'll get a credits dialog.

[meson]: http://mesonbuild.com/
[flatpak-manifest]: http://docs.flatpak.org/en/latest/manifests.html
[desktop file]: https://standards.freedesktop.org/desktop-entry-spec/latest/
[sheep]: https://thenounproject.com/term/sheep/6049/

## Publishing the app ##

The app is complete now!
It includes content, categorization, a user interface, theming, a logo, an icon, and credits, and it all works without being connected to the internet.

At this point, you can simply take the `test.flatpak` bundle, rename it to something more descriptive, and publish it as-is on your website, upload it to Dropbox, or some other way of getting your file to your users!

In this walkthrough we chose the approach of exporting and distributing the app as a single-file Flatpak bundle.
You could also take the Flatpak repository and publish that instead.
That way, users of the app could continue to get updates through the repository, instead of having to download a new bundle every time.

You may have figured out that once you distribute this app, it won't get any updates as new posts are published on the blog.
The simplest solution is to re-run the ingester, re-build the Flatpak bundle, and re-publish it every time you want to include new posts.
That can even be automated.
However, it can get tedious.

One idea is to write a separate manifest for the rotating content, and include [`"build-extension": true`][build-extension] in order to build an `org.example.CreativeComments.Content` extension that can be updated separately from the main app.
This is what Endless does with many applications, and it's the reason why we split the `sets.json` shard from the content shard produced by the ingester.

[build-extension]: http://docs.flatpak.org/en/latest/flatpak-builder-command-reference.html#flatpak-manifest

## Further remarks and ideas ##

You'll probably want to commit your app code to a Git repository.
Note that instead of listing all the files as sources with `"type": "file"` in the Flatpak manifest, you can also use a `"type": "git"` source.

Note that fonts often have licenses that don't allow redistribution, even if they are allowed to be downloaded by users' browsers when displaying web pages.
Check the licenses of any fonts that you include in your Flatpak bundle.
