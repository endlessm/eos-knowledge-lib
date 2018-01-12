DOC_MODULE = eos-knowledge-content
DOC_MODULE_VERSION = @EKN_CONTENT_API_VERSION@

DOC_MAIN_SGML_FILE = $(DOC_MODULE)-docs.xml

DOC_SOURCE_DIR = \
	$(top_srcdir)/ekncontent \
	$(top_builddir)/ekncontent

SCANGOBJ_OPTIONS =
SCAN_OPTIONS = --rebuild-types
MKDB_OPTIONS = --xml-mode --output-format=xml
MKTMPL_OPTIONS =
MKHTML_OPTIONS =
FIXXREF_OPTIONS =

BUILT_HFILES=
HFILE_GLOB = $(top_srcdir)/ekncontent/*.h $(top_builddir)/ekncontent/*.h
CFILE_GLOB = $(top_srcdir)/ekncontent/*.c

EXTRA_HFILES =

IGNORE_HFILES = \
	eknc-enums.h \
	eknc-content-object-model-private.h \
	eknc-database-manager-private.h \
	eknc-domain-private.h \
	eknc-media-object-model-private.h \
	eknc-query-object-private.h \
	eknc-utils-private.h

HTML_IMAGES =

content_files =
expand_content_files =

GTKDOC_CFLAGS = \
	-I$(top_srcdir) \
	-I$(top_builddir) \
	@EKN_CONTENT_CFLAGS@
GTKDOC_LIBS = $(top_builddir)/libeos-knowledge-content-@EKN_CONTENT_API_VERSION@.la @EKN_CONTENT_LIBS@

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
