if ENABLE_JS_DOC

build_searchdocs_verbose = $(build_searchdocs_verbose_@AM_V@)
build_searchdocs_verbose_ = $(build_searchdocs_verbose_@AM_DEFAULT_V@)
build_searchdocs_verbose_0 = @echo '  DOC    Building EosKnowledgeSearch docs';

## $(search_files) defined in js/Makefile.am.inc
searchdocs_input_files = $(search_files)
# Stamp file is present if all the docs have been built, and carries the
# timestamp of the last successful build.
search_stamp_file = docs/reference/eosknowledgesearch/doc-build.stamp

$(search_stamp_file): $(searchdocs_input_files) docs/reference/eosknowledgesearch/eos.css
	$(build_searchdocs_verbose)$(MKDIR_P) $(@D)/html && \
	naturaldocs -i $(<D) -o HTML $(@D)/html -p $(@D) -s Default eos -hl All && \
	touch $@

dist_noinst_DATA += $(search_stamp_file)

searchdocs_extra_clean_files = \
	docs/reference/eosknowledgesearch/Data/*.nd \
	docs/reference/eosknowledgesearch/Menu.txt \
	docs/reference/eosknowledgesearch/Topics.txt \
	docs/reference/eosknowledgesearch/Languages.txt \
	$(NULL)
EXTRA_DIST += docs/reference/eosknowledgesearch/eos.css
CLEANFILES += $(search_stamp_file)
DISTCLEANFILES += \
	$(searchdocs_extra_clean_files) \
	$(NULL)

distclean-local::
	@rm -rf docs/reference/eosknowledgesearch/html

# Copy from $builddir first, and if that's not there (for example during
# distcheck the docs don't get rebuilt because the stamp file is already there
# and the source files are not newer) copy from $srcdir.
dist-hook::
	@mkdir -p $(distdir)/docs/reference/eosknowledgesearch/html
	@if test -d docs/reference/eosknowledgesearch/html; then \
		cp -r docs/reference/eosknowledgesearch/html/* $(distdir)/docs/reference/eosknowledgesearch/html; \
	elif test -d $(srcdir)/docs/reference/eosknowledgesearch/html; then \
		cp -r $(srcdir)/docs/reference/eosknowledgesearch/html/* $(distdir)/docs/reference/eosknowledgesearch/html; \
	fi

endif
