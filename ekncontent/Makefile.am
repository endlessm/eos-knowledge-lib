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
knowledgelib_LTLIBRARIES = libeosknowledgesearchprivate.la
libeosknowledgesearchprivate_la_SOURCES = \
       lib/eosknowledgesearchprivate/ekns-subtree-dispatcher.c \
       lib/eosknowledgesearchprivate/ekns-subtree-dispatcher.h \
       lib/eosknowledgesearchprivate/ekns-utils.c \
       lib/eosknowledgesearchprivate/ekns-utils.h \
       $(NULL)

libeosknowledgesearchprivate_la_CPPFLAGS = @EOS_KNOWLEDGE_SEARCH_PRIVATE_CFLAGS@
libeosknowledgesearchprivate_la_CFLAGS = $(AM_CFLAGS)
libeosknowledgesearchprivate_la_LIBADD = @EOS_KNOWLEDGE_SEARCH_PRIVATE_LIBS@
libeosknowledgesearchprivate_la_LDFLAGS = -avoid-version

# # # INTROSPECTION # # #

-include $(INTROSPECTION_MAKEFILE)
INTROSPECTION_GIRS =
INTROSPECTION_SCANNER_ARGS = --add-include-path=$(srcdir) --warn-all $(EOS_KNOWLEDGE_SEARCH_PRIVATE_CFLAGS)
INTROSPECTION_COMPILER_ARGS = --includedir=$(srcdir)

EosKnowledgeSearchPrivate-1.0.gir: libeosknowledgesearchprivate.la
EosKnowledgeSearchPrivate_1_0_gir_INCLUDES = Gio-2.0
EosKnowledgeSearchPrivate_1_0_gir_SCANNERFLAGS = --warn-all --warn-error --identifier-prefix=Ekns --symbol-prefix=ekns
EosKnowledgeSearchPrivate_1_0_gir_LIBS = libeosknowledgesearchprivate.la
EosKnowledgeSearchPrivate_1_0_gir_FILES = $(libeosknowledgesearchprivate_la_SOURCES)
INTROSPECTION_GIRS += EosKnowledgeSearchPrivate-1.0.gir

typelibdir = $(knowledgelibdir)/girepository-1.0
typelib_DATA = $(INTROSPECTION_GIRS:.gir=.typelib)

CLEANFILES += $(INTROSPECTION_GIRS) $(typelib_DATA)
