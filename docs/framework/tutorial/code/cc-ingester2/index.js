'use strict';

const Cheerio = require('cheerio');
const {dom, out, props, rule, ruleset, score, type} = require('fathom-web');
const Futils = require('fathom-web/utils');
const JSDOM = require('jsdom/lib/old-api');
const Libingester = require('libingester');
const url = require('url');
const util = require('util');
const {Vimeo} = require('vimeo');
const Youtubedl = require('youtube-dl');

Youtubedl.getInfo = util.promisify(Youtubedl.getInfo);

const feedURI = 'https://creativecommons.org/blog/feed/';

const vimeoClientID = 'a93aca581a0d158abab5ffa737949617f92159fc';
const vimeoClientSecret = '7Hws8xhWOYmnz4BRlM/UI4BkL5drqr9HltN5ALU5jLgnn+xm/lbJE7c4sJQW8jKeRYf0/4zQkXmoGRLkAj5rz/Gj1mGdaBvVRBov5fMyNqyF2pVoHTMcBLqAx40rDCwp';

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

async function getVideoInfo(vimeoID) {
    const vimeo = await ensureVimeoClient();
    const fields = ['description', 'license', 'link', 'name',
        'modified_time', 'pictures', 'privacy', 'release_time', 'tags'];
    return await vimeo.request({
        method: 'GET',
        path: `/videos/${vimeoID}?fields=${fields.join(',')}`
    });
}

function licenseFromVimeoLicense(license) {
    switch (license) {
    case 'by':
        return 'CC BY 3.0';
    case 'by-nc':
        return 'CC BY-NC 3.0';
    default:
        console.warn(`Unknown license ${license}`);
        return null;
    }
}

function tagsFromVimeoTags(tags) {
    return tags.map(({name}) => name);
}

function scoreByLength(fnode) {
    let length = Futils.inlineTextLength(fnode.element) * 2;
    if (Number.isNaN(length))
        length = 0;  // Penalize empty nodes
    return {
        score: length,
        note: {length},
    };
}

function byInverseLinkDensity(fnode) {
    const linkDensity = Futils.linkDensity(fnode,
        fnode.noteFor('paragraphish').length);
    if (Number.isNaN(linkDensity))
        return 1;
    return (1 - linkDensity) * 1.5;
}

function scoreByImageSize(fnode) {
    const img = fnode.element.querySelector('img');
    const width = img.getAttribute('width');
    const height = img.getAttribute('height');
    let length = Futils.inlineTextLength(fnode.element) * 2;
    if (Number.isNaN(length))
        length = 1;  // Don't penalize empty captions
    return {
        score: width && height ? width * height / 100 : 100,
        note: {length},
    };
}

const hasAncestor = (tagName, scoreIfHas) => fnode => {
    const lowerTag = tagName.toLowerCase();
    for (let element = fnode.element, parent;
        (parent = element.parentNode) != null &&
            parent.nodeType === parent.ELEMENT_NODE;
        element = parent) {
        if (element.tagName.toLowerCase() === lowerTag)
            return scoreIfHas;
    }
    return 1;
};

const rules = ruleset(
    // Isolate the actual blog post body text. Based on Fathom's example
    // Readability rules
    rule(dom('p,li,ol,ul,code,blockquote,pre,h1,h2,h3,h4,h5,h6'),
        props(scoreByLength).type('paragraphish')),
    rule(type('paragraphish'), score(byInverseLinkDensity)),
    rule(dom('p'), score(4.5).type('paragraphish')),

    // Tweaks for this particular blog
    rule(type('paragraphish'), score(hasAncestor('article', 10))),
    rule(dom('.entry-summary p'), score(0).type('paragraphish')),
    rule(dom('figure'), props(scoreByImageSize).type('paragraphish')),
    rule(dom('.jetpack-video-wrapper'), props(() => ({
        score: 100,
        note: {length: 1},
    })).type('paragraphish')),

    // Find the best cluster of paragraph-ish nodes
    rule(
        type('paragraphish').bestCluster({
            splittingDistance: 3,
            differentDepthCost: 6.5,
            differentTagCost: 2,
            sameTagCost: 0.5,
            strideCost: 0,
        }),
        out('content').allThrough(Futils.domSort)));

async function ingestArticle(hatch, {title, link, date, author}) {
    let $ = await Libingester.util.fetch_html(link);
    const baseURI = Libingester.util.get_doc_base_uri($, link);

    const imageURI = $('meta[property="og:image"]').attr('content');
    const synopsis = $('meta[property="og:description"]').attr('content');
    const lastModified = $('meta[property="article:modified_time"]')
        .attr('content');

    // Wordpress distinguishes predefined "categories" and free-form "tags".
    // We are likely to make Wordpress categories into featured sets, and
    // Wordpress tags non-featured. For now, we will mark the tag IDs of
    // Wordpress tags with "tag:".
    const wpCategory = $('meta[property="article:section"]')
        .attr('content');
    const wpTags = $('meta[property="article:tag"]')
        .map(function () { return $(this).attr('content'); })
        .get();
    const tags = wpTags.map(t => `tag:${t}`);
    tags.unshift(wpCategory);

    const dom = JSDOM.jsdom($.html(), {
        features: {ProcessExternalResources: false},
    });
    const facts = rules.against(dom);
    const html = facts.get('content')
        .filter(fnode => fnode.scoreFor('paragraphish') > 0)
        .map(fnode => fnode.element.outerHTML).join('');

    // Load the DOM back into Cheerio
    $ = Cheerio.load('<article>');
    $('article').append(html);

    const postAsset = new Libingester.BlogArticle();
    postAsset.set_title(title);
    postAsset.set_synopsis(synopsis);
    postAsset.set_canonical_uri(link);
    if (lastModified)
        postAsset.set_last_modified_date(lastModified);
    postAsset.set_date_published(date);
    postAsset.set_license('CC BY 4.0 International');
    postAsset.set_author(author);
    postAsset.set_read_more_text(`"${title}" by ${author}, used under CC BY 4.0 International / Reformatted from original`);
    postAsset.set_tags(tags);
    postAsset.set_custom_scss(`
        $title-font: 'Source Sans Variable';
        $body-font: 'Source Sans Variable';
        $context-font: 'Source Sans Variable';
        $support-font: 'Source Sans Variable';
        $primary-light-color: #fb7928;
        $primary-medium-color: #ee5b32;

        $accent-light-color: #049bce;
        $accent-dark-color: #464646;

        $background-light-color: white;
        $background-dark-color: #e9e9e9;
        @import '_default';
    `);

    const thumbnailAsset = Libingester.util.download_image(imageURI);
    hatch.save_asset(thumbnailAsset);
    postAsset.set_thumbnail(thumbnailAsset);

    // Replace bare <img>s with <figure>s
    $('p img').each(function () {
        const figure = $('<figure></figure>');
        const enclosingPara = $(this).parents('p')[0];
        figure.append($(this));
        figure.insertBefore(enclosingPara);
    });

    // Pick out a "main image": the first <figure>
    const figures = $('figure');
    if (figures.length) {
        const main = figures.first();
        const img = $('img', main);
        const mainImageAsset = Libingester.util.download_img(img, baseURI);
        hatch.save_asset(mainImageAsset);

        postAsset.set_main_image(mainImageAsset);
        postAsset.set_main_image_caption($('figcaption', main).text());

        $(main).remove();
    }

    // Save assets for any remaining <figure>s
    $('figure').each(function () {
        const img = $('img', this);
        const figureAsset = Libingester.util.download_img(img, baseURI);
        hatch.save_asset(figureAsset);
    });

    // Identify embedded videos, put them in a <figure>, and mark them for
    // downloading
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

    // Do some extra cleanup to minimize the size
    const all = $('*');
    all.removeAttr('class');
    all.removeAttr('style');
    const imgs = $('img');
    ['attachment-id', 'comments-opened', 'image-description', 'image-meta',
        'image-title', 'large-file', 'medium-file', 'orig-file',
        'orig-size', 'permalink']
        .forEach(data => imgs.removeAttr(`data-${data}`));
    imgs.removeAttr('srcset');  // For simplicity, only use one size
    imgs.removeAttr('sizes');

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

        // Only download if Vimeo says it is allowed and the license allows
        // redistribution
        const freeLicense = licenseFromVimeoLicense(license);
        if (!privacy.download || !freeLicense) {
            $(iframe).remove();
            return;
        }

        // Try to get the smallest file size in a free codec
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

    // Clean up useless <span>s with no attributes
    $('span').filter(function () {
        return Object.keys(this.attribs).length === 0;
    }).each(function () {
        $(this).replaceWith($(this).html());
    });

    postAsset.set_body($);
    postAsset.render();

    hatch.save_asset(postAsset);
}

async function main() {
    const hatch = new Libingester.Hatch('cc-blog', 'en');
    const paginator = Libingester.util.create_wordpress_paginator(feedURI);
    const items = await Libingester.util.fetch_rss_entries(paginator,
        Infinity, 90);
    await Promise.all(items.map(entry => ingestArticle(hatch, entry)));
    hatch.finish();
}

main();
