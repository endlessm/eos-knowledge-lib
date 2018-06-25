'use strict';

const Cheerio = require('cheerio');
const {dom, out, props, rule, ruleset, score, type} = require('fathom-web');
const Futils = require('fathom-web/utils');
const JSDOM = require('jsdom/lib/old-api');
const Libingester = require('libingester');

const feedURI = 'https://creativecommons.org/blog/feed/';

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

    const thumbnailAsset = Libingester.util.download_image(imageURI);
    hatch.save_asset(thumbnailAsset);
    postAsset.set_thumbnail(thumbnailAsset);

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

    // Clean up unwanted HTML tags, attributes, and comments. The
    // defaults are good in this case but they can be overwritten or
    // extended.
    Libingester.util.cleanup_body($.root());

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
