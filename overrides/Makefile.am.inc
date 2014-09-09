## Copyright 2014 Endless Mobile, Inc.
## Included in toplevel Makefile.am

overridesdir = $(datadir)/gjs-1.0/overrides
pkgoverridesdir = $(pkgdatadir)/overrides
public_overrides = \
	overrides/EosKnowledge.js \
	overrides/application.js \
	overrides/articleCard.js \
	overrides/articleObjectModel.js \
	overrides/articlePage.js \
	overrides/articlePresenter.js \
	overrides/card.js \
	overrides/cardA.js \
	overrides/cardB.js \
	overrides/categoriesPage.js \
	overrides/contentObjectModel.js \
	overrides/eknWebview.js \
	overrides/engine.js \
	overrides/homePage.js \
	overrides/homePageA.js \
	overrides/homePageB.js \
	overrides/infiniteScrolledWindow.js \
	overrides/knowledgeApp.js \
	overrides/lessonCard.js \
	overrides/lightbox.js \
	overrides/listCard.js \
	overrides/marginButton.js \
	overrides/mediaInfobox.js \
	overrides/mediaObjectModel.js \
	overrides/navButtonOverlay.js \
	overrides/noSearchResultsPage.js \
	overrides/pdfCard.js \
	overrides/presenter.js \
	overrides/progressCard.js \
	overrides/previewer.js \
	overrides/sectionArticlePage.js \
	overrides/sectionPage.js \
	overrides/sectionPageA.js \
	overrides/sectionPageB.js \
	overrides/tableOfContents.js \
	overrides/textCard.js \
	overrides/treeNode.js \
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
	overrides/reader/application.js \
	overrides/reader/articlePage.js \
	overrides/reader/donePage.js \
	overrides/reader/presenter.js \
	overrides/reader/progressLabel.js \
	overrides/reader/window.js \
	$(NULL)
readeroverridesdir = $(pkgoverridesdir)/reader
dist_readeroverrides_DATA = $(reader_overrides)

install-data-hook:
	$(MKDIR_P) $(DESTDIR)$(overridesdir)
	rm -f $(DESTDIR)$(overridesdir)/EosKnowledge.js
	ln -s $(pkgoverridesdir)/EosKnowledge.js \
		$(DESTDIR)$(overridesdir)/EosKnowledge.js

uninstall-hook:
	rm -f $(DESTDIR)$(overridesdir)/EosKnowledge.js
