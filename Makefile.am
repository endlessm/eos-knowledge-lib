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
if EOS_ENABLE_COVERAGE
AM_DISTCHECK_CONFIGURE_FLAGS += --enable-coverage --with-coverage-dir=@EOS_COVERAGE_DIR@
endif EOS_ENABLE_COVERAGE

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
scss_verbose_0 = @echo "  SCSS     $@";

scss_toplevels = \
	$(srcdir)/data/css/buffet.scss \
	$(srcdir)/data/css/default.scss \
	$(srcdir)/data/css/encyclopedia.scss \
	$(srcdir)/data/css/mesh.scss \
	$(srcdir)/data/css/news.scss \
	$(srcdir)/data/css/picard.scss \
	$(srcdir)/data/templates/css/prensa-libre.scss \
	$(srcdir)/data/templates/css/buffet-custom.scss \
	$(srcdir)/data/templates/css/wikihow.scss \
	$(srcdir)/data/templates/css/wikimedia.scss \
	$(srcdir)/data/templates/css/clipboard.scss \
	$(NULL)
scss_partials = \
	$(srcdir)/data/css/_buffet_core.scss \
	$(srcdir)/data/css/_colors.scss \
	$(srcdir)/data/css/_common.scss \
	$(srcdir)/data/css/_typography.scss \
	$(srcdir)/data/css/modules/arrangement/_half.scss \
	$(srcdir)/data/css/modules/arrangement/_list.scss \
	$(srcdir)/data/css/modules/arrangement/_piano.scss \
	$(srcdir)/data/css/modules/arrangement/_scrollingList.scss \
	$(srcdir)/data/css/modules/arrangement/_sideBySide.scss \
	$(srcdir)/data/css/modules/arrangement/_squareGuys.scss \
	$(srcdir)/data/css/modules/arrangement/_thirties.scss \
	$(srcdir)/data/css/modules/arrangement/_windshield.scss \
	$(srcdir)/data/css/modules/banner/_app.scss \
	$(srcdir)/data/css/modules/banner/_context.scss \
	$(srcdir)/data/css/modules/banner/_search.scss \
	$(srcdir)/data/css/modules/banner/_set.scss \
	$(srcdir)/data/css/modules/card/_base.scss \
	$(srcdir)/data/css/modules/card/_deck.scss \
	$(srcdir)/data/css/modules/card/_knowledgeDocument.scss \
	$(srcdir)/data/css/modules/card/_list.scss \
	$(srcdir)/data/css/modules/card/_media.scss \
	$(srcdir)/data/css/modules/card/_post.scss \
	$(srcdir)/data/css/modules/card/_setPreview.scss \
	$(srcdir)/data/css/modules/card/_text.scss \
	$(srcdir)/data/css/modules/card/_thumb.scss \
	$(srcdir)/data/css/modules/card/_title.scss \
	$(srcdir)/data/css/modules/contentGroup/_cardContainer.scss \
	$(srcdir)/data/css/modules/contentGroup/_contentGroup.scss \
	$(srcdir)/data/css/modules/contentGroup/_hierarchicalSet.scss \
	$(srcdir)/data/css/modules/contentGroup/_highlights.scss \
	$(srcdir)/data/css/modules/contentGroup/_mediaLightbox.scss \
	$(srcdir)/data/css/modules/contentGroup/_search.scss \
	$(srcdir)/data/css/modules/contentGroup/_suggestedCategories.scss \
	$(srcdir)/data/css/modules/contentGroup/_supplementaryArticles.scss \
	$(srcdir)/data/css/modules/contentGroup/_thematic.scss \
	$(srcdir)/data/css/modules/layout/_dynamicBackground.scss \
	$(srcdir)/data/css/modules/layout/_infiniteScrolling.scss \
	$(srcdir)/data/css/modules/layout/_responsiveMargins.scss \
	$(srcdir)/data/css/modules/layout/_scrolling.scss \
	$(srcdir)/data/css/modules/layout/_sideMenu.scss \
	$(srcdir)/data/css/modules/layout/_topMenu.scss \
	$(srcdir)/data/css/modules/navigation/_searchBox.scss \
	$(srcdir)/data/css/modules/window/_app.scss \
	$(srcdir)/data/templates/css/_eos-modal.scss \
	$(srcdir)/data/templates/css/_eos-no-link.scss \
	$(NULL)
scss_targets = $(patsubst $(srcdir)/%.scss,$(builddir)/%.css,$(scss_toplevels))

# Rebuild the css files whenever a partial changes
$(scss_targets): $(scss_partials)

# scss build rule
.scss.css:
	$(scss_verbose) $(MKDIR_P) $(dir $@) && $(SCSS) --compass -E utf-8 --stop-on-error --sourcemap=none $< $@ || rm -f $@

EXTRA_DIST += $(scss_toplevels) $(scss_partials)
CLEANFILES += $(scss_targets)
clean-local::
	rm -rf .sass-cache

.yaml.json:
	$(AM_V_GEN)$(MKDIR_P) $(@D) && $(srcdir)/autobahn $< -o $@

yaml_presets = \
	data/compat/v1-preset-json/A.yaml \
	data/compat/v1-preset-json/B.yaml \
	data/compat/v1-preset-json/buffet.yaml \
	data/compat/v1-preset-json/encyclopedia.yaml \
	data/compat/v1-preset-json/news.yaml \
	$(NULL)
json_presets = $(yaml_presets:.yaml=.json)

resource_deps_verbose = $(resource_deps_verbose_@AM_V@)
resource_deps_verbose_ = $(resource_deps_verbose_@AM_DEFAULT_V@)
resource_deps_verbose_0 = @echo "  RESDEPS  $@";

resource_verbose = $(resource_verbose_@AM_V@)
resource_verbose_ = $(resource_verbose_@AM_DEFAULT_V@)
resource_verbose_0 = @echo "  RES      $@";

%.gresource.deps: %.gresource.xml
	$(resource_deps_verbose) $(MKDIR_P) $(dir $@) && \
	$(GLIB_COMPILE_RESOURCES) --generate-dependencies \
		--sourcedir=$(srcdir)/$(*D) --sourcedir=$(builddir)/$(*D) $< > $@.tmp && \
	DEPENDENCIES=$$(tr '\n' ' ' < $@.tmp) && rm $@.tmp && \
	echo "$*.gresource: $$DEPENDENCIES" > $@ && \
	echo "gresource_depedencies += $$DEPENDENCIES" >> $@

%.gresource: %.gresource.xml %.gresource.deps
	$(resource_verbose) $(MKDIR_P) $(dir $@) && \
	$(GLIB_COMPILE_RESOURCES) --target=$@ \
		--sourcedir=$(srcdir)/$(*D) --sourcedir=$(builddir)/$(*D) $<

gresources =
gresource_depedencies =
-include $(gresources:.gresource=.gresource.deps)
CLEANFILES += $(gresources:.gresource=.gresource.deps) $(gresources)
EXTRA_DIST += $(gresources:.gresource=.gresource.xml) $(gresource_depedencies)

# glib-compile-resources --generate-dependencies can't be run until all
# dependencies are present, so we need to build the scss first
eos-knowledge.gresource.deps: $(scss_targets) $(subst_files) $(json_presets)
pkgdata_DATA += eos-knowledge.gresource
gresources += eos-knowledge.gresource

# # # MAIN LIBRARY # # #

eosknowledgeprivate_headers = \
	lib/eosknowledgeprivate/eosknowledge.h \
	lib/eosknowledgeprivate/ekn-enums.h \
	lib/eosknowledgeprivate/ekn-macros.h \
	lib/eosknowledgeprivate/ekn-types.h \
	lib/eosknowledgeprivate/ekn-util.h \
	lib/eosknowledgeprivate/ekn-version.h \
	$(NULL)

eosknowledgeprivate_sources = \
	lib/eosknowledgeprivate/ekn-enums.c \
	lib/eosknowledgeprivate/ekn-init.c lib/eosknowledgeprivate/ekn-init-private.h \
	lib/eosknowledgeprivate/ekn-util.c \
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
        lib/eosknowledgesearchprivate/ekns-subtree-dispatcher.c \
        lib/eosknowledgesearchprivate/ekns-subtree-dispatcher.h

libeosknowledgesearchprivate_la_CPPFLAGS = @EOS_KNOWLEDGE_PRIVATE_CFLAGS@
libeosknowledgesearchprivate_la_CFLAGS = $(AM_CFLAGS)
libeosknowledgesearchprivate_la_LIBADD = @EOS_KNOWLEDGE_PRIVATE_LIBS@
libeosknowledgesearchprivate_la_LDFLAGS = -avoid-version

# # # WEBKIT EXTENSION LIBRARIES # # #

webextensiondir = $(pkglibdir)/web-extensions
webextension_LTLIBRARIES =

webextension_LTLIBRARIES += libgresourceplugin.la
libgresourceplugin_la_SOURCES = lib/web-extensions/gresourceplugin.c
libgresourceplugin_la_CFLAGS = $(GRESOURCE_PLUGIN_CFLAGS)
libgresourceplugin_la_CPPFLAGS = \
	-DPKGDATADIR=\""$(pkgdatadir)"\" \
	$(NULL)
libgresourceplugin_la_LIBADD = $(GRESOURCE_PLUGIN_LIBS)
libgresourceplugin_la_LDFLAGS = -module -avoid-version -no-undefined

# WebKit web extension for determining DOM element coordinates for tooltips
webextension_LTLIBRARIES += libtooltipplugin.la
libtooltipplugin_la_SOURCES = lib/web-extensions/tooltipplugin.c
libtooltipplugin_la_CFLAGS = $(TOOLTIP_PLUGIN_CFLAGS)
libtooltipplugin_la_CPPFLAGS = \
	-DPKGDATADIR=\""$(pkgdatadir)"\" \
	-DLOCALEDIR=\""$(datadir)/locale"\" \
	$(NULL)
libtooltipplugin_la_LIBADD = $(TOOLTIP_PLUGIN_LIBS)
libtooltipplugin_la_LDFLAGS = -module -avoid-version -no-undefined

webextension_LTLIBRARIES += libscrollplugin.la
libscrollplugin_la_SOURCES = lib/web-extensions/scrollplugin.c
libscrollplugin_la_CFLAGS = $(SCROLL_PLUGIN_CFLAGS)
libscrollplugin_la_CPPFLAGS = \
	-DPKGDATADIR=\""$(pkgdatadir)"\" \
	-DLOCALEDIR=\""$(datadir)/locale"\" \
	$(NULL)
libscrollplugin_la_LIBADD = $(SCROLL_PLUGIN_LIBS)
libscrollplugin_la_LDFLAGS = -module -avoid-version -no-undefined

# # # SUBSTITUTED FILES # # #
# These files need to be filled in with make variables

subst = $(SED) \
	-e 's,%bindir%,$(bindir),g' \
	-e 's,%compatdatadir%,$(compatdatadir),g' \
	-e 's,%datadir%,$(datadir),g' \
	-e 's,%pkgdatadir%,$(pkgdatadir),g' \
	-e 's,%pkglibdir%,$(pkglibdir),g' \
	-e 's,%typelibdir%,$(typelibdir),g' \
	-e 's,%webextensiondir%,$(webextensiondir),g' \
	$(NULL)

subst_files = \
	data/com.endlessm.EknDownloader.service \
	data/com.endlessm.EknSearchProvider.service \
	ekn-downloader \
	ekn-search-provider \
	ekn-app-runner \
	js/app/config.js \
	js/search/config.js \
	eminem \
	kermit \
	moltres \
	picard \
	$(NULL)

$(subst_files): %: %.in Makefile
	$(AM_V_GEN)$(MKDIR_P) $(@D) && \
	$(subst) $< > $@

CLEANFILES += $(subst_files)
EXTRA_DIST += $(patsubst %,%.in,$(subst_files))

servicedir = $(datadir)/dbus-1/services
service_DATA = \
	data/com.endlessm.EknSearchProvider.service \
	data/com.endlessm.EknDownloader.service \
	$(NULL)

bin_SCRIPTS += \
	ekn-downloader \
	ekn-search-provider \
	ekn-app-runner \
	autobahn \
	eminem \
	kermit \
	moltres \
	picard \
	$(NULL)

dist_pkgdata_DATA = data/downloader.ini

EXTRA_DIST += autobahn

# # # TESTS # # #

javascript_tests = \
	tests/js/app/interfaces/testArrangement.js \
	tests/js/app/interfaces/testCard.js \
	tests/js/app/interfaces/testModule.js \
	tests/js/app/interfaces/testOrder.js \
	tests/js/app/modules/arrangement/testGrid.js \
	tests/js/app/modules/arrangement/testHalf.js \
	tests/js/app/modules/arrangement/testList.js \
	tests/js/app/modules/arrangement/testOverflow.js \
	tests/js/app/modules/arrangement/testPiano.js \
	tests/js/app/modules/arrangement/testQuarter.js \
	tests/js/app/modules/arrangement/testQuilt.js \
	tests/js/app/modules/arrangement/testScrollingList.js \
	tests/js/app/modules/arrangement/testSideBySide.js \
	tests/js/app/modules/arrangement/testSquareGuys.js \
	tests/js/app/modules/arrangement/testThirdRock.js \
	tests/js/app/modules/arrangement/testThirties.js \
	tests/js/app/modules/arrangement/testTiledGrid.js \
	tests/js/app/modules/arrangement/testWindshield.js \
	tests/js/app/modules/banner/testApp.js \
	tests/js/app/modules/banner/testContext.js \
	tests/js/app/modules/banner/testSearch.js \
	tests/js/app/modules/banner/testSet.js \
	tests/js/app/modules/card/testDeck.js \
	tests/js/app/modules/card/testKnowledgeDocument.js \
	tests/js/app/modules/card/testLegacyPolaroid.js \
	tests/js/app/modules/card/testLegacyPost.js \
	tests/js/app/modules/card/testList.js \
	tests/js/app/modules/card/testMedia.js \
	tests/js/app/modules/card/testPost.js \
	tests/js/app/modules/card/testSequence.js \
	tests/js/app/modules/card/testSetPreview.js \
	tests/js/app/modules/card/testText.js \
	tests/js/app/modules/card/testThumb.js \
	tests/js/app/modules/card/testTitle.js \
	tests/js/app/modules/contentGroup/testContentGroup.js \
	tests/js/app/modules/contentGroup/testHierarchicalSet.js \
	tests/js/app/modules/contentGroup/testHighlights.js \
	tests/js/app/modules/contentGroup/testItem.js \
	tests/js/app/modules/contentGroup/testMediaLightbox.js \
	tests/js/app/modules/contentGroup/testSearch.js \
	tests/js/app/modules/contentGroup/testSet.js \
	tests/js/app/modules/contentGroup/testSuggestedCategories.js \
	tests/js/app/modules/contentGroup/testSupplementaryArticles.js \
	tests/js/app/modules/contentGroup/testThematic.js \
	tests/js/app/modules/controller/testBuffet.js \
	tests/js/app/modules/controller/testMesh.js \
	tests/js/app/modules/filter/testFeatured.js \
	tests/js/app/modules/filter/testSets.js \
	tests/js/app/modules/filter/testUnread.js \
	tests/js/app/modules/layout/testArticleStack.js \
	tests/js/app/modules/layout/testBox.js \
	tests/js/app/modules/layout/testDynamicBackground.js \
	tests/js/app/modules/layout/testHamburgerBasement.js \
	tests/js/app/modules/layout/testInfiniteScrolling.js \
	tests/js/app/modules/layout/testPaper.js \
	tests/js/app/modules/layout/testResponsiveMargins.js \
	tests/js/app/modules/layout/testScrolling.js \
	tests/js/app/modules/layout/testSearchAndItem.js \
	tests/js/app/modules/layout/testSidebar.js \
	tests/js/app/modules/layout/testSideMenu.js \
	tests/js/app/modules/layout/testTopMenu.js \
	tests/js/app/modules/navigation/testSearchBox.js \
	tests/js/app/modules/navigation/testTopMenu.js \
	tests/js/app/modules/order/testAlphabetical.js \
	tests/js/app/modules/order/testFeatured.js \
	tests/js/app/modules/order/testPublishedDate.js \
	tests/js/app/modules/pager/testParallaxBackground.js \
	tests/js/app/modules/pager/testSimple.js \
	tests/js/app/modules/selection/testSuggestedArticles.js \
	tests/js/app/modules/window/testApp.js \
	tests/js/app/modules/window/testEncyclopedia.js \
	tests/js/app/testArticleHTMLRenderer.js \
	tests/js/app/testDispatcher.js \
	tests/js/app/testDominantColor.js \
	tests/js/app/testHistoryItem.js \
	tests/js/app/testHistoryStore.js \
	tests/js/app/testKnowledge.js \
	tests/js/app/testModuleFactory.js \
	tests/js/app/testReadingHistoryModel.js \
	tests/js/app/testSetMap.js \
	tests/js/app/testToggleTweener.js \
	tests/js/app/testUtils.js \
	tests/js/app/testWebExtension.js \
	tests/js/app/testWidgetSurfaceCache.js \
	tests/js/app/widgets/testImageCoverFrame.js \
	tests/js/app/widgets/testLightbox.js \
	tests/js/app/widgets/testPDFView.js \
	tests/js/app/widgets/testPreviewer.js \
	tests/js/app/widgets/testSlidingPanel.js \
	tests/js/app/widgets/testSlidingPanelOverlay.js \
	tests/js/app/widgets/testSpaceContainer.js \
	tests/js/app/widgets/testTableOfContents.js \
	tests/js/search/testArticleObjectModel.js \
	tests/js/search/testAsyncTask.js \
	tests/js/search/testContentObjectModel.js \
	tests/js/search/testDatadir.js \
	tests/js/search/testDomain.js \
	tests/js/search/testEngine.js \
	tests/js/search/testMediaObjectModels.js \
	tests/js/search/testQueryObject.js \
	tests/js/search/testSetObjectModel.js \
	tests/js/search/testTreeNode.js \
	tests/js/search/testUtils.js \
	tests/js/search/testXapianBridge.js \
	$(NULL)
yaml_tests = \
	tests/autobahn/basic.yaml \
	tests/autobahn/fullApp.yaml \
	tests/autobahn/test-autobahn-catalog \
	$(NULL)
test_content = \
	tests/test-content/pig1.jpg \
	tests/test-content/pdf-sample1.pdf \
	$(NULL)
EXTRA_DIST += \
	$(javascript_tests) \
	$(yaml_tests) \
	$(patsubst %.yaml,%.json,$(yaml_tests)) \
	tests/autobahn/basic.pot \
	$(test_content) \
	tests/CssClassMatcher.js \
	tests/InstanceOfMatcher.js \
	tests/compliance.js \
	tests/minimal.js \
	tests/mockCardContainer.js \
	tests/mockDispatcher.js \
	tests/mockEngine.js \
	tests/mockFactory.js \
	tests/mockReadingHistoryModel.js \
	tests/mockShard.js \
	tests/mockWidgets.js \
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
TESTS = \
	$(javascript_tests) \
	$(yaml_tests) \
	run_coverage.coverage \
	$(NULL)
LOG_COMPILER = gtester
AM_LOG_FLAGS = -k --verbose

TEST_EXTENSIONS = .js .yaml .coverage

JS_LOG_DRIVER = env AM_TAP_AWK='$(AWK)' $(SHELL) $(top_srcdir)/tap-driver.sh
JS_LOG_DRIVER_FLAGS = --comments
JS_LOG_COMPILER = jasmine
AM_JS_LOG_FLAGS = --tap --no-config @JASMINE_REPORT_ARGUMENT@

YAML_LOG_COMPILER = $(top_srcdir)/tests/autobahn/testautobahn.sh

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
	export LC_ALL=C; \
	$(NULL)

EXTRA_DIST += \
	tests/autobahn/testautobahn.sh \
	jasmine.json \
	$(NULL)

# # # COVERAGE # # #

# Don't specify the resource:/// URIs here, because the tests load modules from
# the local directory, not from the GResource
EOS_JS_COVERAGE_FILES := $(shell find $(top_srcdir)/js -name '*.js' | $(SED) s,^$(top_srcdir)/,,)

@EOS_COVERAGE_RULES@

AM_JS_LOG_FLAGS += @EOS_JS_COVERAGE_LOG_FLAGS@
AM_LDFLAGS = @EOS_C_COVERAGE_LDFLAGS@

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

EosKnowledgePrivate-1.0.gir: libeosknowledgeprivate.la
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

clean-local:: clean-coverage
