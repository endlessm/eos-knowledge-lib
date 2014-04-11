## Copyright 2014 Endless Mobile, Inc.
## Included in toplevel Makefile.am

overridesdir = $(datadir)/gjs-1.0/overrides
pkgoverridesdir = $(pkgdatadir)/overrides
dist_pkgoverrides_DATA = \
	overrides/EosKnowledge.js \
	overrides/articleCard.js \
	overrides/card.js \
	overrides/compositeButton.js \
	overrides/config.js \
	overrides/lessonCard.js \
	overrides/listCard.js \
	overrides/progressCard.js \
	$(NULL)

install-data-hook:
	$(MKDIR_P) $(DESTDIR)$(overridesdir)
	rm -f $(DESTDIR)$(overridesdir)/EosKnowledge.js
	ln -s $(pkgoverridesdir)/EosKnowledge.js \
		$(DESTDIR)$(overridesdir)/EosKnowledge.js

uninstall-hook:
	rm -f $(DESTDIR)$(overridesdir)/EosKnowledge.js
