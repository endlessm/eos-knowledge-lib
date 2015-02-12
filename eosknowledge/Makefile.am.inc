## Copyright 2014 Endless Mobile, Inc.
## Included in toplevel Makefile.am

# Generate dependencies for make rule from XML resource file description. This
# is a quite tricky make rule. glib-compile-resources will error if any files
# are not found. Which means we need to build our sass before calling into it.
# So we can't just assign a variable here, but need an actual build rule with
# dependencies. Hence the gresourcedeps file.
gresourcedeps: $(scss_targets) data/eos-knowledge-library.gresource.xml
	$(AM_V_GEN) $(GLIB_COMPILE_RESOURCES) --sourcedir=$(srcdir)/data --sourcedir=$(builddir)/data --generate-dependencies \
		$(srcdir)/data/eos-knowledge-library.gresource.xml | tr '\n' ' ' | sed 's/^/resource_files = /' > $@
# This indirection keeps automake from including gresourcedeps and leaving it to make
DUMMY=gresourcedeps
include $(DUMMY)

# Generated sources for GResource file
eosknowledge/ekn-resource-private.h: data/eos-knowledge-library.gresource.xml gresourcedeps $(resource_files)
	$(AM_V_GEN) $(MKDIR_P) $(builddir)/data $(dir $@) && \
	$(GLIB_COMPILE_RESOURCES) --target=$@ --sourcedir=$(srcdir)/data --sourcedir=$(builddir)/data \
		--generate-header --internal $<
eosknowledge/ekn-resource.c: data/eos-knowledge-library.gresource.xml gresourcedeps $(resource_files)
	$(AM_V_GEN) $(MKDIR_P) $(builddir)/data $(dir $@) && \
	$(GLIB_COMPILE_RESOURCES) --target=$@ --sourcedir=$(srcdir)/data --sourcedir=$(builddir)/data \
		--generate-source --internal $<

BUILT_SOURCES += \
	eosknowledge/ekn-resource-private.h \
	eosknowledge/ekn-resource.c \
	$(NULL)
EXTRA_DIST += \
	$(filter-out $(scss_targets),$(resource_files)) \
	data/eos-knowledge-library.gresource.xml \
	$(NULL)
CLEANFILES += \
	gresourcedeps \
	$(BUILT_SOURCES) \
	$(NULL)

eosknowledge_public_installed_headers = eosknowledge/eosknowledge.h

eosknowledge_private_installed_headers = \
	eosknowledge/ekn-enums.h \
	eosknowledge/ekn-hello.h \
	eosknowledge/ekn-history-item-model.h \
	eosknowledge/ekn-history-model.h \
	eosknowledge/ekn-macros.h \
	eosknowledge/ekn-types.h \
	eosknowledge/ekn-util.h \
	eosknowledge/ekn-version.h \
	$(NULL)

eosknowledge_library_sources = \
	eosknowledge/ekn-hello.c \
	eosknowledge/ekn-history-item-model.c \
	eosknowledge/ekn-history-model.c \
	eosknowledge/ekn-init.c eosknowledge/ekn-init-private.h \
	eosknowledge/ekn-tree-node.c \
	eosknowledge/ekn-loading-animation.c \
	eosknowledge/ekn-util.c \
	$(NULL)

# Endless Knowledge Apps GUI library
lib_LTLIBRARIES += libeosknowledge-@EKN_API_VERSION@.la
libeosknowledge_@EKN_API_VERSION@_la_SOURCES = \
	$(eosknowledge_public_installed_headers) \
	$(eosknowledge_private_installed_headers) \
	$(eosknowledge_library_sources) \
	$(NULL)
nodist_libeosknowledge_@EKN_API_VERSION@_la_SOURCES = \
	$(BUILT_SOURCES) \
	$(NULL)
# Defining G_LOG_DOMAIN allows you to run any program with
# G_MESSAGES_DEBUG=EosKnowledgeLibrary ./myprogram
# and turn on debug messages
libeosknowledge_@EKN_API_VERSION@_la_CPPFLAGS = \
	@EOS_KNOWLEDGE_CFLAGS@ \
	@EOS_C_COVERAGE_CFLAGS@ \
	-DG_LOG_DOMAIN=\"EosKnowledgeLibrary\" \
	-DCOMPILING_EOS_KNOWLEDGE \
	-DDATADIR=\""$(datadir)"\" \
	$(NULL)
libeosknowledge_@EKN_API_VERSION@_la_CFLAGS = $(AM_CFLAGS)
libeosknowledge_@EKN_API_VERSION@_la_LIBADD = @EOS_KNOWLEDGE_LIBS@
libeosknowledge_@EKN_API_VERSION@_la_LDFLAGS = \
	@EOS_C_COVERAGE_LDFLAGS@ \
	-version-info @EKN_LT_VERSION_INFO@ \
	-export-symbols-regex "^ekn_" \
	$(NULL)

# Public header files
publicincludedir = $(includedir)/@EKN_API_NAME@
nobase_publicinclude_HEADERS = \
	$(eosknowledge_public_installed_headers) \
	$(eosknowledge_private_installed_headers) \
	$(NULL)
