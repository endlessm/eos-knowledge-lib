## Copyright 2014 Endless Mobile, Inc.
## Included in toplevel Makefile.am

overridesdir = $(datadir)/gjs-1.0/overrides
pkgoverridesdir = $(pkgdatadir)/overrides
overrides_DATA = overrides/EosKnowledge.js
dist_pkgoverrides_DATA = \
	overrides/config.js \
	overrides/hello.js \
	overrides/card.js \
	overrides/composite_button.js \
	$(NULL)

overrides/EosKnowledge.js: overrides/EosKnowledge.js.in
	$(AM_V_GEN)mkdir -p $(@D) && \
	rm -f $@ $@.tmp && \
	$(replace_dirs) $< >$@.tmp && \
	chmod a-w $@.tmp && \
	mv $@.tmp $@ \
	$(NULL)
CLEANFILES += overrides/EosKnowledge.js
EXTRA_DIST += overrides/EosKnowledge.js.in
