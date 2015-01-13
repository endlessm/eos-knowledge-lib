## Process this file with automake to produce Makefile.in

# Copyright 2014 Endless Mobile, Inc.

## -----------
## Makefile.am
## -----------
## Please keep this file well-commented.

# Subdirectories where we also want to run make
# (Make sure that the library is built before the docs)
SUBDIRS = po . docs/reference/eosknowledge docs/reference/eosknowledge-overrides docs/reference/eosknowledgesearch

# Our Autoconf macros are kept in the m4/ directory
ACLOCAL_AMFLAGS = -I m4

# Extra files to distribute in the tarball
EXTRA_DIST = README.md

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

# Define these variables so that other Makefile snippets can add to them
CLEANFILES =
DISTCLEANFILES =
dist_noinst_DATA =
nobase_pkgdata_DATA =
bin_SCRIPTS =

# Make sure that 'make dist' includes documentation
if !CAN_MAKE_DIST
distdir:
	@echo "***"
	@echo "*** You must configure with --enable-gtk-doc, --enable-gir-doc, and"
	@echo "*** --enable-js-doc to run make dist or make distcheck."
	@echo "***"
	@false
endif

# # # LIBRARY # # #

# Main library
include $(top_srcdir)/eosknowledge/Makefile.am.inc

# Pkg-config file
pkgconfigdir = $(libdir)/pkgconfig
pkgconfig_DATA = @EKN_API_NAME@.pc
DISTCLEANFILES += @EKN_API_NAME@.pc
EXTRA_DIST += @EKN_API_NAME@.pc.in

# Javascript overrides for main library
include $(top_srcdir)/overrides/Makefile.am.inc
# Pure Javascript libraries
include $(top_srcdir)/js/Makefile.am.inc

# Link our libraries to the system gjs directory
gjsdir = $(datadir)/gjs-1.0
overridesdir = $(gjsdir)/overrides
install-data-hook:
	$(MKDIR_P) $(DESTDIR)$(overridesdir)
	rm -f $(DESTDIR)$(overridesdir)/EosKnowledge.js
	ln -s $(pkgoverridesdir)/EosKnowledge.js \
		$(DESTDIR)$(overridesdir)/EosKnowledge.js
	rm -f $(DESTDIR)$(gjsdir)/EosKnowledgeSearch.js
	ln -s $(searchdir)/EosKnowledgeSearch.js \
		$(DESTDIR)$(gjsdir)/EosKnowledgeSearch.js

uninstall-hook:
	rm -f $(DESTDIR)$(overridesdir)/EosKnowledge.js
	rm -f $(DESTDIR)$(gjsdir)/EosKnowledgeSearch.js

# Tests
include $(top_srcdir)/tests/Makefile.am.inc

# # # DOCUMENTATION # # #

# Regular Gtk-Doc and naturaldocs documentation are built with recursive make

# JS documentation generated from GIR
include $(top_srcdir)/docs/reference/eosknowledge-js/Makefile.am.inc

# # # INTROSPECTION # # #

-include $(INTROSPECTION_MAKEFILE)
INTROSPECTION_GIRS =
INTROSPECTION_SCANNER_ARGS = --add-include-path=$(srcdir) --warn-all $(EOS_KNOWLEDGE_CFLAGS)
INTROSPECTION_COMPILER_ARGS = --includedir=$(srcdir)

if HAVE_INTROSPECTION
introspection_sources = \
	$(filter-out %-private.h, $(eosknowledge_library_sources)) \
	$(eosknowledge_public_installed_headers) \
	$(eosknowledge_private_installed_headers) \
	$(NULL)

EosKnowledge-@EKN_API_VERSION@.gir: libeosknowledge-@EKN_API_VERSION@.la
EosKnowledge_@EKN_API_VERSION@_gir_INCLUDES = \
	Endless-0 \
	Gio-2.0 \
	GLib-2.0 \
	GObject-2.0 \
	WebKit2-3.0 \
	Gtk-3.0 \
	$(NULL)
EosKnowledge_@EKN_API_VERSION@_gir_SCANNERFLAGS = \
	--identifier-prefix=Ekn \
	--symbol-prefix=ekn \
	-DCOMPILING_EOS_KNOWLEDGE \
	$(NULL)
EosKnowledge_@EKN_API_VERSION@_gir_LIBS = libeosknowledge-@EKN_API_VERSION@.la
EosKnowledge_@EKN_API_VERSION@_gir_FILES = $(introspection_sources)
EosKnowledge_@EKN_API_VERSION@_gir_EXPORT_PACKAGES = @EKN_API_NAME@
INTROSPECTION_GIRS += EosKnowledge-@EKN_API_VERSION@.gir

girdir = $(datadir)/gir-1.0
gir_DATA = $(INTROSPECTION_GIRS)

typelibdir = $(libdir)/girepository-1.0
typelib_DATA = $(INTROSPECTION_GIRS:.gir=.typelib)

CLEANFILES += $(gir_DATA) $(typelib_DATA)
endif
