## Copyright 2014 Endless Mobile, Inc.
## Included in toplevel Makefile.am

javascript_tests = \
	tests/eosknowledge/testArticleCard.js \
	tests/eosknowledge/testArticleObjectModel.js \
	tests/eosknowledge/testArticlePageA.js \
	tests/eosknowledge/testArticlePresenter.js \
	tests/eosknowledge/testCard.js \
	tests/eosknowledge/testContentObjectModel.js \
	tests/eosknowledge/testEngine.js \
	tests/eosknowledge/testHello.js \
	tests/eosknowledge/testHistoryItemModel.js \
	tests/eosknowledge/testHistoryModel.js \
	tests/eosknowledge/testHomePageA.js \
	tests/eosknowledge/testLessonCard.js \
	tests/eosknowledge/testLightbox.js \
	tests/eosknowledge/testListCard.js \
	tests/eosknowledge/testPresenter.js \
	tests/eosknowledge/testProgressCard.js \
	tests/eosknowledge/testSectionPageA.js \
	tests/eosknowledge/testSectionArticlePageA.js \
	tests/eosknowledge/testTableOfContents.js \
	tests/eosknowledge/testTreeNode.js \
	tests/eosknowledge/testWebviewSwitcher.js \
	tests/eosknowledge/testWindowA.js \
	$(NULL)
test_content = \
	tests/test-content/article-search-results.jsonld \
	tests/test-content/content-search-results.jsonld \
	tests/test-content/cyprus.jsonld \
	tests/test-content/emacs.jsonld \
	tests/test-content/got_app.json \
	tests/test-content/greyjoy-article.jsonld \
	$(NULL)
EXTRA_DIST += \
	$(javascript_tests) \
	$(test_content) \
	tests/CssClassMatcher.js \
	tests/InstanceOfMatcher.js \
	tests/utils.js \
	$(NULL)

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
# to the EosKnowledge module, and lastly the tests directory is added for
# utility modules local to the tests.
# (May need to change to AM_TESTS_ENVIRONMENT in a later version of Automake)
TESTS_ENVIRONMENT = \
	export GJS_PATH="$(top_builddir):$(top_srcdir):$(top_srcdir)/overrides:$(top_srcdir)/tests"; \
	export GI_TYPELIB_PATH="$(top_builddir)$${GI_TYPELIB_PATH:+:$$GI_TYPELIB_PATH}"; \
	export LD_LIBRARY_PATH="$(top_builddir)/.libs$${LD_LIBRARY_PATH:+:$$LD_LIBRARY_PATH}"; \
	$(NULL)
