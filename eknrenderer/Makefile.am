## Process this file with automake to produce Makefile.in

# Copyright 2018 Endless Mobile, Inc.

## -----------
## Makefile.am
## -----------
## Please keep this file well-commented.

# Subdirectories where we also want to run make
# (Make sure that the library is built before the docs)
SUBDIRS = .

# Our Autoconf macros are kept in the m4/ directory
ACLOCAL_AMFLAGS = -I m4

# Forward declare variables we'll be modifying all over
CLEANFILES =
DISTCLEANFILES =
BUILT_SOURCES =
EXTRA_DIST = README.md eos-knowledge-renderer.pc.in
lib_LTLIBRARIES =

@CODE_COVERAGE_RULES@

# # # RENDERER LIBRARY # # #

eknrenderer_public_installed_headers = eknrenderer/eknr-renderer.h
eknrenderer_sources = \
	eknrenderer/eknr-renderer.c \
	$(NULL)

glib_enum_headers = \
	$(eknrenderer_public_installed_headers) \
	$(NULL)
glib_enum_h = eknrenderer/eknr-enums.h
glib_enum_c = eknrenderer/eknr-enums.c
include $(top_srcdir)/Makefile.am.enums

lib_LTLIBRARIES += libeos-knowledge-renderer-@EKN_RENDERER_API_VERSION@.la
libeos_knowledge_renderer_@EKN_RENDERER_API_VERSION@_la_SOURCES = \
	$(glib_enum_h) \
	$(glib_enum_c) \
	$(eknrenderer_public_installed_headers) \
	$(eknrenderer_sources) \
	$(NULL)

libeos_knowledge_renderer_@EKN_RENDERER_API_VERSION@_la_CPPFLAGS = \
	@EKN_RENDERER_CFLAGS@ \
	$(CODE_COVERAGE_CPPFLAGS) \
	-DG_LOG_DOMAIN=\"EosKnowledgeRenderer\" \
	-DCOMPILING_EKN_RENDERER \
	-DMATHJAX_PATH=\"@MATHJAXDIR@\"
	-I $(builddir)/eknrenderer \
	$(NULL)
libeos_knowledge_renderer_@EKN_RENDERER_API_VERSION@_la_CFLAGS = \
	$(AM_CFLAGS) \
	$(CODE_COVERAGE_CFLAGS) \
	$(NULL)
libeos_knowledge_renderer_@EKN_RENDERER_API_VERSION@_la_LIBADD = @EKN_RENDERER_LIBS@
libeos_knowledge_renderer_@EKN_RENDERER_API_VERSION@_la_LDFLAGS = \
	-version-info @EKN_RENDERER_LT_VERSION_INFO@ \
	-export-symbols-regex "^eknr_" \
	$(CODE_COVERAGE_LIBS) \
	$(NULL)

# Public header files
eknrendererincludedir = $(includedir)/@EKN_RENDERER_API_NAME@
eknrendererinclude_HEADERS = \
	$(glib_enum_h) \
	$(eknrenderer_public_installed_headers) \
	$(eknrenderer_built_installed_headers) \
	$(eknrenderer_private_installed_headers)

# Pkg-config file
pkgconfigdir = $(libdir)/pkgconfig
pkgconfig_DATA = @EKN_RENDERER_API_NAME@.pc
DISTCLEANFILES += @EKN_RENDERER_API_NAME@.pc

# Run tests when running 'make check'
TESTS = \
	$(NULL)
LOG_COMPILER = gtester
AM_LOG_FLAGS = -k --verbose

AM_TESTS_ENVIRONMENT = \
	export GI_TYPELIB_PATH="$(top_builddir)$${GI_TYPELIB_PATH:+:$$GI_TYPELIB_PATH}"; \
	export LD_LIBRARY_PATH="$(top_builddir)/.libs$${LD_LIBRARY_PATH:+:$$LD_LIBRARY_PATH}"; \
	export G_TEST_SRCDIR="$(abs_srcdir)/tests"; \
	export G_TEST_BUILDDIR="$(abs_builddir)/tests"; \
	export LC_ALL=C; \
	$(NULL)

# # # INTROSPECTION # # #

-include $(INTROSPECTION_MAKEFILE)
INTROSPECTION_GIRS =
INTROSPECTION_SCANNER_ARGS = \
	--add-include-path=$(srcdir) \
	--warn-all \
	$(EKN_RENDERER_CFLAGS) \
	-I eknrenderer \
	$(NULL)
INTROSPECTION_COMPILER_ARGS = --includedir=$(srcdir)

introspection_sources = \
	$(filter-out %-private.h, $(eknrenderer_sources)) \
	$(glib_enum_h) \
	$(eknrenderer_public_installed_headers) \
	$(eknrenderer_private_installed_headers)

EosKnowledgeRenderer-@EKN_RENDERER_API_VERSION@.gir: libeos-knowledge-renderer-@EKN_RENDERER_API_VERSION@.la
EosKnowledgeRenderer_@EKN_RENDERER_API_VERSION@_gir_INCLUDES = \
	EosShard-0 \
	Gio-2.0 \
	GLib-2.0 \
	GObject-2.0 \
	Json-1.0 \
	$(NULL)
EosKnowledgeRenderer_@EKN_RENDERER_API_VERSION@_gir_SCANNERFLAGS = \
	--warn-all --warn-error \
	--identifier-prefix=Eknr \
	--symbol-prefix=eknr \
	-DCOMPILING_EKN_RENDERER \
	$(NULL)
EosKnowledgeRenderer_@EKN_RENDERER_API_VERSION@_gir_LIBS = libeos-knowledge-renderer-@EKN_RENDERER_API_VERSION@.la
EosKnowledgeRenderer_@EKN_RENDERER_API_VERSION@_gir_FILES = $(introspection_sources)
INTROSPECTION_GIRS += EosKnowledgeRenderer-@EKN_RENDERER_API_VERSION@.gir

girdir = $(datadir)/gir-1.0
gir_DATA = $(INTROSPECTION_GIRS)

typelibdir = $(libdir)/girepository-1.0
typelib_DATA = $(INTROSPECTION_GIRS:.gir=.typelib)

CLEANFILES += $(INTROSPECTION_GIRS) $(typelib_DATA)
