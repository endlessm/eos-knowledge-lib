## Copyright 2014 Endless Mobile, Inc.
## Included in toplevel Makefile.am

pkgoverridesdir = $(pkgdatadir)/overrides
public_overrides = \
	overrides/EosKnowledge.js \
	overrides/articleCard.js \
	overrides/articlePage.js \
	overrides/articlePresenter.js \
	overrides/articleHTMLRenderer.js \
	overrides/card.js \
	overrides/cardA.js \
	overrides/cardB.js \
	overrides/categoriesPage.js \
	overrides/eknWebview.js \
	overrides/homePage.js \
	overrides/homePageA.js \
	overrides/homePageB.js \
	overrides/infiniteScrolledWindow.js \
	overrides/lessonCard.js \
	overrides/lightbox.js \
	overrides/listCard.js \
	overrides/marginButton.js \
	overrides/mediaInfobox.js \
	overrides/mustache.js \
	overrides/navButtonOverlay.js \
	overrides/noSearchResultsPage.js \
	overrides/pdfCard.js \
	overrides/PDFView.js \
	overrides/presenter.js \
	overrides/presenterLoader.js \
	overrides/progressCard.js \
	overrides/previewer.js \
	overrides/sectionArticlePage.js \
	overrides/sectionPage.js \
	overrides/sectionPageA.js \
	overrides/sectionPageB.js \
	overrides/spaceContainer.js \
	overrides/tableOfContents.js \
	overrides/textCard.js \
	overrides/webkitURIHandlers.js \
	overrides/window.js \
	$(NULL)
private_overrides = \
	overrides/compositeButton.js \
	overrides/config.js \
	overrides/imagePreviewer.js \
	overrides/tabButton.js \
	overrides/utils.js \
	overrides/videoPreviewer.js \
	$(NULL)
dist_pkgoverrides_DATA = $(public_overrides) $(private_overrides)

reader_overrides = \
	overrides/reader/articlePage.js \
	overrides/reader/donePage.js \
	overrides/reader/overviewPage.js \
	overrides/reader/presenter.js \
	overrides/reader/progressLabel.js \
	overrides/reader/titleView.js \
	overrides/reader/userSettingsModel.js \
	overrides/reader/window.js \
	$(NULL)
readeroverridesdir = $(pkgoverridesdir)/reader
dist_readeroverrides_DATA = $(reader_overrides)
