## Process this file with automake to produce Makefile.in

# The name of the module, e.g. 'glib'.
DOC_MODULE=eos-knowledge-content

# Uncomment for versioned docs and specify the version of the module, e.g. '2'.
DOC_MODULE_VERSION=@EKN_CONTENT_API_VERSION@

# The top-level SGML file. You can change this if you want to.
DOC_MAIN_SGML_FILE=$(DOC_MODULE)-docs.xml

# Directories containing the source code.
# gtk-doc will search all .c and .h files beneath these paths
# for inline comments documenting functions and macros.
# e.g. DOC_SOURCE_DIR=$(top_srcdir)/gtk $(top_srcdir)/gdk
DOC_SOURCE_DIR=$(top_srcdir)/ekncontent $(top_builddir)/ekncontent

# Extra options to pass to gtkdoc-scangobj. Not normally needed.
SCANGOBJ_OPTIONS=

# Extra options to supply to gtkdoc-scan.
# e.g. SCAN_OPTIONS=--deprecated-guards="GTK_DISABLE_DEPRECATED"
SCAN_OPTIONS=--rebuild-types

# Extra options to supply to gtkdoc-mkdb.
# e.g. MKDB_OPTIONS=--xml-mode --output-format=xml
MKDB_OPTIONS=--xml-mode --output-format=xml

# Extra options to supply to gtkdoc-mktmpl
# e.g. MKTMPL_OPTIONS=--only-section-tmpl
MKTMPL_OPTIONS=

# Extra options to supply to gtkdoc-mkhtml
MKHTML_OPTIONS=

# Extra options to supply to gtkdoc-fixxref. Not normally needed.
# e.g. FIXXREF_OPTIONS=--extra-dir=../gdk-pixbuf/html --extra-dir=../gdk/html
FIXXREF_OPTIONS=

# Used for dependencies. The docs will be rebuilt if any of these change.
BUILT_HFILES=
HFILE_GLOB=$(top_srcdir)/ekncontent/*.h
CFILE_GLOB=$(top_srcdir)/ekncontent/*.c

# Extra header to include when scanning, which are not under DOC_SOURCE_DIR
# e.g. EXTRA_HFILES=$(top_srcdir)/contrib/extra.h
EXTRA_HFILES=

# Header files or dirs to ignore when scanning. Use base file/dir names
# e.g. IGNORE_HFILES=gtkdebug.h gtkintl.h private_code
IGNORE_HFILES=eknc-enums.h

# Images to copy into HTML directory.
# e.g. HTML_IMAGES=$(top_srcdir)/gtk/stock-icons/stock_about_24.png
HTML_IMAGES=

# Extra SGML files that are included by $(DOC_MAIN_SGML_FILE).
# e.g. content_files=running.sgml building.sgml changes-2.0.sgml
content_files=

# SGML files where gtk-doc abbrevations (#GtkWidget) are expanded
# These files must be listed here *and* in content_files
# e.g. expand_content_files=running.sgml
expand_content_files=

# CFLAGS and LDFLAGS for compiling gtkdoc-scangobj with your library.
# Only needed if you are using gtkdoc-scangobj to dynamically query widget
# signals and properties.
GTKDOC_CFLAGS=-I$(top_srcdir) -I$(top_builddir) @EKN_CONTENT_CFLAGS@
GTKDOC_LIBS=$(top_builddir)/libeos-knowledge-content-@EKN_CONTENT_API_VERSION@.la @EKN_CONTENT_LIBS@

# This includes the standard gtk-doc make rules, copied by gtkdocize.
include $(top_srcdir)/gtk-doc.make

# Other files to distribute
# e.g. EXTRA_DIST += version.xml.in
EXTRA_DIST +=

# Files not to distribute
# for --rebuild-types in $(SCAN_OPTIONS), e.g. $(DOC_MODULE).types
# for --rebuild-sections in $(SCAN_OPTIONS) e.g. $(DOC_MODULE)-sections.txt
#DISTCLEANFILES +=

if ENABLE_GTK_DOC
AM_TESTS_ENVIRONMENT = \
	export DOC_MODULE=$(DOC_MODULE); \
	export DOC_MAIN_SGML_FILE=$(DOC_MAIN_SGML_FILE); \
	export SRCDIR=$(abs_srcdir); \
	export BUILDDIR=$(abs_builddir);
TESTS = $(GTKDOC_CHECK)
endif
