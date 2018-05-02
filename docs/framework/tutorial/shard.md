---
short-description: Refining and packaging the downloaded content
...
# Creating a shard #

In this section, we'll view the blog posts we've ingested in the previous section, and make some improvements to our ingester.
We'll add some customizations to the visual theme, and make sure videos are downloaded for offline viewing too.
Then we will package the hatch for distribution, in an archive format called a "shard".

We'll use Hatch Previewer to view the blog posts.
If you haven't installed it yet, check how to do so in the [Install](tutorial/install.md#installing-hatch-previwer) section.

## Viewing the blog posts ##

Running the ingester in the last section should have created a directory with a name like `hatch_cc-blog_20180215_104946` (where the numbers are the date and time that the ingester was run.)
Start Hatch Previewer, either by clicking its icon on the desktop, or from the command line:
```bash
flatpak run com.endlessm.HatchPreviewer
```
You'll be shown a dialog box where you select a directory.
Navigate to the hatch directory and select it.

> **NOTE:** You can also pass the hatch directory on the command line, but you have to give an absolute path due to a limitation in Flatpak.

You should see a mostly blank window with a list of the ingested blog posts on the left.
Click on one, and you should see something like this:

![Screenshot of Hatch Previewer](images/hatch-previewer-screenshot.png)

You can see the page as it looks when rendered in the article format, and press the "Flip" button to view the raw HTML.
You can also see the metadata on the right-hand side.

Browse through the posts, and take note of anything that looks odd.
You can also compare them to the posts on their original website in your browser, to make sure nothing is missing.

The first thing you might notice is that there are some blank spaces in the article format we used.
These will display metadata, but haven't been filled in yet.
There's a space after the dash at the top right, for the date that the post was published.
This isn't pre-filled because we want to display it in whatever date format the user has selected in their settings, and that's impossible to know at this point.

There's also a space at the bottom of the post where the tags will go.
We won't determine what tags will be used in the app until later, so there's nothing to display here yet.

## Customizing the fonts and colors ##

Perhaps the most obvious thing to refine is the use of default fonts and colors in the rendered posts.
We want to change these; in our case to better reflect the style of the original site.

The way we do this is with the [`set_custom_scss`][libingester-set-custom-scss] method of the `BlogArticle` format.
Each article format has its own default CSS theme.
You can customize certain variables in the theme, while largely sticking to the default.

Here's what the custom SCSS looks like for customizing the font:
```scss
$title-font: 'Source Sans Variable';
$body-font: 'Source Sans Variable';
$context-font: 'Source Sans Variable';
$support-font: 'Source Sans Variable';
```

Each of these variables governs a font used for a particular purpose in the rendered asset.
In our case, we'll stick with Source Sans as the font, just as the original blog does.

We also want to customize the color scheme to look more like the original blog.
Here's some SCSS to do that:
```scss
$primary-light-color: #fb7928;
$primary-medium-color: #ee5b32;
$accent-light-color: #049bce;
$accent-dark-color: #464646;
$background-light-color: white;
$background-dark-color: #e9e9e9;
```

Just as with the fonts, these are variables specific to the `BlogArticle`'s default theme.

Putting it all together, we add the following lines to our ingester in the same place where we set all the metadata on the post asset:
```javascript
postAsset.set_custom_scss(`
    $title-font: 'Source Sans Variable';
    $body-font: 'Source Sans Variable';
    $context-font: 'Source Sans Variable';
    $support-font: 'Source Sans Variable';
    $primary-light-color: #fb7928;
    $primary-medium-color: #ee5b32;
    $accent-light-color: #049bce;
    $accent-dark-color: #464646
    $background-light-color: white;
    $background-dark-color: #e9e9e9;
    @import '_default';
`);
```

The `@import '_default';` brings in the default theme for `BlogArticle`.
We can add custom SCSS rules to do further customization after the import line, but we're not going to do that in this example.
You can also leave out the import line if you want to start from scratch and write your own theme.

Re-run the ingester, and view the hatch with Hatch Previewer; you should see the effects of our customizations in the rendered HTML, and also in the embedded CSS when you click the "Flip" button.

[libingester-set-custom-scss]: https://endlessm.github.io/libingester/#blogarticleset_custom_scss

## Fixing the missing images ##

Another thing you might notice while browsing through the hatch is that some images are not showing up.
At the time of this walkthrough's writing, this happens in the articles ["5 Awesome Organisations Working to Protect and Expand the Public Domain"][missing-image1] and ["Thank you to Private Internet Access, lead sponsor of CC’s Global Summit"][missing-image2], though of course if you are doing this walkthrough later, it may happen in other articles, or not at all.
(If you want to reproduce these results exactly, you can set your ingester to page back to a longer time ago.)

We use the "Flip" button in Hatch Previewer to figure out why this is happening.
The raw HTML for the paragraph with the missing image looks like this:
```html
<p>
  <a href="https://www.eff.org/copyrightweek">
    <img data-image-title="copyright_week_2018" data-image-description="" src="https://d15omoko64skxi.cloudfront.net/wp-content/uploads/2018/01/copyright_week_2018-1024x512.png" alt="" width="840" height="420" sizes="(max-width: 709px) 85vw, (max-width: 909px) 67vw, (max-width: 1362px) 62vw, 840px">
  </a>
  <i>
    <span>We’re taking part in </span>
  </i>
  <a href="https://www.eff.org/copyrightweek">
    <i>
      <span>Copyright Week</span>
    </i>
  </a>
  <i>
    <span>, a series of actions and discussions supporting key principles that should guide copyright policy. Every day this week, various groups are taking on different elements of the law, and addressing what’s at stake, and what we need to do to make sure that copyright promotes creativity and innovation.</span>
  </i>
</p>
```

The cause is apparent: the ingester isn't turning the image into an image asset.
The image's location still points to an online address, which Hatch Previewer can't access because it runs sandboxed and doesn't have network privileges.
Looking back at our [ingester code](tutorial/ingester-full-code.md), we only looked for images inside a `<figure>` tag.

The `BlogArticle` format works best with `<figure>` images anyway, and not inline `<img>` elements, so instead of changing our image-to-asset code to look for the latter, we'll transmute them into the former, using Cheerio to manipulate the DOM.

```javascript
$('p img').each(function () {
    const figure = $('<figure></figure>');
    const enclosingPara = $(this).parents('p')[0];
    figure.append($(this));
    figure.insertBefore(enclosingPara);
});
```

[missing-image1]: https://creativecommons.org/2018/01/15/5-awesome-organisations-working-protect-expand-public-domain/
[missing-image2]: https://creativecommons.org/2018/01/31/thank-lead-sponsor-ccs-global-summit/

## Cleaning unused elements ##

We also see from the HTML example above that there are useless `<span>` elements that we can remove to save even more space.
Doing too much of this kind of cleanup can yield diminishing returns, but in this case the fix is quick to do with Cheerio, so we will not refrain.

```javascript
$('span').filter(function () {
    return Object.keys(this.attribs).length === 0;
}).each(function () {
    $(this).replaceWith($(this).html());
});
```

## Downloading linked media ##

As a last tweak to our ingester, it seems that one of the articles we are ingesting has an embedded video: ["Art and the Every Day with Mike Winkelmann (AKA beeple)"][embedded-video].
(Again, if you are doing this walkthrough later, that article might not be in the batch you ingested.)
We want to download this video and save it as an asset as well.

> **NOTE:** This works a bit differently from saving images as assets.
> The video doesn't get put into the hatch directly; instead, a placeholder is created, and the video is downloaded later in the next processing step.
> This keeps the hatch creation time quick.
> It also allows transcoding the video in order to use a free codec or a different resolution.

> **NOTE:** This section nearly doubles the size of the ingester code and requires a Vimeo account.
> If you aren't interested in downloading videos, you can safely skip it, or save it for later.

As might be expected from the Creative Commons blog, the video has a license that makes it freely distributable, and it is available for download from Vimeo.
We'll add some code to our ingester that looks for embedded videos and saves their download location into the hatch.

Run the following command to install the necessary packages:
```bash
npm install --save vimeo youtube-dl
```

We use the `vimeo` package to access the Vimeo API, in order to get the video's metadata, and to make sure that it is OK to download.
The `youtube-dl` package is used to get a download URL for the video.
(Despite its name, it's not only for YouTube.)

First of all, since we are accessing the Vimeo API, we'll need a Vimeo account and some credentials.
Create an account if you don't have one, then go to https://developer.vimeo.com, log in, and click the "Create App" button in the top right corner.
Fill in the required information and submit the form.
After that, your newly-created app should show up under "My Apps".
Click on it and then click on the "Authentication" tab to see the credentials.
You need the client identifier and the client secret.
Fill them into the appropriate places in the following code:

```javascript
const {Vimeo} = require('vimeo');

const vimeoClientID = '(fill in client ID here)';
const vimeoClientSecret = '(fill in client secret here)';

const ensureVimeoClient = (function () {
    let vimeo;
    return async function ensureVimeoClient() {
        if (vimeo)
            return vimeo;

        vimeo = new Vimeo(vimeoClientID, vimeoClientSecret);
        vimeo.generateClientCredentials =
            util.promisify(vimeo.generateClientCredentials.bind(vimeo));
        vimeo.request = util.promisify(vimeo.request.bind(vimeo));

        const {access_token: accessToken} =
            await vimeo.generateClientCredentials(['public']);
        vimeo.setAccessToken(accessToken);
        return vimeo;
    };
})();
```

This makes an [IIFE] called `ensureVimeoClient()` with a private `vimeo` variable representing the Vimeo client object.
We do it this way so that the ingester doesn't need to authenticate to Vimeo if there are no articles with videos to be ingested in the current batch.

Next, we note the structure of the embedded videos:

```html
<div class="jetpack-video-wrapper">
  <div class="embed-vimeo">
    <iframe src="https://player.vimeo.com/video/..." ...></iframe>
  </div>
</div>
```

This whole thing is discarded by Fathom when cleaning up the DOM, so we need to add a Fathom rule that considers an embedded video part of the cluster of paragraph-like elements:

```javascript
rule(dom('.jetpack-video-wrapper'), props(() => ({
    score: 100,
    note: {length: 1},
})).type('paragraphish')),
```

Then, we add some code to fix this up so that the videos are nicely in a `<figure>` element:

```javascript
const videosToProcess = $('.jetpack-video-wrapper')
.map(function () {
    const iframe = $('.embed-vimeo iframe', this).first();
    let figure;
    if (iframe) {
        figure = $('<figure></figure>');
        figure.append(iframe);
        figure = figure.insertAfter(this);
    }
    $(this).remove();
    return figure;
})
.get().filter(figure => !!figure);
```

In `videosToProcess` we now have a list of `<figure>` elements each containing an `<iframe>` which refers to a video that should be downloaded.

In order to download each video, we first check the Vimeo API for all the metadata, such as the title and license of the video, and the tags that it is tagged with.
We also use the Vimeo API to check that downloading is allowed.
For performance, but also as a courtesy to Vimeo, we request only the fields that we actually use.

Subsequently, we use `youtube-dl` to get a download URL, and create a video asset using the [libingester API function `Libingester.util.get_embedded_video_asset()`][get-embedded-video-asset].

This function replaces the `<iframe>` with a special placeholder element.
Videos aren't actually downloaded in libingester.
This is so that you can implement your own compression or transcoding if need be.
For this reason, you can't play the video in Hatch Previewer.
However, we'll download the video in the section below with Basin.

```javascript
await Promise.all(videosToProcess.map(async figure => {
    const iframe = figure.find('iframe');
    const {host, pathname} = url.parse(iframe.attr('src'));
    if (host !== 'player.vimeo.com') {
        $(iframe).remove();
        return;
    }

    const [,, vimeoID] = pathname.split('/');
    const {
        description, license, link, name, pictures, privacy, tags,
        release_time: releaseTime,
        modified_time: modifiedTime,
    } = await getVideoInfo(vimeoID);

    const freeLicense = licenseFromVimeoLicense(license);
    if (!privacy.download || !freeLicense) {
        $(iframe).remove();
        return;
    }

    const {url: downloadURL} = await Youtubedl.getInfo(link, [
        '--prefer-free-formats',
        '--format=worst',
    ], {
        maxBuffer: 500 * 1024,  // JSON info is big!
    });
    const video = Libingester.util.get_embedded_video_asset(iframe,
        downloadURL);
    video.set_title(name);
    video.set_synopsis(description);
    video.set_canonical_uri(link);
    video.set_last_modified_date(modifiedTime);
    video.set_date_published(releaseTime);
    video.set_license(freeLicense);
    video.set_tags(tagsFromVimeoTags(tags));

    const posterFrame = pictures.sizes.pop();
    const poster = Libingester.util.download_image(posterFrame.link);
    video.set_thumbnail(poster);

    hatch.save_asset(video);
    hatch.save_asset(poster);
}));
```

The functions `getVideoInfo()`, `licenseFromVimeoLicense()`, and `tagsFromVimeoTags()` are not given here, but you can see them in the [full code](tutorial/shard-full-code.md#indexjs).

If you run this code and view the result in Hatch Previewer, you should be able to see the article with the placeholders where the videos were.

[embedded-video]: https://creativecommons.org/2018/01/18/art-every-day/
[IIFE]: https://en.wikipedia.org/wiki/Immediately-invoked_function_expression
[get-embedded-video-asset]: https://endlessm.github.io/libingester/#utilget_embedded_video_asset

## Creating a shard with Basin ##

The tool that we use to turn a hatch into a shard is called Basin.
Basin is available as part of the Endless SDK.
The easiest way to use it is inside the Flatpak sandbox of the Endless SDK.
If you haven't installed it yet, check how to do so in the [Install](install) section.

Basin is actually a suite of related tools for creating shards from content on disk, not only from hatches.
The tool we'll use is called `basin-hatch`.
It also downloads the videos that we didn't download in the previous section.

First start a command shell in the Flatpak sandbox and give it permission to access the internet (to download the videos) and the ingester directory (to write the shard):
```bash
flatpak run --command=bash --share=network --filesystem=$(pwd) com.endlessm.apps.Sdk
```

> **NOTE:** Use `exit` to get out of the shell when you're done with it.

Then create a directory to hold the output, and run `basin-hatch` on the hatch directory:

```bash
mkdir -p content
basin-hatch hatch_cc-blog_20180226_082238 content
```

You should see the videos being downloaded, and finally the message `Successfully created content/output.shard`.

> **NOTE:** If you included the code from the [previous section](#downloading-linked-media) in your ingester, you have to do this step quickly after creating the hatch.
> The Vimeo download links will expire after some time.

Looking at the `content/` directory, there are actually two files in it:

- `output.shard` is a compressed, binary version of the hatch with all the posts, images, videos, and their metadata.
- `manifest.json` tells information about the `output.shard` file.

These files are the form in which the content is ultimately given to the user!
We'll learn what to do with them in the next section of the walkthrough.

## Further remarks and ideas ##
