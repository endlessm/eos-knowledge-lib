## Process this file with automake to produce Makefile.in

# Copyright 2014 Endless Mobile, Inc.

## -----------
## Makefile.am
## -----------
## Please keep this file well-commented.

# Subdirectories where we also want to run make
# (Make sure that the library is built before the docs)
SUBDIRS = po . docs/reference/eosknowledge

# Our Autoconf macros are kept in the m4/ directory
ACLOCAL_AMFLAGS = -I m4

# Forward declare variables we'll be modifying all over
bin_SCRIPTS =
BUILT_SOURCES =
CLEANFILES =
dist_noinst_DATA =
DISTCLEANFILES =
EXTRA_DIST = README.md
lib_LTLIBRARIES =
pkglib_LTLIBRARIES =

# Compiler flags
DEFS = -DLOCALEDIR=\"$(localedir)\" @DEFS@
AM_CFLAGS = $(STRICT_CFLAGS)

# Make sure to run Gtk-doc tests and build the documentation when doing
# 'make distcheck'
AM_DISTCHECK_CONFIGURE_FLAGS = \
	--enable-gtk-doc \
	--enable-gir-doc \
	--enable-js-doc \
	--enable-strict-flags \
	$(NULL)

# Make sure that 'make dist' includes documentation
if !CAN_MAKE_DIST
distdir:
	@echo "***"
	@echo "*** You must configure with --enable-gtk-doc, --enable-gir-doc, and"
	@echo "*** --enable-js-doc to run make dist or make distcheck."
	@echo "***"
	@false
endif

# # # SASS # # #

scss_verbose = $(scss_verbose_@AM_V@)
scss_verbose_ = $(scss_verbose_@AM_DEFAULT_V@)
scss_verbose_0 = @echo "  SCSS $@";

scss_toplevels = \
	$(srcdir)/data/templates/css/embedly.scss \
	$(srcdir)/data/templates/css/wikihow.scss \
	$(srcdir)/data/templates/css/wikimedia.scss \
	$(NULL)
scss_partials = \
	$(srcdir)/data/templates/css/_clipboard.scss \
	$(srcdir)/data/templates/css/_eos-no-link.scss \
	$(NULL)
scss_targets = $(patsubst $(srcdir)/%.scss,$(builddir)/%.css,$(scss_toplevels))

# Rebuild the css files whenever a partial changes
$(scss_targets): $(scss_partials)

# scss build rule
.scss.css:
	$(scss_verbose) $(MKDIR_P) $(dir $@) && $(SCSS) --compass -E utf-8 --stop-on-error --sourcemap=none $< $@

EXTRA_DIST += $(scss_toplevels) $(scss_partials)
CLEANFILES += $(scss_targets)
clean-local:
	rm -rf .sass-cache

# # # MAIN LIBRARY # # #

# Generate dependencies for make rule from XML resource file description. This
# is a quite tricky make rule. glib-compile-resources will error if any files
# are not found. Which means we need to build our sass before calling into it.
# So we can't just assign a variable here, but need an actual build rule with
# dependencies. Hence the gresourcedeps file.
gresourcedeps: $(scss_targets) data/eos-knowledge-library.gresource.xml
	$(AM_V_GEN) $(GLIB_COMPILE_RESOURCES) --sourcedir=$(srcdir)/data --sourcedir=$(builddir)/data --generate-dependencies \
		$(srcdir)/data/eos-knowledge-library.gresource.xml | tr '\n' ' ' | sed 's/^/resource_files = /' > $@
# This indirection keeps automake from including gresourcedeps and leaving it to make
DUMMY=gresourcedeps
include $(DUMMY)

# Generated sources for GResource file
eosknowledge/ekn-resource-private.h: data/eos-knowledge-library.gresource.xml gresourcedeps $(resource_files)
	$(AM_V_GEN) $(MKDIR_P) $(builddir)/data $(dir $@) && \
	$(GLIB_COMPILE_RESOURCES) --target=$@ --sourcedir=$(srcdir)/data --sourcedir=$(builddir)/data \
		--generate-header --internal $<
eosknowledge/ekn-resource.c: data/eos-knowledge-library.gresource.xml gresourcedeps $(resource_files)
	$(AM_V_GEN) $(MKDIR_P) $(builddir)/data $(dir $@) && \
	$(GLIB_COMPILE_RESOURCES) --target=$@ --sourcedir=$(srcdir)/data --sourcedir=$(builddir)/data \
		--generate-source --internal $<

BUILT_SOURCES += \
	eosknowledge/ekn-resource-private.h \
	eosknowledge/ekn-resource.c \
	$(NULL)
EXTRA_DIST += \
	$(filter-out $(scss_targets),$(resource_files)) \
	data/eos-knowledge-library.gresource.xml \
	$(NULL)
CLEANFILES += \
	gresourcedeps \
	$(BUILT_SOURCES) \
	$(NULL)

eosknowledge_public_installed_headers = eosknowledge/eosknowledge.h

eosknowledge_private_installed_headers = \
	eosknowledge/ekn-enums.h \
	eosknowledge/ekn-hello.h \
	eosknowledge/ekn-history-item-model.h \
	eosknowledge/ekn-history-model.h \
	eosknowledge/ekn-macros.h \
	eosknowledge/ekn-types.h \
	eosknowledge/ekn-util.h \
	eosknowledge/ekn-version.h \
	$(NULL)

eosknowledge_library_sources = \
	eosknowledge/ekn-hello.c \
	eosknowledge/ekn-history-item-model.c \
	eosknowledge/ekn-history-model.c \
	eosknowledge/ekn-init.c eosknowledge/ekn-init-private.h \
	eosknowledge/ekn-tree-node.c \
	eosknowledge/ekn-loading-animation.c \
	eosknowledge/ekn-util.c \
	$(NULL)

# Endless Knowledge Apps GUI library
lib_LTLIBRARIES += libeosknowledge-@EKN_API_VERSION@.la
libeosknowledge_@EKN_API_VERSION@_la_SOURCES = \
	$(eosknowledge_public_installed_headers) \
	$(eosknowledge_private_installed_headers) \
	$(eosknowledge_library_sources) \
	$(NULL)
nodist_libeosknowledge_@EKN_API_VERSION@_la_SOURCES = \
	$(BUILT_SOURCES) \
	$(NULL)
# Defining G_LOG_DOMAIN allows you to run any program with
# G_MESSAGES_DEBUG=EosKnowledgeLibrary ./myprogram
# and turn on debug messages
libeosknowledge_@EKN_API_VERSION@_la_CPPFLAGS = \
	@EOS_KNOWLEDGE_CFLAGS@ \
	@EOS_C_COVERAGE_CFLAGS@ \
	-DG_LOG_DOMAIN=\"EosKnowledgeLibrary\" \
	-DCOMPILING_EOS_KNOWLEDGE \
	-DDATADIR=\""$(datadir)"\" \
	$(NULL)
libeosknowledge_@EKN_API_VERSION@_la_CFLAGS = $(AM_CFLAGS)
libeosknowledge_@EKN_API_VERSION@_la_LIBADD = @EOS_KNOWLEDGE_LIBS@
libeosknowledge_@EKN_API_VERSION@_la_LDFLAGS = \
	@EOS_C_COVERAGE_LDFLAGS@ \
	-version-info @EKN_LT_VERSION_INFO@ \
	-export-symbols-regex "^ekn_" \
	$(NULL)

# Public header files
publicincludedir = $(includedir)/@EKN_API_NAME@
nobase_publicinclude_HEADERS = \
	$(eosknowledge_public_installed_headers) \
	$(eosknowledge_private_installed_headers) \
	$(NULL)

# Pkg-config file
pkgconfigdir = $(libdir)/pkgconfig
pkgconfig_DATA = @EKN_API_NAME@.pc
DISTCLEANFILES += @EKN_API_NAME@.pc
EXTRA_DIST += @EKN_API_NAME@.pc.in

# # # SEARCH LIBRARY # # #

lib_LTLIBRARIES += libeosknowledgesearchprivate.la
libeosknowledgesearchprivate_la_SOURCES = \
        eosknowledgesearchprivate/ekns-subtree-dispatcher.c \
        eosknowledgesearchprivate/ekns-subtree-dispatcher.h

libeosknowledgesearchprivate_la_CPPFLAGS = @EOS_KNOWLEDGE_CFLAGS@
libeosknowledgesearchprivate_la_CFLAGS = $(AM_CFLAGS)
libeosknowledgesearchprivate_la_LIBADD = @EOS_KNOWLEDGE_LIBS@

# # # WEBKIT EXTENSION LIBRARIES # # #

# WebKit web extension for determining DOM element coordinates for tooltips
pkglib_LTLIBRARIES += libtooltipplugin.la
libtooltipplugin_la_SOURCES = lib/tooltipplugin.c
libtooltipplugin_la_CFLAGS = $(TOOLTIP_PLUGIN_CFLAGS)
libtooltipplugin_la_CPPFLAGS = \
	-DPKGDATADIR=\""$(pkgdatadir)"\" \
	-DLOCALEDIR=\""$(datadir)/locale"\" \
	$(NULL)
libtooltipplugin_la_LIBADD = $(TOOLTIP_PLUGIN_LIBS)
libtooltipplugin_la_LDFLAGS = -module -avoid-version -no-undefined

# # # JAVASCRIPT # # #

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
	overrides/historyItem.js \
	overrides/homePage.js \
	overrides/homePageA.js \
	overrides/homePageB.js \
	overrides/infiniteScrolledWindow.js \
	overrides/launcher.js \
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
	overrides/licenses.js \
	overrides/tabButton.js \
	overrides/utils.js \
	overrides/videoPreviewer.js \
	$(NULL)
dist_pkgoverrides_DATA = $(public_overrides) $(private_overrides)

reader_overrides = \
	overrides/reader/articlePage.js \
	overrides/reader/card.js \
	overrides/reader/donePage.js \
	overrides/reader/overviewPage.js \
	overrides/reader/presenter.js \
	overrides/reader/progressLabel.js \
	overrides/reader/searchResultsPage.js \
	overrides/reader/standalonePage.js \
	overrides/reader/titleView.js \
	overrides/reader/userSettingsModel.js \
	overrides/reader/webviewTooltip.js \
	overrides/reader/window.js \
	$(NULL)
readeroverridesdir = $(pkgoverridesdir)/reader
dist_readeroverrides_DATA = $(reader_overrides)

subst = $(SED) -e 's,%pkglibdir%,$(pkglibdir),g'
overrides/config.js: overrides/config.js.in Makefile
	$(MKDIR_P) overrides
	$(AM_V_GEN)$(subst) $< > $@

CLEANFILES += overrides/config.js

jsdir = $(pkgdatadir)/js

search_files = \
	js/search/EosKnowledgeSearch.js \
	js/search/articleObjectModel.js \
	js/search/blacklist.js \
	js/search/contentObjectModel.js \
	js/search/datadir.js \
	js/search/engine.js \
	js/search/mediaObjectModel.js \
	js/search/searchProvider.js \
	js/search/searchUtils.js \
	js/search/treeNode.js \
	js/search/xapianQuery.js \
	$(NULL)
searchdir = $(jsdir)/search
dist_search_DATA = $(search_files)

EXTRA_DIST += js/ekn-app-runner js/ekn-search-provider
bin_SCRIPTS += js/ekn-app-runner js/ekn-search-provider

# Link our libraries to the system gjs directory
gjsdir = $(datadir)/gjs-1.0
overridesdir = $(gjsdir)/overrides
install-data-hook:
	$(MKDIR_P) $(DESTDIR)$(overridesdir)
	rm -f $(DESTDIR)$(overridesdir)/EosKnowledge.js
	ln -s $(pkgoverridesdir)/EosKnowledge.js \
		$(DESTDIR)$(overridesdir)/EosKnowledge.js
	rm -f $(DESTDIR)$(gjsdir)/EosKnowledgeSearch.js
	ln -s $(searchdir)/EosKnowledgeSearch.js \
		$(DESTDIR)$(gjsdir)/EosKnowledgeSearch.js

uninstall-hook:
	rm -f $(DESTDIR)$(overridesdir)/EosKnowledge.js
	rm -f $(DESTDIR)$(gjsdir)/EosKnowledgeSearch.js

# # # TESTS # # #

javascript_tests = \
	tests/eosknowledge/testArticleCard.js \
	tests/eosknowledge/testArticleHTMLRenderer.js \
	tests/eosknowledge/testArticlePage.js \
	tests/eosknowledge/testArticlePresenter.js \
	tests/eosknowledge/testCard.js \
	tests/eosknowledge/testCardA.js \
	tests/eosknowledge/testCardB.js \
	tests/eosknowledge/testHello.js \
	tests/eosknowledge/testHistoryItemModel.js \
	tests/eosknowledge/testHistoryModel.js \
	tests/eosknowledge/testHomePage.js \
	tests/eosknowledge/testHomePageA.js \
	tests/eosknowledge/testHomePageB.js \
	tests/eosknowledge/testLessonCard.js \
	tests/eosknowledge/testLightbox.js \
	tests/eosknowledge/testListCard.js \
	tests/eosknowledge/testMediaInfobox.js \
	tests/eosknowledge/testNoSearchResultsPageA.js \
	tests/eosknowledge/testNoSearchResultsPageB.js \
	tests/eosknowledge/testPDFView.js \
	tests/eosknowledge/testPresenter.js \
	tests/eosknowledge/testPreviewer.js \
	tests/eosknowledge/testProgressCard.js \
	tests/eosknowledge/testSectionArticlePageA.js \
	tests/eosknowledge/testSectionArticlePageB.js \
	tests/eosknowledge/testSectionPageA.js \
	tests/eosknowledge/testSectionPageB.js \
	tests/eosknowledge/testSpaceContainer.js \
	tests/eosknowledge/testTableOfContents.js \
	tests/eosknowledge/testTextCard.js \
	tests/eosknowledge/testWindow.js \
	tests/eosknowledge/reader/testArticlePage.js \
	tests/eosknowledge/reader/testCard.js \
	tests/eosknowledge/reader/testDonePage.js \
	tests/eosknowledge/reader/testOverviewPage.js \
	tests/eosknowledge/reader/testPresenter.js \
	tests/eosknowledge/reader/testProgressLabel.js \
	tests/eosknowledge/reader/testSearchResultsPage.js \
	tests/eosknowledge/reader/testTitleView.js \
	tests/eosknowledge/reader/testUserSettingsModel.js \
	tests/eosknowledge/reader/testWebExtension.js \
	tests/eosknowledge/reader/testWebviewTooltip.js \
	tests/eosknowledge/reader/testWindow.js \
	tests/eosknowledgesearch/testArticleObjectModel.js \
	tests/eosknowledgesearch/testContentObjectModel.js \
	tests/eosknowledgesearch/testDatadir.js \
	tests/eosknowledgesearch/testEngine.js \
	tests/eosknowledgesearch/testMediaObjectModels.js \
	tests/eosknowledgesearch/testTreeNode.js \
	tests/eosknowledgesearch/testXapianQuery.js \
	$(NULL)
test_content = \
	tests/test-content/agot.svg \
	tests/test-content/app.json \
	tests/test-content/article-search-results.jsonld \
	tests/test-content/content-search-results.jsonld \
	tests/test-content/emacs.jsonld \
	tests/test-content/frango-frito.jsonld \
	tests/test-content/greyjoy-article.jsonld \
	tests/test-content/media-search-results.jsonld \
	tests/test-content/mexico.html \
	tests/test-content/mexico.jsonld \
	tests/test-content/never-gonna-give-you-up-video.jsonld \
	tests/test-content/overrides.css \
	tests/test-content/pdf-sample1.pdf \
	tests/test-content/rick-astley-image.jsonld \
	tests/test-content/sample.mp4 \
	$(NULL)
EXTRA_DIST += \
	$(javascript_tests) \
	$(test_content) \
	tests/ContainsMatcher.js \
	tests/CssClassMatcher.js \
	tests/InstanceOfMatcher.js \
	tests/utils.js \
	tests/WidgetDescendantMatcher.js \
	$(NULL)

# Test gresource
test_gresource = tests/test-content/test-content.gresource
test_gresource_deps = $(shell $(GLIB_COMPILE_RESOURCES) --sourcedir=$(srcdir)/tests/test-content --generate-dependencies $(srcdir)/$(test_gresource).xml)
tests/test-content/test-content.gresource: $(test_gresource).xml $(test_gresource_deps)
	$(AM_V_GEN) $(MKDIR_P) $(builddir)/tests/test-content && \
	$(GLIB_COMPILE_RESOURCES) --target=$@ --sourcedir=$(srcdir)/tests/test-content  $<
EXTRA_DIST += \
	$(test_gresource_deps) \
	$(test_gresource).xml \
	$(NULL)
CLEANFILES += $(test_gresource)
# Force gresource to get compiled as part of make
noinst_DATA = tests/test-content/test-content.gresource

# Run tests when running 'make check'
TESTS = $(javascript_tests)
LOG_COMPILER = gtester
AM_LOG_FLAGS = -k --verbose

## Define required variables and include Jasmine makefile fragment
TEST_EXTENSIONS =
AM_JS_LOG_FLAGS =
JASMINE_SUBMODULE_PATH = $(top_srcdir)/tests/jasmine
include tests/jasmine/Makefile-jasmine.am.inc

# Use locally built versions of EosKnowledge-0.gir, JS modules, and libraries.
# We clobber GJS_PATH and include $(top_builddir) and $(top_srcdir) so that
# gjs will find override modules in /overrides. The override directory itself
# is also added to the gjs path for testing private js functionality not added
# to the EosKnowledge module. The directories in /js are added for our pure
# javascript libraries. Lastly the tests directory is added for utility modules
# local to the tests.
# (May need to change to AM_TESTS_ENVIRONMENT in a later version of Automake)
TESTS_ENVIRONMENT = \
	export GJS_PATH="$(top_builddir):$(top_srcdir):$(top_srcdir)/overrides:$(top_srcdir)/js/search:$(top_srcdir)/tests"; \
	export GI_TYPELIB_PATH="$(top_builddir)$${GI_TYPELIB_PATH:+:$$GI_TYPELIB_PATH}"; \
	export LD_LIBRARY_PATH="$(top_builddir)/.libs$${LD_LIBRARY_PATH:+:$$LD_LIBRARY_PATH}"; \
	export G_TEST_SRCDIR="$(abs_srcdir)/tests"; \
	export G_TEST_BUILDDIR="$(abs_builddir)/tests"; \
	$(NULL)

# # # COVERAGE # # #

EOS_JS_COVERAGE_FILES = \
	$(public_overrides) \
	$(private_overrides) \
	$(reader_overrides) \
	$(search_files) \
	$(NULL)

@EOS_COVERAGE_RULES@

AM_JS_LOG_FLAGS += @EOS_JS_COVERAGE_LOG_FLAGS@
AM_LDFLAGS = @EOS_C_COVERAGE_LDFLAGS@

# # # SEARCH PROVIDER # # #

servicedir = $(datadir)/dbus-1/services
service_DATA = data/com.endlessm.EknSearchProvider.service

data/com.endlessm.EknSearchProvider.service: $(top_srcdir)/data/com.endlessm.EknSearchProvider.service.in Makefile
	$(AM_V_GEN) sed -e 's|@BINDIR@|$(bindir)|g' $< > $@
BUILT_SOURCES += data/com.endlessm.EknSearchProvider.service
EXTRA_DIST += data/com.endlessm.EknSearchProvider.service.in

# # # DOCUMENTATION # # #

# Regular Gtk-Doc and naturaldocs documentation are built with recursive make

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

if ENABLE_JS_DOC

build_naturaldocs_verbose = $(build_naturaldocs_verbose_@AM_V@)
build_naturaldocs_verbose_ = $(build_naturaldocs_verbose_@AM_DEFAULT_V@)
build_naturaldocs_verbose_0 = @echo '  DOC    Building naturaldocs for $(naturaldocs_input_dir)';

# Stamp file is present if all the docs have been built, and carries the
# timestamp of the last successful build.
stamp_file = docs/reference/js/doc-build.stamp

js_doc_sources = $(public_overrides) $(private_overrides) $(reader_overrides) $(search_files)

$(stamp_file): docs/reference/js/eos.css $(js_doc_sources)
	$(build_naturaldocs_verbose)$(MKDIR_P) $(@D)/html && \
	cd $(@D) && \
	$(NATURALDOCS) -o HTML html -p . -s Default eos -hl All \
				-i $(abs_srcdir)/js/search \
				-i $(abs_srcdir)/overrides && \
	touch $(@F)

dist_noinst_DATA += $(stamp_file)

naturaldocs_extra_clean_files = \
	docs/reference/js/Data/*.nd \
	docs/reference/js/Menu.txt \
	docs/reference/js/Topics.txt \
	docs/reference/js/Languages.txt \
	$(NULL)
EXTRA_DIST += docs/reference/js/eos.css
CLEANFILES += $(stamp_file)
DISTCLEANFILES += $(naturaldocs_extra_clean_files)

distclean-local::
	@rm -rf docs/reference/js/html

# Copy from $builddir first, and if that's not there (for example during
# distcheck the docs don't get rebuilt because the stamp file is already there
# and the source files are not newer) copy from $srcdir.
dist-hook::
	@mkdir -p $(distdir)/docs/reference/js/html
	@if test -d docs/reference/js/html; then \
		cp -r docs/reference/js/html/* $(distdir)/docs/reference/js/html; \
	elif test -d $(srcdir)/docs/reference/js/html; then \
		cp -r $(srcdir)/docs/reference/js/html/* $(distdir)/docs/reference/js/html; \
	fi

endif

# # # INTROSPECTION # # #

-include $(INTROSPECTION_MAKEFILE)
INTROSPECTION_GIRS =
INTROSPECTION_SCANNER_ARGS = --add-include-path=$(srcdir) --warn-all $(EOS_KNOWLEDGE_CFLAGS)
INTROSPECTION_COMPILER_ARGS = --includedir=$(srcdir)

if HAVE_INTROSPECTION
introspection_sources = \
	$(filter-out %-private.h, $(eosknowledge_library_sources)) \
	$(eosknowledge_public_installed_headers) \
	$(eosknowledge_private_installed_headers) \
	$(NULL)

EosKnowledge-@EKN_API_VERSION@.gir: libeosknowledge-@EKN_API_VERSION@.la Makefile
EosKnowledge_@EKN_API_VERSION@_gir_INCLUDES = \
	Endless-0 \
	Gio-2.0 \
	GLib-2.0 \
	GObject-2.0 \
	WebKit2-4.0 \
	Gtk-3.0 \
	$(NULL)
EosKnowledge_@EKN_API_VERSION@_gir_SCANNERFLAGS = \
	--identifier-prefix=Ekn \
	--symbol-prefix=ekn \
	-DCOMPILING_EOS_KNOWLEDGE \
	$(NULL)
EosKnowledge_@EKN_API_VERSION@_gir_LIBS = libeosknowledge-@EKN_API_VERSION@.la
EosKnowledge_@EKN_API_VERSION@_gir_FILES = $(introspection_sources)
EosKnowledge_@EKN_API_VERSION@_gir_EXPORT_PACKAGES = @EKN_API_NAME@
INTROSPECTION_GIRS += EosKnowledge-@EKN_API_VERSION@.gir

EosKnowledgeSearchPrivate-1.0.gir: libeosknowledgesearchprivate.la
EosKnowledgeSearchPrivate_1_0_gir_INCLUDES = Gio-2.0
EosKnowledgeSearchPrivate_1_0_gir_SCANNERFLAGS = --warn-all --warn-error --identifier-prefix=Ekns --symbol-prefix=ekns
EosKnowledgeSearchPrivate_1_0_gir_LIBS = libeosknowledgesearchprivate.la
EosKnowledgeSearchPrivate_1_0_gir_FILES = $(libeosknowledgesearchprivate_la_SOURCES)
INTROSPECTION_GIRS += EosKnowledgeSearchPrivate-1.0.gir

girdir = $(datadir)/gir-1.0
gir_DATA = $(INTROSPECTION_GIRS)

typelibdir = $(libdir)/girepository-1.0
typelib_DATA = $(INTROSPECTION_GIRS:.gir=.typelib)

CLEANFILES += $(gir_DATA) $(typelib_DATA)
endif
