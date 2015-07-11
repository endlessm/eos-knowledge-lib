## Process this file with automake to produce Makefile.in

# Copyright 2014 Endless Mobile, Inc.

## -----------
## Makefile.am
## -----------
## Please keep this file well-commented.

# Subdirectories where we also want to run make
# (Make sure that the library is built before the docs)
SUBDIRS = po . docs/reference/eosknowledgeprivate

# Our Autoconf macros are kept in the m4/ directory
ACLOCAL_AMFLAGS = -I m4

# Forward declare variables we'll be modifying all over
bin_SCRIPTS =
dist_bin_SCRIPTS =
CLEANFILES =
dist_noinst_DATA =
DISTCLEANFILES =
EXTRA_DIST = README.md
pkgdata_DATA =
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

# # # GRESOURCES # # #

scss_verbose = $(scss_verbose_@AM_V@)
scss_verbose_ = $(scss_verbose_@AM_DEFAULT_V@)
scss_verbose_0 = @echo "  SCSS $@";

scss_toplevels = \
	$(srcdir)/data/templates/css/embedly.scss \
	$(srcdir)/data/templates/css/reader.scss \
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

# Generate dependencies for make rule from XML resource file description. This
# is a quite tricky make rule. glib-compile-resources will error if any files
# are not found. Which means we need to build our sass before calling into it.
# So we can't just assign a variable here, but need an actual build rule with
# dependencies. Hence the gresourcedeps file.
gresourcedeps: $(scss_targets) data/eos-knowledge.gresource.xml
	$(AM_V_GEN) $(GLIB_COMPILE_RESOURCES) --sourcedir=$(srcdir)/data --sourcedir=$(builddir)/data --generate-dependencies \
		$(srcdir)/data/eos-knowledge.gresource.xml | tr '\n' ' ' | sed 's/^/resource_files = /' > $@
# This indirection keeps automake from including gresourcedeps and leaving it to make
DUMMY=gresourcedeps
include $(DUMMY)

# Generated sources for GResource file
data/eos-knowledge.gresource: data/eos-knowledge.gresource.xml gresourcedeps $(resource_files)
	$(AM_V_GEN) $(MKDIR_P) $(dir $@) && \
	$(GLIB_COMPILE_RESOURCES) --target=$@ --sourcedir=$(srcdir)/data \
		--sourcedir=$(builddir)/data $<

pkgdata_DATA += data/eos-knowledge.gresource

EXTRA_DIST += \
	$(filter-out $(scss_targets),$(resource_files)) \
	data/eos-knowledge.gresource.xml \
	$(NULL)
CLEANFILES += \
	data/eos-knowledge.gresource \
	gresourcedeps \
	$(NULL)

# # # MAIN LIBRARY # # #

eosknowledgeprivate_headers = \
	eosknowledgeprivate/eosknowledge.h \
	eosknowledgeprivate/ekn-enums.h \
	eosknowledgeprivate/ekn-hello.h \
	eosknowledgeprivate/ekn-history-item-model.h \
	eosknowledgeprivate/ekn-history-model.h \
	eosknowledgeprivate/ekn-macros.h \
	eosknowledgeprivate/ekn-types.h \
	eosknowledgeprivate/ekn-util.h \
	eosknowledgeprivate/ekn-version.h \
	$(NULL)

eosknowledgeprivate_sources = \
	eosknowledgeprivate/ekn-enums.c \
	eosknowledgeprivate/ekn-hello.c \
	eosknowledgeprivate/ekn-history-item-model.c \
	eosknowledgeprivate/ekn-history-model.c \
	eosknowledgeprivate/ekn-init.c eosknowledgeprivate/ekn-init-private.h \
	eosknowledgeprivate/ekn-util.c \
	$(NULL)

# Endless Knowledge Apps GUI library
pkglib_LTLIBRARIES += libeosknowledgeprivate.la
libeosknowledgeprivate_la_SOURCES = \
	$(eosknowledgeprivate_headers) \
	$(eosknowledgeprivate_sources) \
	$(NULL)
# Defining G_LOG_DOMAIN allows you to run any program with
# G_MESSAGES_DEBUG=EosKnowledge ./myprogram
# and turn on debug messages
libeosknowledgeprivate_la_CPPFLAGS = \
	@EOS_KNOWLEDGE_PRIVATE_CFLAGS@ \
	@EOS_C_COVERAGE_CFLAGS@ \
	-DG_LOG_DOMAIN=\"EosKnowledge\" \
	-DCOMPILING_EOS_KNOWLEDGE \
	-DDATADIR=\""$(datadir)"\" \
	$(NULL)
libeosknowledgeprivate_la_CFLAGS = $(AM_CFLAGS)
libeosknowledgeprivate_la_LIBADD = @EOS_KNOWLEDGE_PRIVATE_LIBS@
libeosknowledgeprivate_la_LDFLAGS = \
	@EOS_C_COVERAGE_LDFLAGS@ \
	-export-symbols-regex "^ekn_" \
	-avoid-version \
	$(NULL)

# # # SEARCH LIBRARY # # #

pkglib_LTLIBRARIES += libeosknowledgesearchprivate.la
libeosknowledgesearchprivate_la_SOURCES = \
        eosknowledgesearchprivate/ekns-subtree-dispatcher.c \
        eosknowledgesearchprivate/ekns-subtree-dispatcher.h

libeosknowledgesearchprivate_la_CPPFLAGS = @EOS_KNOWLEDGE_PRIVATE_CFLAGS@
libeosknowledgesearchprivate_la_CFLAGS = $(AM_CFLAGS)
libeosknowledgesearchprivate_la_LIBADD = @EOS_KNOWLEDGE_PRIVATE_LIBS@
libeosknowledgesearchprivate_la_LDFLAGS = -avoid-version

# # # WEBKIT EXTENSION LIBRARIES # # #

webextensiondir = $(pkglibdir)/web-extensions
webextension_LTLIBRARIES =

webextension_LTLIBRARIES += libgresourceplugin.la
libgresourceplugin_la_SOURCES = lib/gresourceplugin.c
libgresourceplugin_la_CFLAGS = $(GRESOURCE_PLUGIN_CFLAGS)
libgresourceplugin_la_CPPFLAGS = \
	-DPKGDATADIR=\""$(pkgdatadir)"\" \
	$(NULL)
libgresourceplugin_la_LIBADD = $(GRESOURCE_PLUGIN_LIBS)
libgresourceplugin_la_LDFLAGS = -module -avoid-version -no-undefined

# WebKit web extension for determining DOM element coordinates for tooltips
webextension_LTLIBRARIES += libtooltipplugin.la
libtooltipplugin_la_SOURCES = lib/tooltipplugin.c
libtooltipplugin_la_CFLAGS = $(TOOLTIP_PLUGIN_CFLAGS)
libtooltipplugin_la_CPPFLAGS = \
	-DPKGDATADIR=\""$(pkgdatadir)"\" \
	-DLOCALEDIR=\""$(datadir)/locale"\" \
	$(NULL)
libtooltipplugin_la_LIBADD = $(TOOLTIP_PLUGIN_LIBS)
libtooltipplugin_la_LDFLAGS = -module -avoid-version -no-undefined

# WebKit web extension for translating with webkit side javascript
webextension_LTLIBRARIES += libencyclopediaplugin.la
libencyclopediaplugin_la_SOURCES = lib/encyclopediaplugin.c
libencyclopediaplugin_la_CFLAGS = $(ENCYCLOPEDIA_PLUGIN_CFLAGS)
libencyclopediaplugin_la_CPPFLAGS = \
	-DPKGDATADIR=\""$(pkgdatadir)"\" \
	-DLOCALEDIR=\""$(datadir)/locale"\" \
	$(NULL)
libencyclopediaplugin_la_LIBADD = $(ENCYCLOPEDIA_PLUGIN_LIBS)
libencyclopediaplugin_la_LDFLAGS = -module -avoid-version -no-undefined

# # # JAVASCRIPT # # #

js_files = \
	js/app/application.js \
	js/app/articleHTMLRenderer.js \
	js/app/articlePage.js \
	js/app/articlePresenter.js \
	js/app/categoriesPage.js \
	js/app/compat/compat.js \
	js/app/compat/cssParse.js \
	js/app/compat/styleKnobGenerator.js \
	js/app/config.js \
	js/app/eknWebview.js \
	js/app/encyclopedia/contentPage.js \
	js/app/encyclopedia/homePage.js \
	js/app/encyclopedia/model.js \
	js/app/encyclopedia/presenter.js \
	js/app/encyclopedia/runner.js \
	js/app/encyclopedia/view.js \
	js/app/historyItem.js \
	js/app/historyPresenter.js \
	js/app/homePage.js \
	js/app/homePageA.js \
	js/app/homePageB.js \
	js/app/imagePreviewer.js \
	js/app/infiniteScrolledWindow.js \
	js/app/interfaces/card.js \
	js/app/interfaces/module.js \
	js/app/launcher.js \
	js/app/lightbox.js \
	js/app/lightboxPresenter.js \
	js/app/marginButton.js \
	js/app/moduleFactory.js \
	js/app/modules/appBanner.js \
	js/app/modules/articleCard.js \
	js/app/modules/articleSnippetCard.js \
	js/app/modules/cardA.js \
	js/app/modules/cardB.js \
	js/app/modules/mediaCard.js \
	js/app/modules/pdfCard.js \
	js/app/modules/readerCard.js \
	js/app/modules/searchBox.js \
	js/app/modules/setBannerCard.js \
	js/app/modules/textCard.js \
	js/app/mustache.js \
	js/app/navButtonOverlay.js \
	js/app/noSearchResultsPage.js \
	js/app/PDFView.js \
	js/app/presenter.js \
	js/app/presenterLoader.js \
	js/app/previewer.js \
	js/app/reader/articlePage.js \
	js/app/reader/donePage.js \
	js/app/reader/overviewPage.js \
	js/app/reader/presenter.js \
	js/app/reader/progressLabel.js \
	js/app/reader/searchResultsPage.js \
	js/app/reader/standalonePage.js \
	js/app/reader/titleView.js \
	js/app/reader/userSettingsModel.js \
	js/app/reader/webviewTooltip.js \
	js/app/reader/window.js \
	js/app/runner.js \
	js/app/sectionArticlePage.js \
	js/app/sectionPage.js \
	js/app/sectionPageA.js \
	js/app/sectionPageB.js \
	js/app/spaceContainer.js \
	js/app/styleClasses.js \
	js/app/tabButton.js \
	js/app/tableOfContents.js \
	js/app/utils.js \
	js/app/warehouse.js \
	js/app/webkitContextSetup.js \
	js/app/window.js \
	js/search/application.js \
	js/search/articleObjectModel.js \
	js/search/asyncTask.js \
	js/search/blacklist.js \
	js/search/contentObjectModel.js \
	js/search/datadir.js \
	js/search/engine.js \
	js/search/mediaObjectModel.js \
	js/search/queryObject.js \
	js/search/searchProvider.js \
	js/search/treeNode.js \
	js/search/utils.js \
	$(NULL)

jsdir = $(pkgdatadir)/js
# We want nobase to preserve directory structure, but that will include the js
# directory in the path, so we need to install to pkgdatadir instead of jsdir here.
nobase_dist_pkgdata_DATA = $(js_files)

# Overrides for the C library
overridesdir = $(jsdir)/overrides
dist_overrides_DATA = overrides/EosKnowledgePrivate.js

# # # SUBSTITUTED FILES # # #
# These files need to be filled in with make variables

subst = $(SED) \
	-e 's,%datadir%,$(datadir),g' \
	-e 's,%jsdir%,$(jsdir),g' \
	-e 's,%pkgdatadir%,$(pkgdatadir),g' \
	-e 's,%pkglibdir%,$(pkglibdir),g' \
	-e 's,%typelibdir%,$(typelibdir),g' \
	-e 's,%webextensiondir%,$(webextensiondir),g' \
	$(NULL)

subst_files = \
	js/app/config.js \
	ekn-search-provider \
	ekn-app-runner \
	eos-encyclopedia \
	$(NULL)

$(subst_files): %: %.in Makefile
	$(MKDIR_P) $(@D)
	$(AM_V_GEN)$(subst) $< > $@

CLEANFILES += $(subst_files)
EXTRA_DIST += $(patsubst %,%.in,$(subst_files))

dist_bin_SCRIPTS += \
	tools/kermit \
	$(NULL)

bin_SCRIPTS += \
	ekn-search-provider \
	ekn-app-runner \
	eos-encyclopedia \
	$(NULL)

# # # TESTS # # #

javascript_tests = \
	tests/eosknowledgeprivate/testHello.js \
	tests/eosknowledgeprivate/testHistoryItemModel.js \
	tests/eosknowledgeprivate/testHistoryModel.js \
	tests/js/app/interfaces/testCard.js \
	tests/js/app/interfaces/testModule.js \
	tests/js/app/modules/testAppBanner.js \
	tests/js/app/modules/testArticleCard.js \
	tests/js/app/modules/testArticleSnippetCard.js \
	tests/js/app/modules/testCardA.js \
	tests/js/app/modules/testCardB.js \
	tests/js/app/modules/testMediaCard.js \
	tests/js/app/modules/testReaderCard.js \
	tests/js/app/modules/testSetBannerCard.js \
	tests/js/app/modules/testTextCard.js \
	tests/js/app/reader/testDonePage.js \
	tests/js/app/reader/testOverviewPage.js \
	tests/js/app/reader/testProgressLabel.js \
	tests/js/app/reader/testReaderArticlePage.js \
	tests/js/app/reader/testReaderPresenter.js \
	tests/js/app/reader/testReaderWindow.js \
	tests/js/app/reader/testSearchResultsPage.js \
	tests/js/app/reader/testTitleView.js \
	tests/js/app/reader/testUserSettingsModel.js \
	tests/js/app/reader/testWebExtension.js \
	tests/js/app/reader/testWebviewTooltip.js \
	tests/js/app/testArticleHTMLRenderer.js \
	tests/js/app/testArticlePage.js \
	tests/js/app/testArticlePresenter.js \
	tests/js/app/testHistoryPresenter.js \
	tests/js/app/testHomePage.js \
	tests/js/app/testHomePageA.js \
	tests/js/app/testHomePageB.js \
	tests/js/app/testLightbox.js \
	tests/js/app/testLightboxPresenter.js \
	tests/js/app/testModuleFactory.js \
	tests/js/app/testNoSearchResultsPageA.js \
	tests/js/app/testNoSearchResultsPageB.js \
	tests/js/app/testPDFView.js \
	tests/js/app/testPresenter.js \
	tests/js/app/testPreviewer.js \
	tests/js/app/testSectionArticlePageA.js \
	tests/js/app/testSectionArticlePageB.js \
	tests/js/app/testSectionPageA.js \
	tests/js/app/testSectionPageB.js \
	tests/js/app/testSpaceContainer.js \
	tests/js/app/testStyleKnobGenerator.js \
	tests/js/app/testTableOfContents.js \
	tests/js/app/testUtils.js \
	tests/js/app/testWindow.js \
	tests/js/search/testArticleObjectModel.js \
	tests/js/search/testAsyncTask.js \
	tests/js/search/testContentObjectModel.js \
	tests/js/search/testDatadir.js \
	tests/js/search/testEngine.js \
	tests/js/search/testMediaObjectModels.js \
	tests/js/search/testQueryObject.js \
	tests/js/search/testTreeNode.js \
	$(NULL)
test_content = \
	tests/test-content/agot.svg \
	tests/test-content/app.json \
	tests/test-content/mexico.html \
	tests/test-content/mexico.jsonld \
	tests/test-content/overrides.css \
	tests/test-content/overrides-a.css \
	tests/test-content/overrides-b.css \
	tests/test-content/overrides-reader.css \
	tests/test-content/pdf-sample1.pdf \
	$(NULL)
EXTRA_DIST += \
	$(javascript_tests) \
	$(test_content) \
	tests/ContainsMatcher.js \
	tests/CssClassMatcher.js \
	tests/InstanceOfMatcher.js \
	tests/minimalCard.js \
	tests/minimalModule.js \
	tests/mockFactory.js \
	tests/mockSearchBox.js \
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

TEST_EXTENSIONS = .js
JS_LOG_DRIVER = env AM_TAP_AWK='$(AWK)' $(SHELL) $(top_srcdir)/tap-driver.sh
JS_LOG_DRIVER_FLAGS = --comments
JS_LOG_COMPILER = jasmine
AM_JS_LOG_FLAGS = --tap --no-config @JASMINE_REPORT_ARGUMENT@

# Use locally built versions of EosKnowledgePrivate-1.0.gir, JS modules, and
# libraries. We clobber GJS_PATH and include the js directory and the
# $(top_srcdir) for including test helper files.
# (May need to change to AM_TESTS_ENVIRONMENT in a later version of Automake)
TESTS_ENVIRONMENT = \
	export GJS_PATH="$(top_srcdir):$(top_srcdir)/js"; \
	export GI_TYPELIB_PATH="$(top_builddir)$${GI_TYPELIB_PATH:+:$$GI_TYPELIB_PATH}"; \
	export LD_LIBRARY_PATH="$(top_builddir)/.libs$${LD_LIBRARY_PATH:+:$$LD_LIBRARY_PATH}"; \
	export G_TEST_SRCDIR="$(abs_srcdir)/tests"; \
	export G_TEST_BUILDDIR="$(abs_builddir)/tests"; \
	$(NULL)

EXTRA_DIST += jasmine.json

# # # COVERAGE # # #

EOS_JS_COVERAGE_FILES = \
	$(js_files) \
	$(NULL)

@EOS_COVERAGE_RULES@

AM_JS_LOG_FLAGS += @EOS_JS_COVERAGE_LOG_FLAGS@
AM_LDFLAGS = @EOS_C_COVERAGE_LDFLAGS@

# # # SEARCH PROVIDER # # #

servicedir = $(datadir)/dbus-1/services
service_DATA = data/com.endlessm.EknSearchProvider.service

data/com.endlessm.EknSearchProvider.service: $(top_srcdir)/data/com.endlessm.EknSearchProvider.service.in Makefile
	$(AM_V_GEN) sed -e 's|@BINDIR@|$(bindir)|g' $< > $@
CLEANFILES += data/com.endlessm.EknSearchProvider.service
EXTRA_DIST += data/com.endlessm.EknSearchProvider.service.in

# # # DOCUMENTATION # # #

# Regular Gtk-Doc and naturaldocs documentation are built with recursive make

if ENABLE_GIR_DOC

docs/reference/eosknowledgeprivate-js/index.page: $(INTROSPECTION_GIRS)
	$(MKDIR_P) $(@D)
	$(GIRDOCTOOL) -o $(@D) -l gjs $<

docs/reference/eosknowledgeprivate-js/html/index.html: docs/reference/eosknowledgeprivate-js/index.page
	$(MKDIR_P) $(@D)
	$(YELPBUILD) html -o $(@D) $(<D)

dist_noinst_DATA += docs/reference/eosknowledgeprivate-js/html/index.html

distclean-local::
	@rm -rf docs/reference/eosknowledgeprivate-js/html

dist-hook::
	@$(MKDIR_P) $(distdir)/docs/reference/eosknowledgeprivate-js/html
	@cp -r docs/reference/eosknowledgeprivate-js/html/*.html $(distdir)/docs/reference/eosknowledgeprivate-js/html
	@cp -r docs/reference/eosknowledgeprivate-js/html/*.css $(distdir)/docs/reference/eosknowledgeprivate-js/html
	@cp -r docs/reference/eosknowledgeprivate-js/html/*.js $(distdir)/docs/reference/eosknowledgeprivate-js/html

CLEANFILES += docs/reference/eosknowledgeprivate-js/*.page

endif

if ENABLE_JS_DOC

build_naturaldocs_verbose = $(build_naturaldocs_verbose_@AM_V@)
build_naturaldocs_verbose_ = $(build_naturaldocs_verbose_@AM_DEFAULT_V@)
build_naturaldocs_verbose_0 = @echo '  DOC    Building naturaldocs documentation';

# Stamp file is present if all the docs have been built, and carries the
# timestamp of the last successful build.
stamp_file = docs/reference/js/doc-build.stamp

$(stamp_file): docs/reference/js/eos.css $(js_files)
	$(build_naturaldocs_verbose)$(MKDIR_P) $(@D)/html && \
	cd $(@D) && \
	$(NATURALDOCS) -o HTML html -p . -s Default eos -hl All -i $(abs_srcdir)/js && \
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
	@$(MKDIR_P) $(distdir)/docs/reference/js/html
	@if test -d docs/reference/js/html; then \
		cp -r docs/reference/js/html/* $(distdir)/docs/reference/js/html; \
	elif test -d $(srcdir)/docs/reference/js/html; then \
		cp -r $(srcdir)/docs/reference/js/html/* $(distdir)/docs/reference/js/html; \
	fi

endif

# # # INTROSPECTION # # #

-include $(INTROSPECTION_MAKEFILE)
INTROSPECTION_GIRS =
INTROSPECTION_SCANNER_ARGS = --add-include-path=$(srcdir) --warn-all $(EOS_KNOWLEDGE_PRIVATE_CFLAGS)
INTROSPECTION_COMPILER_ARGS = --includedir=$(srcdir)

introspection_sources = \
	$(filter-out %-private.h, $(eosknowledgeprivate_sources)) \
	$(eosknowledgeprivate_headers) \
	$(NULL)

EosKnowledgePrivate-1.0.gir: libeosknowledgeprivate.la Makefile
EosKnowledgePrivate_1_0_gir_INCLUDES = \
	GLib-2.0 \
	GObject-2.0 \
	WebKit2-4.0 \
	Gtk-3.0 \
	$(NULL)
EosKnowledgePrivate_1_0_gir_SCANNERFLAGS = \
	--identifier-prefix=Ekn \
	--symbol-prefix=ekn \
	-DCOMPILING_EOS_KNOWLEDGE \
	$(NULL)
EosKnowledgePrivate_1_0_gir_LIBS = libeosknowledgeprivate.la
EosKnowledgePrivate_1_0_gir_FILES = $(introspection_sources)
INTROSPECTION_GIRS += EosKnowledgePrivate-1.0.gir

EosKnowledgeSearchPrivate-1.0.gir: libeosknowledgesearchprivate.la
EosKnowledgeSearchPrivate_1_0_gir_INCLUDES = Gio-2.0
EosKnowledgeSearchPrivate_1_0_gir_SCANNERFLAGS = --warn-all --warn-error --identifier-prefix=Ekns --symbol-prefix=ekns
EosKnowledgeSearchPrivate_1_0_gir_LIBS = libeosknowledgesearchprivate.la
EosKnowledgeSearchPrivate_1_0_gir_FILES = $(libeosknowledgesearchprivate_la_SOURCES)
INTROSPECTION_GIRS += EosKnowledgeSearchPrivate-1.0.gir

typelibdir = $(pkglibdir)/girepository-1.0
typelib_DATA = $(INTROSPECTION_GIRS:.gir=.typelib)

CLEANFILES += $(INTROSPECTION_GIRS) $(typelib_DATA)
