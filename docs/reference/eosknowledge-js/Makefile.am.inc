## Copyright 2014 Endless Mobile, Inc.
## Included in toplevel Makefile.am

if ENABLE_GIR_DOC

docs/reference/eosknowledge-js/index.page: $(INTROSPECTION_GIRS)
	$(MKDIR_P) $(@D)
	$(GIRDOCTOOL) -o $(@D) -l gjs $<

docs/reference/eosknowledge-js/html/index.html: docs/reference/eosknowledge-js/index.page
	$(MKDIR_P) $(@D)
	$(YELPBUILD) html -o $(@D) $(<D)

dist_noinst_DATA += docs/reference/eosknowledge-js/html/index.html

distclean-local::
	@rm -rf docs/reference/eosknowledge-js/html

dist-hook::
	@mkdir -p $(distdir)/docs/reference/eosknowledge-js/html
	@cp -r docs/reference/eosknowledge-js/html/*.html $(distdir)/docs/reference/eosknowledge-js/html
	@cp -r docs/reference/eosknowledge-js/html/*.css $(distdir)/docs/reference/eosknowledge-js/html
	@cp -r docs/reference/eosknowledge-js/html/*.js $(distdir)/docs/reference/eosknowledge-js/html

CLEANFILES += docs/reference/eosknowledge-js/*.page

endif
