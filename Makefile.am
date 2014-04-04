## Process this file with automake to produce Makefile.in

# Copyright 2014 Endless Mobile, Inc.

## -----------
## Makefile.am
## -----------
## Please keep this file well-commented.

# Subdirectories where we also want to run make
# (Make sure that the library is built before the docs)
SUBDIRS = po . docs/reference/eosknowledge

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

# Pure Javascript part of library
include $(top_srcdir)/overrides/Makefile.am.inc

# Tests
include $(top_srcdir)/tests/Makefile.am.inc

# # # DOCUMENTATION # # #

# Regular Gtk-Doc is built in with recursive make, because Gtk-Doc requires it

# JS documentation generated from GIR
include $(top_srcdir)/docs/reference/eosknowledge-js/Makefile.am.inc

# JS documentation of Javascript-only parts
include $(top_srcdir)/docs/reference/eosknowledge-overrides/Makefile.am.inc

# # # INTROSPECTION # # #

-include $(INTROSPECTION_MAKEFILE)
INTROSPECTION_GIRS =
INTROSPECTION_SCANNER_ARGS = --add-include-path=$(srcdir) --warn-all
INTROSPECTION_COMPILER_ARGS = --includedir=$(srcdir)

if HAVE_INTROSPECTION
introspection_sources = \
	$(filter-out %-private.h, $(eosknowledge_library_sources)) \
	$(eosknowledge_public_installed_headers) \
	$(eosknowledge_private_installed_headers) \
	$(NULL)

EosKnowledge-@EKN_API_VERSION@.gir: libeosknowledge-@EKN_API_VERSION@.la
EosKnowledge_@EKN_API_VERSION@_gir_INCLUDES = \
	GObject-2.0 \
	GLib-2.0 \
	Gio-2.0 \
	Gtk-3.0 \
	Endless-0 \
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
