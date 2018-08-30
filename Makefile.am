## Process this file with automake to produce Makefile.in

# Copyright 2014 Endless Mobile, Inc.

## -----------
## Makefile.am
## -----------
## Please keep this file well-commented.

# Subdirectories where we also want to run make
SUBDIRS = po . docs

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

AM_DISTCHECK_CONFIGURE_FLAGS = \
	--enable-strict-flags \
	$(NULL)
if EOS_ENABLE_COVERAGE
AM_DISTCHECK_CONFIGURE_FLAGS += --enable-coverage --with-coverage-dir=@EOS_COVERAGE_DIR@
endif EOS_ENABLE_COVERAGE

scss_verbose = $(scss_verbose_@AM_V@)
scss_verbose_ = $(scss_verbose_@AM_DEFAULT_V@)
scss_verbose_0 = @echo "  SCSS     $@";

scss_theme_toplevels = \
	$(srcdir)/data/css/blog.scss \
	$(srcdir)/data/css/course.scss \
	$(srcdir)/data/css/default.scss \
	$(srcdir)/data/css/encyclopedia.scss \
	$(srcdir)/data/css/exploration.scss \
	$(srcdir)/data/css/gallery.scss \
	$(srcdir)/data/css/library.scss \
	$(srcdir)/data/css/library_list.scss \
	$(srcdir)/data/css/news.scss \
	$(srcdir)/data/css/picard.scss \
	$(srcdir)/data/css/thematic.scss \
	$(srcdir)/data/css/video_list.scss \
	$(NULL)
scss_theme_base_partials = \
	$(srcdir)/data/css/_base.scss \
	$(srcdir)/data/css/_assets.scss \
	$(srcdir)/data/css/_colors.scss \
	$(srcdir)/data/css/_typography.scss \
	$(NULL)
scss_theme_arrangement_partials = \
	$(srcdir)/data/css/modules/arrangement/_constrained.scss \
	$(srcdir)/data/css/modules/arrangement/_half.scss \
	$(srcdir)/data/css/modules/arrangement/_list.scss \
	$(srcdir)/data/css/modules/arrangement/_piano.scss \
	$(srcdir)/data/css/modules/arrangement/_sideBySide.scss \
	$(srcdir)/data/css/modules/arrangement/_squareGuys.scss \
	$(srcdir)/data/css/modules/arrangement/_thirties.scss \
	$(srcdir)/data/css/modules/arrangement/_windshield.scss \
	$(NULL)
scss_theme_banner_partials = \
	$(srcdir)/data/css/modules/banner/_app.scss \
	$(srcdir)/data/css/modules/banner/_dynamic.scss \
	$(srcdir)/data/css/modules/banner/_context.scss \
	$(srcdir)/data/css/modules/banner/_search.scss \
	$(srcdir)/data/css/modules/banner/_set.scss \
	$(NULL)
scss_theme_card_partials = \
	$(srcdir)/data/css/modules/card/_base.scss \
	$(srcdir)/data/css/modules/card/_deck.scss \
	$(srcdir)/data/css/modules/card/_default.scss \
	$(srcdir)/data/css/modules/card/_list.scss \
	$(srcdir)/data/css/modules/card/_sequence.scss \
	$(NULL)
scss_theme_content_partials = \
	$(srcdir)/data/css/modules/contentGroup/_contentGroup.scss \
	$(srcdir)/data/css/modules/contentGroup/_mediaLightbox.scss \
	$(srcdir)/data/css/modules/contentGroup/_noResultsMessage.scss \
	$(NULL)
scss_theme_layout_partials = \
	$(srcdir)/data/css/modules/layout/_dynamicBackground.scss \
	$(srcdir)/data/css/modules/layout/_hamburgerBasement.scss \
	$(srcdir)/data/css/modules/layout/_infiniteScrolling.scss \
	$(srcdir)/data/css/modules/layout/_navigation.scss \
	$(srcdir)/data/css/modules/layout/_placeholder.scss \
	$(srcdir)/data/css/modules/layout/_responsiveMargins.scss \
	$(srcdir)/data/css/modules/layout/_scrolling.scss \
	$(srcdir)/data/css/modules/layout/_sidebar.scss \
	$(srcdir)/data/css/modules/layout/_sideMenu.scss \
	$(srcdir)/data/css/modules/layout/_topMenu.scss \
	$(NULL)
scss_theme_navigation_partials = \
	$(srcdir)/data/css/modules/navigation/_searchBox.scss \
	$(srcdir)/data/css/modules/navigation/_topMenu.scss \
	$(NULL)
scss_theme_pager_partials = \
	$(srcdir)/data/css/modules/pager/_parallaxBackground.scss \
	$(srcdir)/data/css/modules/pager/_simple.scss \
	$(NULL)
scss_theme_view_partials = \
	$(srcdir)/data/css/modules/view/_audio.scss \
	$(srcdir)/data/css/modules/view/_document.scss \
	$(srcdir)/data/css/modules/view/_media.scss \
	$(srcdir)/data/css/modules/view/_video.scss \
	$(NULL)
scss_theme_window_partials = \
	$(srcdir)/data/css/modules/window/_simple.scss \
	$(NULL)

scss_theme_widgets_partials = \
	$(srcdir)/data/css/widgets/_eknMediaBin.scss \
	$(srcdir)/data/css/widgets/_pDFView.scss \
	$(srcdir)/data/css/widgets/_shareActionBox.scss \
	$(NULL)

scss_theme_partials = \
	$(scss_theme_base_partials) \
	$(scss_theme_arrangement_partials) \
	$(scss_theme_banner_partials) \
	$(scss_theme_card_partials) \
	$(scss_theme_content_partials) \
	$(scss_theme_layout_partials) \
	$(scss_theme_navigation_partials) \
	$(scss_theme_pager_partials) \
	$(scss_theme_view_partials) \
	$(scss_theme_window_partials) \
	$(scss_theme_widgets_partials) \
	$(NULL)

scss_toplevels = $(scss_theme_toplevels)

scss_targets = $(patsubst $(srcdir)/%.scss,$(builddir)/%.css,$(scss_toplevels))

# scss build rule
.scss.css:
	$(scss_verbose)$(MKDIR_P) $(@D) && $(SCSS) -a $< $@

data/preset/po/presets.pot: $(dist_yamlpreset_DATA)
	$(top_srcdir)/scripts/genpotfile -d $(@D) $^

EXTRA_DIST += $(scss_template_toplevels)
CLEANFILES += $(scss_targets)
clean-local::
	rm -rf .sass-cache

# # # GRESOURCES # # #
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
	echo "gresource_dependencies += $$DEPENDENCIES" >> $@

%.gresource: %.gresource.xml %.gresource.deps
	$(resource_verbose) $(MKDIR_P) $(dir $@) && \
	$(GLIB_COMPILE_RESOURCES) --target=$@ \
		--sourcedir=$(srcdir)/$(*D) --sourcedir=$(builddir)/$(*D) $<

%.c: %.gresource.xml
	$(resource_verbose) $(MKDIR_P) $(dir $@) && \
	$(GLIB_COMPILE_RESOURCES) --target=$@ --generate-source \
		--sourcedir=$(srcdir)/$(*D) --sourcedir=$(builddir)/$(*D) $<

gresources =
gresource_dependencies =
-include $(gresources:.gresource=.gresource.deps)
CLEANFILES += $(gresources:.gresource=.gresource.deps) $(gresources)
EXTRA_DIST += $(gresources:.gresource=.gresource.xml) $(gresource_dependencies)

# glib-compile-resources --generate-dependencies can't be run until all
# dependencies are present, so we need to build the scss first
eos-knowledge.gresource.deps: $(scss_targets) $(subst_files)
gresources += eos-knowledge.gresource

pkgdata_DATA += $(gresources)

# # # MAIN LIBRARY # # #
BUILT_SOURCES = \
	lib/eosknowledgeprivate/ekn-resources.c \
	$(NULL)

private_resource_deps := $(shell $(GLIB_COMPILE_RESOURCES) --generate-dependencies --sourcedir=$(srcdir)/lib/eosknowledgeprivate/ $(srcdir)/lib/eosknowledgeprivate/ekn-resources.gresource.xml)

lib/eosknowledgeprivate/ekn-resources.c: $(private_resource_deps)

CLEANFILES += $(BUILT_SOURCES)

EXTRA_DIST += \
	lib/eosknowledgeprivate/ekn-resources.gresource.xml \
	$(private_resource_deps) \
	$(NULL)

eosknowledgeprivate_headers = \
	lib/eosknowledgeprivate/ekn-util.h \
	$(NULL)

eosknowledgeprivate_sources = \
	lib/eosknowledgeprivate/ekn-init.c lib/eosknowledgeprivate/ekn-init-private.h \
	lib/eosknowledgeprivate/ekn-util.c \
	lib/eosknowledgeprivate/ekn-resources.c \
	lib/eosknowledgeprivate/ekn-runtime-document-viewer.h \
	lib/eosknowledgeprivate/ekn-runtime-document-viewer.c \
	lib/eosknowledgeprivate/ekn-media-bin.h \
	lib/eosknowledgeprivate/ekn-media-bin.c \
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

# # # EXAMPLES # # #

noinst_PROGRAMS = eos-player

eos_player_SOURCES = examples/eos-player.c
eos_player_CPPFLAGS = \
	$(EOS_KNOWLEDGE_PRIVATE_CFLAGS) \
	-I$(top_srcdir)/lib/eosknowledgeprivate/ \
	$(NULL)
eos_player_LDADD = \
	$(EOS_KNOWLEDGE_PRIVATE_LIBS) \
	$(top_builddir)/libeosknowledgeprivate.la \
	$(NULL)

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
	-e 's,%yamlpresetdir%,$(yamlpresetdir),g' \
	-e 's,%themetopdir%,$(themetopdir),g' \
	$(NULL)

subst_files = \
	ekn-app-runner \
	js/framework/config.js \
	tools/eminem \
	tools/introspect \
	tools/kermit \
	tools/picard \
	$(NULL)

$(subst_files): %: %.in Makefile
	$(AM_V_GEN)$(MKDIR_P) $(@D) && \
	$(subst) $< > $@

uninstalled_subst = $(SED) \
	-e 's,%pkgdatadir%,$(abs_top_builddir),g' \
	-e 's,%pkglibdir%,$(abs_top_builddir)/.libs,g' \
	-e 's,%typelibdir%,$(abs_top_builddir),g' \
	$(NULL)

uninstalled_subst_files = \
	tools/introspect-local \
	$(NULL)

$(uninstalled_subst_files): %-local: %.in Makefile
	$(AM_V_GEN)$(MKDIR_P) $(@D) && \
	$(uninstalled_subst) $< > $@.tmp && \
	chmod +x $@.tmp && \
	mv $@.tmp $@

noinst_SCRIPTS = tools/introspect-local

CLEANFILES += $(subst_files) $(uninstalled_subst_files)
EXTRA_DIST += $(patsubst %,%.in,$(subst_files))

bin_SCRIPTS += \
	ekn-app-runner \
	tools/autobahn \
	tools/eminem \
	tools/introspect \
	tools/kermit \
	tools/picard \
	tools/shard_doctor \
	tools/shard_stats \
	$(NULL)

# so clients can find our paths
pkgconfigdir = $(libdir)/pkgconfig
pkgconfig_DATA = data/eos-knowledge-0.pc

# so we can package our .scss files
themetopdir = $(pkgdatadir)/theme
dist_themetop_DATA = $(scss_theme_toplevels) $(scss_theme_base_partials)

thememodulesdir = $(themetopdir)/modules

themearrangementdir = $(thememodulesdir)/arrangement
dist_themearrangement_DATA = $(scss_theme_arrangement_partials)

themebannerdir = $(thememodulesdir)/banner
dist_themebanner_DATA = $(scss_theme_banner_partials)

themecarddir = $(thememodulesdir)/card
dist_themecard_DATA = $(scss_theme_card_partials)

themecontentdir = $(thememodulesdir)/contentGroup
dist_themecontent_DATA = $(scss_theme_content_partials)

themelayoutdir = $(thememodulesdir)/layout
dist_themelayout_DATA = $(scss_theme_layout_partials)

themenavigationdir = $(thememodulesdir)/navigation
dist_themenavigation_DATA = $(scss_theme_navigation_partials)

themepagerdir = $(thememodulesdir)/pager
dist_themepager_DATA = $(scss_theme_pager_partials)

themeviewdir = $(thememodulesdir)/view
dist_themeview_DATA = $(scss_theme_view_partials)

themewindowdir = $(thememodulesdir)/window
dist_themewindow_DATA = $(scss_theme_window_partials)

themewidgetsdir = $(themetopdir)/widgets
dist_themewidgets_DATA = $(scss_theme_widgets_partials)

# so we can package our .yaml files
yamlpresetdir = $(pkgdatadir)/preset
dist_yamlpreset_DATA = \
	data/preset/blog.yaml \
	data/preset/course.yaml \
	data/preset/encyclopedia.yaml \
	data/preset/exploration.yaml \
	data/preset/gallery.yaml \
	data/preset/library.yaml \
	data/preset/library-list.yaml \
	data/preset/news.yaml \
	data/preset/thematic.yaml \
	data/preset/video_list.yaml \
	$(NULL)

EXTRA_DIST += \
	tools/autobahn \
	data/eos-knowledge-0.pc.in

# # # TESTS # # #

javascript_tests = \
	tests/js/framework/interfaces/testArrangement.js \
	tests/js/framework/interfaces/testCard.js \
	tests/js/framework/interfaces/testFilter.js \
	tests/js/framework/interfaces/testModule.js \
	tests/js/framework/interfaces/testOrder.js \
	tests/js/framework/interfaces/testScrolling.js \
	tests/js/framework/modules/arrangement/testAccordion.js \
	tests/js/framework/modules/arrangement/testConstrained.js \
	tests/js/framework/modules/arrangement/testGrid.js \
	tests/js/framework/modules/arrangement/testHalf.js \
	tests/js/framework/modules/arrangement/testList.js \
	tests/js/framework/modules/arrangement/testOverflow.js \
	tests/js/framework/modules/arrangement/testPiano.js \
	tests/js/framework/modules/arrangement/testQuarter.js \
	tests/js/framework/modules/arrangement/testQuilt.js \
	tests/js/framework/modules/arrangement/testSideBySide.js \
	tests/js/framework/modules/arrangement/testSquareGuys.js \
	tests/js/framework/modules/arrangement/testThirdRock.js \
	tests/js/framework/modules/arrangement/testThirties.js \
	tests/js/framework/modules/arrangement/testTiledGrid.js \
	tests/js/framework/modules/arrangement/testWindshield.js \
	tests/js/framework/modules/banner/testApp.js \
	tests/js/framework/modules/banner/testContext.js \
	tests/js/framework/modules/banner/testDynamic.js \
	tests/js/framework/modules/banner/testSearch.js \
	tests/js/framework/modules/banner/testSet.js \
	tests/js/framework/modules/card/testDeck.js \
	tests/js/framework/modules/card/testDefault.js \
	tests/js/framework/modules/card/testList.js \
	tests/js/framework/modules/card/testSequence.js \
	tests/js/framework/modules/card/testTitle.js \
	tests/js/framework/modules/contentGroup/testContentGroup.js \
	tests/js/framework/modules/contentGroup/testMediaLightbox.js \
	tests/js/framework/modules/controller/testCourse.js \
	tests/js/framework/modules/controller/testMesh.js \
	tests/js/framework/modules/filter/testArticles.js \
	tests/js/framework/modules/filter/testContentType.js \
	tests/js/framework/modules/filter/testCurrentSet.js \
	tests/js/framework/modules/filter/testFeatured.js \
	tests/js/framework/modules/filter/testOtherGroup.js \
	tests/js/framework/modules/filter/testSets.js \
	tests/js/framework/modules/filter/testTagged.js \
	tests/js/framework/modules/filter/testUnread.js \
	tests/js/framework/modules/layout/testArticleStack.js \
	tests/js/framework/modules/layout/testBox.js \
	tests/js/framework/modules/layout/testBrandPage.js \
	tests/js/framework/modules/layout/testDynamicBackground.js \
	tests/js/framework/modules/layout/testHamburgerBasement.js \
	tests/js/framework/modules/layout/testInfiniteScrolling.js \
	tests/js/framework/modules/layout/testNavigation.js \
	tests/js/framework/modules/layout/testOverlay.js \
	tests/js/framework/modules/layout/testResponsiveMargins.js \
	tests/js/framework/modules/layout/testScrolling.js \
	tests/js/framework/modules/layout/testSidebar.js \
	tests/js/framework/modules/layout/testSideMenu.js \
	tests/js/framework/modules/layout/testTopMenu.js \
	tests/js/framework/modules/navigation/testSearchBox.js \
	tests/js/framework/modules/navigation/testTopMenu.js \
	tests/js/framework/modules/order/testAlphabetical.js \
	tests/js/framework/modules/order/testPublishedDate.js \
	tests/js/framework/modules/order/testSequence.js \
	tests/js/framework/modules/pager/testParallaxBackground.js \
	tests/js/framework/modules/pager/testSimple.js \
	tests/js/framework/modules/selection/testAll.js \
	tests/js/framework/modules/selection/testAllSets.js \
	tests/js/framework/modules/selection/testArticleContext.js \
	tests/js/framework/modules/selection/testContentForSet.js \
	tests/js/framework/modules/selection/testFeaturedFirst.js \
	tests/js/framework/modules/selection/testNext.js \
	tests/js/framework/modules/selection/testRelated.js \
	tests/js/framework/modules/selection/testSearch.js \
	tests/js/framework/modules/selection/testSetCrossSection.js \
	tests/js/framework/modules/selection/testSuggested.js \
	tests/js/framework/modules/selection/testSupplementary.js \
	tests/js/framework/modules/selection/testXapian.js \
	tests/js/framework/modules/view/testAudio.js \
	tests/js/framework/modules/view/testDocument.js \
	tests/js/framework/modules/view/testMedia.js \
	tests/js/framework/modules/view/testVideo.js \
	tests/js/framework/modules/window/testSimple.js \
	tests/js/framework/testArticleHTMLRenderer.js \
	tests/js/framework/testCourseHistoryStore.js \
	tests/js/framework/testDispatcher.js \
	tests/js/framework/testDominantColor.js \
	tests/js/framework/testHistoryItem.js \
	tests/js/framework/testHistoryStore.js \
	tests/js/framework/testKnowledge.js \
	tests/js/framework/testMeshHistoryStore.js \
	tests/js/framework/testModuleFactory.js \
	tests/js/framework/testReadingHistoryModel.js \
	tests/js/framework/testSetMap.js \
	tests/js/framework/testToggleTweener.js \
	tests/js/framework/testUtils.js \
	tests/js/framework/testWebExtension.js \
	tests/js/framework/widgets/testDynamicLogo.js \
	tests/js/framework/widgets/testFormattableLabel.js \
	tests/js/framework/widgets/testLightbox.js \
	tests/js/framework/widgets/testPDFView.js \
	tests/js/framework/widgets/testPreviewer.js \
	tests/js/framework/widgets/testSearchBox.js \
	tests/js/framework/widgets/testSlidingPanel.js \
	tests/js/framework/widgets/testSlidingPanelOverlay.js \
	tests/js/framework/widgets/testSpaceContainer.js \
	tests/js/framework/widgets/testTableOfContents.js \
	$(NULL)
yaml_tests = \
	tests/autobahn/basic.yaml \
	tests/autobahn/fullApp.yaml \
	tests/autobahn/overrides.yaml \
	tests/autobahn/variables.yaml \
	tests/autobahn/test-autobahn-catalog \
	tests/autobahn/test-autobahn-translation \
	$(NULL)
test_content = \
	tests/test-content/backgroundHome \
	tests/test-content/pdf-sample1.pdf \
	tests/test-content/titleImage \
	$(NULL)
EXTRA_DIST += \
	$(javascript_tests) \
	$(yaml_tests) \
	$(patsubst %.yaml,%.json,$(yaml_tests)) \
	tests/autobahn/basic.pot \
	tests/autobahn/basic.po \
	tests/autobahn/basic-translated.json \
	$(test_content) \
	tests/CssClassMatcher.js \
	tests/InstanceOfMatcher.js \
	tests/compliance.js \
	tests/minimal.js \
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
# FIXME: Re-enable JIT when moving to GNOME 3.26 or patching mozjs38 (see
# https://phabricator.endlessm.com/T18981)
# FIXME: LD_PRELOAD=libGL.so is needed for test to work properly under xvfb-run-session
TESTS_ENVIRONMENT = \
	export NO_AT_BRIDGE=1; \
	export GJS_DISABLE_JIT=1; \
	export GJS_PATH="$(top_srcdir):$(top_srcdir)/js:$(top_builddir)/js"; \
	export GI_TYPELIB_PATH="$(top_builddir)$${GI_TYPELIB_PATH:+:$$GI_TYPELIB_PATH}"; \
	export LD_PRELOAD=libGL.so \
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

typelibdir = $(pkglibdir)/girepository-1.0
typelib_DATA = $(INTROSPECTION_GIRS:.gir=.typelib)

CLEANFILES += $(INTROSPECTION_GIRS) $(typelib_DATA)

clean-local:: clean-coverage
