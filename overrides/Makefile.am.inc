## Copyright 2014 Endless Mobile, Inc.
## Included in toplevel Makefile.am

overridesdir = $(datadir)/gjs-1.0/overrides
pkgoverridesdir = $(pkgdatadir)/overrides
public_overrides = \
	overrides/EosKnowledge.js \
	overrides/articleCard.js \
	overrides/articleObjectModel.js \
	overrides/articlePage.js \
	overrides/articlePresenter.js \
	overrides/backButtonOverlay.js \
	overrides/card.js \
	overrides/cardA.js \
	overrides/cardB.js \
	overrides/categoriesPage.js \
	overrides/contentObjectModel.js \
	overrides/engine.js \
	overrides/homePage.js \
	overrides/homePageA.js \
	overrides/homePageB.js \
	overrides/injectableWebview.js \
	overrides/knowledgeApp.js \
	overrides/lessonCard.js \
	overrides/lightbox.js \
	overrides/listCard.js \
	overrides/marginButton.js \
	overrides/mediaInfobox.js \
	overrides/mediaObjectModel.js \
	overrides/presenter.js \
	overrides/progressCard.js \
	overrides/previewer.js \
	overrides/sectionArticlePageA.js \
	overrides/sectionArticlePageB.js \
	overrides/sectionPage.js \
	overrides/sectionPageA.js \
	overrides/sectionPageB.js \
	overrides/tableOfContents.js \
	overrides/textCard.js \
	overrides/treeNode.js \
	overrides/webviewSwitcherView.js \
	overrides/window.js \
	$(NULL)
private_overrides = \
	overrides/compositeButton.js \
	overrides/tabButton.js \
	overrides/config.js \
	overrides/imagePreviewer.js \
	overrides/videoPreviewer.js \
	$(NULL)
dist_pkgoverrides_DATA = $(public_overrides) $(private_overrides)

install-data-hook:
	$(MKDIR_P) $(DESTDIR)$(overridesdir)
	rm -f $(DESTDIR)$(overridesdir)/EosKnowledge.js
	ln -s $(pkgoverridesdir)/EosKnowledge.js \
		$(DESTDIR)$(overridesdir)/EosKnowledge.js

uninstall-hook:
	rm -f $(DESTDIR)$(overridesdir)/EosKnowledge.js
