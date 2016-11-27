## Process this file with automake to produce Makefile.in

# Copyright 2016 Endless Mobile, Inc.

## -----------
## Makefile.am
## -----------
## Please keep this file well-commented.

# Our Autoconf macros are kept in the m4/ directory
ACLOCAL_AMFLAGS = -I m4

# Forward declare variables we'll be modifying all over
CLEANFILES =
DISTCLEANFILES =
EXTRA_DIST = README.md eos-knowledge-content.pc.in
lib_LTLIBRARIES =

@CODE_COVERAGE_RULES@

# # # EKN VFS LIBRARY # # #

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

# # # SEARCH PRIVATE LIBRARY # # #

ekncontent_public_installed_headers = ekncontent/eos-knowledge-content.h
ekncontent_private_installed_headers = \
	ekncontent/eknc-subtree-dispatcher.h \
	ekncontent/eknc-utils.h \
	ekncontent/eknc-version.h \
	$(NULL)
ekncontent_sources = \
	ekncontent/eknc-subtree-dispatcher.c \
	ekncontent/eknc-utils.c \
	$(NULL)

lib_LTLIBRARIES += libeos-knowledge-content-@EKN_CONTENT_API_VERSION@.la
libeos_knowledge_content_@EKN_CONTENT_API_VERSION@_la_SOURCES = \
	$(ekncontent_public_installed_headers) \
	$(ekncontent_private_installed_headers) \
	$(ekncontent_sources) \
	$(NULL)

libeos_knowledge_content_@EKN_CONTENT_API_VERSION@_la_CPPFLAGS = \
	@EKN_CONTENT_CFLAGS@ \
	$(CODE_COVERAGE_CPPFLAGS) \
	-DG_LOG_DOMAIN=\"EosKnowledgeContent\" \
	-DCOMPILING_EKN_CONTENT \
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
	$(ekncontent_public_installed_headers) \
	$(ekncontent_private_installed_headers)

# Pkg-config file
pkgconfigdir = $(libdir)/pkgconfig
pkgconfig_DATA = @EKN_CONTENT_API_NAME@.pc
DISTCLEANFILES += @EKN_CONTENT_API_NAME@.pc

# # # INTROSPECTION # # #

-include $(INTROSPECTION_MAKEFILE)
INTROSPECTION_GIRS =
INTROSPECTION_SCANNER_ARGS = --add-include-path=$(srcdir) --warn-all $(EKN_CONTENT_CFLAGS)
INTROSPECTION_COMPILER_ARGS = --includedir=$(srcdir)

introspection_sources = \
	$(filter-out %-private.h, $(ekncontent_sources)) \
	$(ekncontent_public_installed_headers) \
	$(ekncontent_private_installed_headers)

EosKnowledgeContent-@EKN_CONTENT_API_VERSION@.gir: libeos-knowledge-content-@EKN_CONTENT_API_VERSION@.la
EosKnowledgeContent_@EKN_CONTENT_API_VERSION@_gir_INCLUDES = \
	EosShard-0 \
	Gio-2.0 \
	GLib-2.0 \
	GObject-2.0
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

CLEANFILES += $(INTROSPECTION_GIRS) $(typelib_DATA)
