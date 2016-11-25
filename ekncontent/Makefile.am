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
EXTRA_DIST = README.md
pkglib_LTLIBRARIES =

@CODE_COVERAGE_RULES@

# # # EKN VFS LIBRARY # # #

giomodule_LTLIBRARIES = libeknvfs.la
giomoduledir = $(libdir)/gio/modules

libeknvfs_la_SOURCES = \
	lib/eknvfs/ekn-file-input-stream-wrapper.c \
	lib/eknvfs/ekn-file-input-stream-wrapper.h \
	lib/eknvfs/ekn-file.h \
	lib/eknvfs/ekn-file.c \
	lib/eknvfs/ekn-vfs.c \
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

# TMP: keep installing to eos-knowledge pkglibdir until we make this public
knowledgelibdir = $(libdir)/eos-knowledge
knowledgelib_LTLIBRARIES = libeosknowledgecontent.la
libeosknowledgecontent_la_SOURCES = \
       lib/ekncontent/eknc-subtree-dispatcher.c \
       lib/ekncontent/eknc-subtree-dispatcher.h \
       lib/ekncontent/eknc-utils.c \
       lib/ekncontent/eknc-utils.h \
       $(NULL)

libeosknowledgecontent_la_CPPFLAGS = @EKN_CONTENT_CFLAGS@
libeosknowledgecontent_la_CFLAGS = $(AM_CFLAGS)
libeosknowledgecontent_la_LIBADD = @EKN_CONTENT_LIBS@
libeosknowledgecontent_la_LDFLAGS = -avoid-version

# # # INTROSPECTION # # #

-include $(INTROSPECTION_MAKEFILE)
INTROSPECTION_GIRS =
INTROSPECTION_SCANNER_ARGS = --add-include-path=$(srcdir) --warn-all $(EKN_CONTENT_CFLAGS)
INTROSPECTION_COMPILER_ARGS = --includedir=$(srcdir)

EosKnowledgeContent-1.0.gir: libeosknowledgecontent.la
EosKnowledgeContent_1_0_gir_INCLUDES = \
	EosShard-0 \
	Gio-2.0 \
	GLib-2.0 \
	GObject-2.0
EosKnowledgeContent_1_0_gir_SCANNERFLAGS = --warn-all --warn-error --identifier-prefix=Eknc --symbol-prefix=eknc
EosKnowledgeContent_1_0_gir_LIBS = libeosknowledgecontent.la
EosKnowledgeContent_1_0_gir_FILES = $(libeosknowledgecontent_la_SOURCES)
INTROSPECTION_GIRS += EosKnowledgeContent-1.0.gir

typelibdir = $(knowledgelibdir)/girepository-1.0
typelib_DATA = $(INTROSPECTION_GIRS:.gir=.typelib)

CLEANFILES += $(INTROSPECTION_GIRS) $(typelib_DATA)
