## Copyright 2014 Endless Mobile, Inc.
## Included in toplevel Makefile.am

overridesdir = $(datadir)/gjs-1.0/overrides
pkgoverridesdir = $(pkgdatadir)/overrides
public_overrides = \
	overrides/EosKnowledge.js \
	overrides/articleCard.js \
	overrides/card.js \
	overrides/contentObjectModel.js \
	overrides/homePageA.js \
	overrides/lessonCard.js \
	overrides/lightbox.js \
	overrides/listCard.js \
	overrides/marginButton.js \
	overrides/progressCard.js \
	overrides/tableOfContents.js \
	overrides/treeNode.js \
	overrides/webviewSwitcherView.js \
	$(NULL)
private_overrides = \
	overrides/compositeButton.js \
	overrides/config.js \
	$(NULL)
dist_pkgoverrides_DATA = $(public_overrides) $(private_overrides)

install-data-hook:
	$(MKDIR_P) $(DESTDIR)$(overridesdir)
	rm -f $(DESTDIR)$(overridesdir)/EosKnowledge.js
	ln -s $(pkgoverridesdir)/EosKnowledge.js \
		$(DESTDIR)$(overridesdir)/EosKnowledge.js

uninstall-hook:
	rm -f $(DESTDIR)$(overridesdir)/EosKnowledge.js
