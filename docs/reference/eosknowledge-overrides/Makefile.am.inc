if ENABLE_JS_DOC

build_naturaldocs_verbose = $(build_naturaldocs_verbose_@AM_V@)
build_naturaldocs_verbose_ = $(build_naturaldocs_verbose_@AM_DEFAULT_V@)
build_naturaldocs_verbose_0 = @echo '  DOC    Building JS overrides docs';

naturaldocs_input_files = \
	overrides/EosKnowledge.js \
	overrides/articleCard.js \
	overrides/card.js \
	overrides/config.js \
	overrides/contentObjectModel.js \
	overrides/homePageA.js \
	overrides/lessonCard.js \
	overrides/lightbox.js \
	overrides/listCard.js \
	overrides/progressCard.js \
	overrides/tableOfContents.js \
	overrides/treeNode.js \
	$(NULL)
# Stamp file is present if all the docs have been built, and carries the
# timestamp of the last successful build.
stamp_file = docs/reference/eosknowledge-overrides/doc-build.stamp

$(stamp_file): $(naturaldocs_input_files) docs/reference/eosknowledge-overrides/eos.css
	$(build_naturaldocs_verbose)$(MKDIR_P) $(@D)/html && \
	naturaldocs -i $(<D) -o HTML $(@D)/html -p $(@D) -s Default eos -hl All && \
	touch $@

dist_noinst_DATA += $(stamp_file)

naturaldocs_extra_clean_files = \
	docs/reference/eosknowledge-overrides/Data/*.nd \
	docs/reference/eosknowledge-overrides/Menu.txt \
	docs/reference/eosknowledge-overrides/Topics.txt \
	docs/reference/eosknowledge-overrides/Languages.txt \
	$(NULL)
EXTRA_DIST += docs/reference/eosknowledge-overrides/eos.css
CLEANFILES += $(stamp_file)
DISTCLEANFILES += \
	$(naturaldocs_extra_clean_files) \
	$(NULL)

distclean-local::
	@rm -rf docs/reference/eosknowledge-overrides/html

dist-hook::
	@mkdir -p $(distdir)/docs/reference/eosknowledge-overrides/html
	@cp -r docs/reference/eosknowledge-overrides/html/* $(distdir)/docs/reference/eosknowledge-overrides/html

endif
