## Process this file with automake to produce Makefile.in

# Copyright 2016 Endless Mobile, Inc.

## -----------
## Makefile.am
## -----------
## Please keep this file well-commented.

# Subdirectories where we also want to run make
# (Make sure that the library is built before the docs)
SUBDIRS = . docs/reference/ekncontent

# Our Autoconf macros are kept in the m4/ directory
ACLOCAL_AMFLAGS = -I m4

# Forward declare variables we'll be modifying all over
CLEANFILES =
DISTCLEANFILES =
BUILT_SOURCES =
EXTRA_DIST = README.md eos-knowledge-content.pc.in
lib_LTLIBRARIES =

@CODE_COVERAGE_RULES@

# # # VFS LIBRARY # # #

giomodule_LTLIBRARIES = libeknvfs.la
giomoduledir = $(libdir)/gio/modules

libeknvfs_la_SOURCES = \
	eknvfs/ekn-file-input-stream-wrapper.c \
	eknvfs/ekn-file-input-stream-wrapper.h \
	eknvfs/ekn-file.h \
	eknvfs/ekn-file.c \
	eknvfs/ekn-vfs.c \
	$(NULL)
libeknvfs_la_CPPFLAGS = \
	@EKN_VFS_CFLAGS@ \
	-DG_LOG_DOMAIN=\"EknVfs\" \
	$(NULL)
libeknvfs_la_CFLAGS = $(AM_CFLAGS)
libeknvfs_la_LIBADD  = @EKN_VFS_LIBS@
libeknvfs_la_LDFLAGS = \
	-export-symbols-regex "^g_io_module_(load|unload|query)" \
	-avoid-version \
	$(NULL)

uninstall-hook:
	if test -z "$(DESTDIR)"; then \
	  $(GIO_QUERYMODULES) $(giomoduledir);  \
	fi

install-data-hook:
	if test -z "$(DESTDIR)"; then \
	  $(GIO_QUERYMODULES) $(giomoduledir);  \
	fi

# # # CONTENT LIBRARY # # #

ekncontent_public_installed_headers = ekncontent/eos-knowledge-content.h
ekncontent_built_installed_headers = ekncontent/eknc-version.h
ekncontent_private_installed_headers = \
	ekncontent/eknc-article-object-model.h \
	ekncontent/eknc-content-object-model.h \
	ekncontent/eknc-domain.h \
	ekncontent/eknc-engine.h \
	ekncontent/eknc-audio-object-model.h \
	ekncontent/eknc-dictionary-object-model.h \
	ekncontent/eknc-image-object-model.h \
	ekncontent/eknc-media-object-model.h \
	ekncontent/eknc-object-model.h \
	ekncontent/eknc-query-object.h \
	ekncontent/eknc-query-results.h \
	ekncontent/eknc-set-object-model.h \
	ekncontent/eknc-utils.h \
	ekncontent/eknc-video-object-model.h \
	ekncontent/eknc-xapian-bridge.h \
	$(NULL)
ekncontent_sources = \
	ekncontent/eknc-article-object-model.c \
	ekncontent/eknc-content-object-model-private.h \
	ekncontent/eknc-content-object-model.c \
	ekncontent/eknc-domain-private.h \
	ekncontent/eknc-domain.c \
	ekncontent/eknc-engine.c \
	ekncontent/eknc-audio-object-model.c \
	ekncontent/eknc-dictionary-object-model.c \
	ekncontent/eknc-image-object-model.c \
	ekncontent/eknc-media-object-model-private.h \
	ekncontent/eknc-media-object-model.c \
	ekncontent/eknc-object-model.c \
	ekncontent/eknc-query-object.c \
	ekncontent/eknc-query-results.c \
	ekncontent/eknc-set-object-model.c \
	ekncontent/eknc-utils-private.h \
	ekncontent/eknc-utils.c \
	ekncontent/eknc-video-object-model.c \
	ekncontent/eknc-database-manager.c \
	ekncontent/eknc-database-manager-private.h \
	ekncontent/eknc-xapian-bridge.c \
	$(NULL)

glib_enum_headers = \
	$(ekncontent_public_installed_headers) \
	$(ekncontent_private_installed_headers) \
	$(NULL)
glib_enum_h = ekncontent/eknc-enums.h
glib_enum_c = ekncontent/eknc-enums.c
include $(top_srcdir)/Makefile.am.enums

lib_LTLIBRARIES += libeos-knowledge-content-@EKN_CONTENT_API_VERSION@.la
libeos_knowledge_content_@EKN_CONTENT_API_VERSION@_la_SOURCES = \
	$(glib_enum_h) \
	$(glib_enum_c) \
	$(ekncontent_public_installed_headers) \
	$(ekncontent_built_installed_headers) \
	$(ekncontent_private_installed_headers) \
	$(ekncontent_sources) \
	$(NULL)

libeos_knowledge_content_@EKN_CONTENT_API_VERSION@_la_CPPFLAGS = \
	@EKN_CONTENT_CFLAGS@ \
	$(CODE_COVERAGE_CPPFLAGS) \
	-DG_LOG_DOMAIN=\"EosKnowledgeContent\" \
	-DCOMPILING_EKN_CONTENT \
	-I $(builddir)/ekncontent \
	$(NULL)
libeos_knowledge_content_@EKN_CONTENT_API_VERSION@_la_CFLAGS = \
	$(AM_CFLAGS) \
	$(CODE_COVERAGE_CFLAGS) \
	$(NULL)
libeos_knowledge_content_@EKN_CONTENT_API_VERSION@_la_LIBADD = @EKN_CONTENT_LIBS@
libeos_knowledge_content_@EKN_CONTENT_API_VERSION@_la_LDFLAGS = \
	-version-info @EKN_CONTENT_LT_VERSION_INFO@ \
	-export-symbols-regex "^eknc_" \
	$(CODE_COVERAGE_LIBS) \
	$(NULL)

# Public header files
ekncontentincludedir = $(includedir)/@EKN_CONTENT_API_NAME@
ekncontentinclude_HEADERS = \
	$(glib_enum_h) \
	$(ekncontent_public_installed_headers) \
	$(ekncontent_built_installed_headers) \
	$(ekncontent_private_installed_headers)

# Pkg-config file
pkgconfigdir = $(libdir)/pkgconfig
pkgconfig_DATA = @EKN_CONTENT_API_NAME@.pc
DISTCLEANFILES += @EKN_CONTENT_API_NAME@.pc

# # # TESTS # # #

javascript_tests = \
	tests/ekncontent/testArticleObjectModel.js \
	tests/ekncontent/testContentObjectModel.js \
	tests/ekncontent/testDatadir.js \
	tests/ekncontent/testDomain.js \
	tests/ekncontent/testEngine.js \
	tests/ekncontent/testAudioObjectModel.js \
	tests/ekncontent/testDictionaryObjectModel.js \
	tests/ekncontent/testImageObjectModel.js \
	tests/ekncontent/testMediaObjectModel.js \
	tests/ekncontent/testObjectModel.js \
	tests/ekncontent/testQueryObject.js \
	tests/ekncontent/testQueryResults.js \
	tests/ekncontent/testSetObjectModel.js \
	tests/ekncontent/testUtils.js \
	tests/ekncontent/testVideoObjectModel.js \
	tests/ekncontent/testXapianBridge.js \
	$(NULL)

test_content = \
	tests/testcontent/ekn/data/com.endlessm.fake_test_app.en/EKN_VERSION \
	tests/testcontent/ekn/data/com.endlessm.fake_test_app.en/subscriptions.json \
	tests/testcontent/ekn/data/com.endlessm.fake_test_app.en/com.endlessm.subscriptions/1aa1fe392aa50a771ca5f8a6452a758896a21f7644225f4d1ddbefec77053c9b/manifest.json \
	tests/testcontent/ekn/data/com.endlessm.fake_test_app.en/com.endlessm.subscriptions/1aa1fe392aa50a771ca5f8a6452a758896a21f7644225f4d1ddbefec77053c9b/test.shard \
	tests/testcontent/ekn/data/com.endlessm.fake_test_app.en/com.endlessm.subscriptions/9db1104bdc122815029851172c7d2c5138130a6fb77af6dd2726686068a70541/manifest.json \
	tests/testcontent/ekn/data/com.endlessm.fake_test_app.en/com.endlessm.subscriptions/9db1104bdc122815029851172c7d2c5138130a6fb77af6dd2726686068a70541/output.shard \
	$(NULL)

EXTRA_DIST += \
	$(javascript_tests) \
	$(test_content) \
	tests/InstanceOfMatcher.js \
	$(NULL)

# Run tests when running 'make check'
TESTS = \
	$(javascript_tests) \
	$(NULL)
LOG_COMPILER = gtester
AM_LOG_FLAGS = -k --verbose

TEST_EXTENSIONS = .js

JS_LOG_DRIVER = env AM_TAP_AWK='$(AWK)' $(SHELL) $(top_srcdir)/tap-driver.sh
JS_LOG_DRIVER_FLAGS = --comments
JS_LOG_COMPILER = jasmine
AM_JS_LOG_FLAGS = --tap --no-config @JASMINE_REPORT_ARGUMENT@

AM_TESTS_ENVIRONMENT = \
	export GJS_PATH="$(top_srcdir):$(top_builddir)"; \
	export GI_TYPELIB_PATH="$(top_builddir)$${GI_TYPELIB_PATH:+:$$GI_TYPELIB_PATH}"; \
	export LD_LIBRARY_PATH="$(top_builddir)/.libs$${LD_LIBRARY_PATH:+:$$LD_LIBRARY_PATH}"; \
	export G_TEST_SRCDIR="$(abs_srcdir)/tests"; \
	export G_TEST_BUILDDIR="$(abs_builddir)/tests"; \
	export XDG_DATA_DIRS="$(abs_srcdir)/tests/testcontent:$${XDG_DATA_DIRS:-/usr/local/share/:/usr/share/}"; \
	export LC_ALL=C; \
	$(NULL)

# # # INTROSPECTION # # #

-include $(INTROSPECTION_MAKEFILE)
INTROSPECTION_GIRS =
INTROSPECTION_SCANNER_ARGS = \
	--add-include-path=$(srcdir) \
	--warn-all \
	$(EKN_CONTENT_CFLAGS) \
	-I ekncontent \
	$(NULL)
INTROSPECTION_COMPILER_ARGS = --includedir=$(srcdir)

introspection_sources = \
	$(filter-out %-private.h, $(ekncontent_sources)) \
	$(glib_enum_h) \
	$(ekncontent_public_installed_headers) \
	$(ekncontent_private_installed_headers)

EosKnowledgeContent-@EKN_CONTENT_API_VERSION@.gir: libeos-knowledge-content-@EKN_CONTENT_API_VERSION@.la
EosKnowledgeContent_@EKN_CONTENT_API_VERSION@_gir_INCLUDES = \
	EosShard-0 \
	Gio-2.0 \
	GLib-2.0 \
	GObject-2.0 \
	Json-1.0 \
	Soup-2.4 \
	$(NULL)
EosKnowledgeContent_@EKN_CONTENT_API_VERSION@_gir_SCANNERFLAGS = \
	--warn-all --warn-error \
	--identifier-prefix=Eknc \
	--symbol-prefix=eknc \
	-DCOMPILING_EKN_CONTENT \
	$(NULL)
EosKnowledgeContent_@EKN_CONTENT_API_VERSION@_gir_LIBS = libeos-knowledge-content-@EKN_CONTENT_API_VERSION@.la
EosKnowledgeContent_@EKN_CONTENT_API_VERSION@_gir_FILES = $(introspection_sources)
INTROSPECTION_GIRS += EosKnowledgeContent-@EKN_CONTENT_API_VERSION@.gir

girdir = $(datadir)/gir-1.0
gir_DATA = $(INTROSPECTION_GIRS)

typelibdir = $(libdir)/girepository-1.0
typelib_DATA = $(INTROSPECTION_GIRS:.gir=.typelib)

overridesdir = $(datadir)/gjs-1.0/overrides
overrides_DATA = overrides/EosKnowledgeContent.js
EXTRA_DIST += overrides/EosKnowledgeContent.js

CLEANFILES += $(INTROSPECTION_GIRS) $(typelib_DATA)
