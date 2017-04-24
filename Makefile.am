## Process this file with automake to produce Makefile.in

# Copyright 2014 Endless Mobile, Inc.

## -----------
## Makefile.am
## -----------
## Please keep this file well-commented.

# Subdirectories where we also want to run make
SUBDIRS = @subdirs@ po .

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

# Make sure to build gtk-doc for ekncontent when doing 'make distcheck'
AM_DISTCHECK_CONFIGURE_FLAGS = \
	--enable-strict-flags \
	--enable-gtk-doc \
	$(NULL)
if EOS_ENABLE_COVERAGE
AM_DISTCHECK_CONFIGURE_FLAGS += --enable-coverage --with-coverage-dir=@EOS_COVERAGE_DIR@
endif EOS_ENABLE_COVERAGE

scss_verbose = $(scss_verbose_@AM_V@)
scss_verbose_ = $(scss_verbose_@AM_DEFAULT_V@)
scss_verbose_0 = @echo "  SCSS     $@";

scss_theme_toplevels = \
	$(srcdir)/data/css/blog.scss \
	$(srcdir)/data/css/buffet.scss \
	$(srcdir)/data/css/course.scss \
	$(srcdir)/data/css/default.scss \
	$(srcdir)/data/css/encyclopedia.scss \
	$(srcdir)/data/css/escola.scss \
	$(srcdir)/data/css/library_list.scss \
	$(srcdir)/data/css/news.scss \
	$(srcdir)/data/css/picard.scss \
	$(srcdir)/data/css/preset_a.scss \
	$(srcdir)/data/css/preset_b.scss \
	$(NULL)
scss_theme_base_partials = \
	$(srcdir)/data/css/_base.scss \
	$(srcdir)/data/css/_assets.scss \
	$(srcdir)/data/css/_colors.scss \
	$(srcdir)/data/css/_typography.scss \
	$(srcdir)/data/css/_mesh.scss \
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
	$(srcdir)/data/css/modules/card/_defaultFamily.scss \
	$(srcdir)/data/css/modules/card/_knowledgeDocument.scss \
	$(srcdir)/data/css/modules/card/_legacyPolaroid.scss \
	$(srcdir)/data/css/modules/card/_legacyPost.scss \
	$(srcdir)/data/css/modules/card/_list.scss \
	$(srcdir)/data/css/modules/card/_media.scss \
	$(srcdir)/data/css/modules/card/_sequence.scss \
	$(srcdir)/data/css/modules/card/_title.scss \
	$(srcdir)/data/css/modules/card/_video.scss \
	$(NULL)
scss_theme_content_partials = \
	$(srcdir)/data/css/modules/contentGroup/_contentGroup.scss \
	$(srcdir)/data/css/modules/contentGroup/_mediaLightbox.scss \
	$(srcdir)/data/css/modules/contentGroup/_noResultsMessage.scss \
	$(NULL)
scss_theme_document_partials = \
	$(srcdir)/data/css/modules/documentCard/_base.scss \
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
	$(NULL)
scss_theme_pager_partials = \
	$(srcdir)/data/css/modules/pager/_parallaxBackground.scss \
	$(srcdir)/data/css/modules/pager/_simple.scss \
	$(NULL)
scss_theme_window_partials = \
	$(srcdir)/data/css/modules/window/_simple.scss \
	$(NULL)

scss_theme_widgets_partials = \
	$(srcdir)/data/css/widgets/_eknMediaBin.scss \
	$(NULL)

scss_theme_partials = \
	$(scss_theme_base_partials) \
	$(scss_theme_arrangement_partials) \
	$(scss_theme_banner_partials) \
	$(scss_theme_card_partials) \
	$(scss_theme_content_partials) \
	$(scss_theme_document_partials) \
	$(scss_theme_layout_partials) \
	$(scss_theme_navigation_partials) \
	$(scss_theme_pager_partials) \
	$(scss_theme_window_partials) \
	$(scss_theme_widgets_partials) \
	$(NULL)

scss_template_toplevels = \
	$(srcdir)/data/templates/css/prensa-libre.scss \
	$(srcdir)/data/templates/css/buffet-custom.scss \
	$(srcdir)/data/templates/css/wikihow.scss \
	$(srcdir)/data/templates/css/wikimedia.scss \
	$(srcdir)/data/templates/css/clipboard.scss \
	$(NULL)

scss_template_partials = \
	$(srcdir)/data/templates/css/_eos-modal.scss \
	$(srcdir)/data/templates/css/_eos-no-link.scss \
	$(NULL)

scss_toplevels = $(scss_theme_toplevels) $(scss_template_toplevels)
scss_partials = $(scss_theme_partials) $(scss_template_partials)

scss_targets = $(patsubst $(srcdir)/%.scss,$(builddir)/%.css,$(scss_toplevels))

# Rebuild the css files whenever a partial changes
$(scss_targets): $(scss_partials)

# scss build rule
.scss.css:
	$(scss_verbose) $(MKDIR_P) $(dir $@) && $(SCSS) -a $< $@ || rm -f $@

EXTRA_DIST += $(scss_template_toplevels) $(scss_template_partials)
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
	js/app/config.js \
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

CLEANFILES += $(subst_files) $(uninstalled_subst_files)
EXTRA_DIST += $(patsubst %,%.in,$(subst_files))

bin_SCRIPTS += \
	ekn-app-runner \
	tools/autobahn \
	tools/eminem \
	tools/introspect \
	tools/kermit \
	tools/picard \
	$(NULL)

dist_pkgdata_DATA = data/downloader.ini

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

themedocumentdir = $(thememodulesdir)/documentCard
dist_themedocument_DATA = $(scss_theme_document_partials)

themelayoutdir = $(thememodulesdir)/layout
dist_themelayout_DATA = $(scss_theme_layout_partials)

themenavigationdir = $(thememodulesdir)/navigation
dist_themenavigation_DATA = $(scss_theme_navigation_partials)

themepagerdir = $(thememodulesdir)/pager
dist_themepager_DATA = $(scss_theme_pager_partials)

themewindowdir = $(thememodulesdir)/window
dist_themewindow_DATA = $(scss_theme_window_partials)

themewidgetsdir = $(themetopdir)/widgets
dist_themewidgets_DATA = $(scss_theme_widgets_partials)

# so we can package our .yaml files
yamlpresetdir = $(pkgdatadir)/preset
dist_yamlpreset_DATA = \
	data/preset/A.yaml \
	data/preset/B.yaml \
	data/preset/blog.yaml \
	data/preset/buffet.yaml \
	data/preset/course.yaml \
	data/preset/encyclopedia.yaml \
	data/preset/escola.yaml \
	data/preset/library-list.yaml \
	data/preset/news.yaml \
	$(NULL)

EXTRA_DIST += \
	tools/autobahn \
	data/eos-knowledge-0.pc.in

# # # DOCUMENTATION # # #

EXTRA_DIST += \
	docs/api/domain.md \
	docs/api/flatpak-bundle.md \
	docs/api/hotdoc.json \
	docs/api/index.md \
	docs/api/sitemap.txt \
	docs/framework/hotdoc.json \
	docs/framework/index.md \
	docs/framework/sitemap.txt \
	docs/framework/tools.md \
	$(NULL)

HOTDOC_PROJECTS = docs/framework

docs_framework_HOTDOC_EXTRA_DEPS = \
	tools/introspect-local \
	EosKnowledgePrivate-1.0.typelib \
	eos-knowledge.gresource \
	$(NULL)
docs_framework_HOTDOC_FLAGS = \
	--conf-file $(abs_srcdir)/docs/framework/hotdoc.json \
	-o $(abs_builddir)/docs/framework/built \
	--mf-introspect-utility $(abs_builddir)/tools/introspect-local \
	$(FRAMEWORK_EXTRA_HOTDOC_FLAGS) \
	$(NULL)

if ENABLE_DOCUMENTATION
-include $(HOTDOC_MAKEFILE)
endif ENABLE_DOCUMENTATION

# # # TESTS # # #

javascript_tests = \
	tests/js/app/interfaces/testArrangement.js \
	tests/js/app/interfaces/testCard.js \
	tests/js/app/interfaces/testFilter.js \
	tests/js/app/interfaces/testModule.js \
	tests/js/app/interfaces/testOrder.js \
	tests/js/app/modules/arrangement/testAccordion.js \
	tests/js/app/modules/arrangement/testConstrained.js \
	tests/js/app/modules/arrangement/testGrid.js \
	tests/js/app/modules/arrangement/testHalf.js \
	tests/js/app/modules/arrangement/testList.js \
	tests/js/app/modules/arrangement/testOverflow.js \
	tests/js/app/modules/arrangement/testPiano.js \
	tests/js/app/modules/arrangement/testQuarter.js \
	tests/js/app/modules/arrangement/testQuilt.js \
	tests/js/app/modules/arrangement/testSideBySide.js \
	tests/js/app/modules/arrangement/testSquareGuys.js \
	tests/js/app/modules/arrangement/testThirdRock.js \
	tests/js/app/modules/arrangement/testThirties.js \
	tests/js/app/modules/arrangement/testTiledGrid.js \
	tests/js/app/modules/arrangement/testWindshield.js \
	tests/js/app/modules/banner/testApp.js \
	tests/js/app/modules/banner/testContext.js \
	tests/js/app/modules/banner/testDynamic.js \
	tests/js/app/modules/banner/testSearch.js \
	tests/js/app/modules/banner/testSet.js \
	tests/js/app/modules/card/testAudio.js \
	tests/js/app/modules/card/testDeck.js \
	tests/js/app/modules/card/testDefaultFamily.js \
	tests/js/app/modules/card/testKnowledgeDocument.js \
	tests/js/app/modules/card/testLegacyPolaroid.js \
	tests/js/app/modules/card/testLegacyPost.js \
	tests/js/app/modules/card/testList.js \
	tests/js/app/modules/card/testMedia.js \
	tests/js/app/modules/card/testSequence.js \
	tests/js/app/modules/card/testTitle.js \
	tests/js/app/modules/card/testVideo.js \
	tests/js/app/modules/contentGroup/testContentGroup.js \
	tests/js/app/modules/contentGroup/testMediaLightbox.js \
	tests/js/app/modules/controller/testBuffet.js \
	tests/js/app/modules/controller/testCourse.js \
	tests/js/app/modules/controller/testMesh.js \
	tests/js/app/modules/filter/testCurrentSet.js \
	tests/js/app/modules/filter/testFeatured.js \
	tests/js/app/modules/filter/testSeeMore.js \
	tests/js/app/modules/filter/testSets.js \
	tests/js/app/modules/filter/testUnread.js \
	tests/js/app/modules/layout/testArticleStack.js \
	tests/js/app/modules/layout/testBox.js \
	tests/js/app/modules/layout/testBrandPage.js \
	tests/js/app/modules/layout/testDynamicBackground.js \
	tests/js/app/modules/layout/testHamburgerBasement.js \
	tests/js/app/modules/layout/testInfiniteScrolling.js \
	tests/js/app/modules/layout/testNavigation.js \
	tests/js/app/modules/layout/testOverlay.js \
	tests/js/app/modules/layout/testResponsiveMargins.js \
	tests/js/app/modules/layout/testScrolling.js \
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
	tests/js/app/modules/selection/testAllHighlights.js \
	tests/js/app/modules/selection/testAllSets.js \
	tests/js/app/modules/selection/testArticleContext.js \
	tests/js/app/modules/selection/testArticlesForSet.js \
	tests/js/app/modules/selection/testArticlesForSetCrossSection.js \
	tests/js/app/modules/selection/testContentForSet.js \
	tests/js/app/modules/selection/testRelatedArticles.js \
	tests/js/app/modules/selection/testSearch.js \
	tests/js/app/modules/selection/testSuggestedArticles.js \
	tests/js/app/modules/selection/testSupplementaryArticles.js \
	tests/js/app/modules/selection/testStaticArticles.js \
	tests/js/app/modules/window/testSimple.js \
	tests/js/app/testArticleHTMLRenderer.js \
	tests/js/app/testBuffetHistoryStore.js \
	tests/js/app/testCourseHistoryStore.js \
	tests/js/app/testDispatcher.js \
	tests/js/app/testDominantColor.js \
	tests/js/app/testHistoryItem.js \
	tests/js/app/testHistoryStore.js \
	tests/js/app/testKnowledge.js \
	tests/js/app/testMeshHistoryStore.js \
	tests/js/app/testModuleFactory.js \
	tests/js/app/testReadingHistoryModel.js \
	tests/js/app/testSetMap.js \
	tests/js/app/testToggleTweener.js \
	tests/js/app/testUtils.js \
	tests/js/app/testWebExtension.js \
	tests/js/app/testWidgetSurfaceCache.js \
	tests/js/app/widgets/testDynamicLogo.js \
	tests/js/app/widgets/testFormattableLabel.js \
	tests/js/app/widgets/testImageCoverFrame.js \
	tests/js/app/widgets/testLightbox.js \
	tests/js/app/widgets/testPDFView.js \
	tests/js/app/widgets/testPreviewer.js \
	tests/js/app/widgets/testSlidingPanel.js \
	tests/js/app/widgets/testSlidingPanelOverlay.js \
	tests/js/app/widgets/testSpaceContainer.js \
	tests/js/app/widgets/testTableOfContents.js \
	$(NULL)
yaml_tests = \
	tests/autobahn/basic.yaml \
	tests/autobahn/fullApp.yaml \
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
TESTS_ENVIRONMENT = \
	export GJS_PATH="$(top_srcdir):$(top_srcdir)/js:$(top_builddir)/js:$(top_srcdir)/ekncontent:$(top_builddir)/ekncontent"; \
	export GI_TYPELIB_PATH="$(top_builddir):$(top_builddir)/ekncontent$${GI_TYPELIB_PATH:+:$$GI_TYPELIB_PATH}"; \
	export LD_LIBRARY_PATH="$(top_builddir)/.libs:$(top_builddir)/ekncontent/.libs$${LD_LIBRARY_PATH:+:$$LD_LIBRARY_PATH}"; \
	export GIO_EXTRA_MODULES="$(top_builddir)/ekncontent/.libs"; \
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
