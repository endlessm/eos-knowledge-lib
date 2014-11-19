## Copyright 2014 Endless Mobile, Inc.
## Included in toplevel Makefile.am

javascript_tests = \
	tests/eosknowledge/testArticleCard.js \
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
	tests/eosknowledge/testTableOfContents.js \
	tests/eosknowledge/testTextCard.js \
	tests/eosknowledge/testWindow.js \
	tests/eosknowledge/reader/testArticlePage.js \
	tests/eosknowledge/reader/testDonePage.js \
	tests/eosknowledge/reader/testPresenter.js \
	tests/eosknowledge/reader/testProgressLabel.js \
	tests/eosknowledge/reader/testWindow.js \
	tests/eosknowledgesearch/testArticleObjectModel.js \
	tests/eosknowledgesearch/testContentObjectModel.js \
	tests/eosknowledgesearch/testEngine.js \
	tests/eosknowledgesearch/testMediaObjectModels.js \
	tests/eosknowledgesearch/testTreeNode.js \
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
	tests/CssClassMatcher.js \
	tests/InstanceOfMatcher.js \
	tests/utils.js \
	tests/WidgetDescendantMatcher.js \
	$(NULL)

# Test gresource
gresource = tests/test-content/test-content.gresource
gresource_deps = $(shell $(GLIB_COMPILE_RESOURCES) --sourcedir=$(srcdir)/tests/test-content --generate-dependencies $(srcdir)/$(gresource).xml)
tests/test-content/test-content.gresource: $(gresource).xml $(gresource_deps)
	$(AM_V_GEN) $(MKDIR_P) $(builddir)/tests/test-content && \
	$(GLIB_COMPILE_RESOURCES) --target=$@ --sourcedir=$(srcdir)/tests/test-content  $<
EXTRA_DIST += \
	$(gresource_deps) \
	$(gresource).xml \
	$(NULL)
CLEANFILES += $(gresource)
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
	$(NULL)
