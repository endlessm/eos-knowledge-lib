## Copyright 2014 Endless Mobile, Inc.
## Included in toplevel Makefile.am

# Generate dependencies for make rule from XML resource file description
resource_files := $(shell $(GLIB_COMPILE_RESOURCES) --sourcedir=$(srcdir)/data \
	--generate-dependencies $(srcdir)/data/eos-knowledge-library.gresource.xml)

# Generated sources for GResource file
eosknowledge/ekn-resource-private.h: data/eos-knowledge-library.gresource.xml $(resource_files)
	$(AM_V_GEN) $(MKDIR_P) $(builddir)/data && \
	$(GLIB_COMPILE_RESOURCES) --target=$@ --sourcedir=$(srcdir)/data \
		--generate-header --internal $<
eosknowledge/ekn-resource.c: data/eos-knowledge-library.gresource.xml $(resource_files)
	$(AM_V_GEN) $(MKDIR_P) $(builddir)/data && \
	$(GLIB_COMPILE_RESOURCES) --target=$@ --sourcedir=$(srcdir)/data \
		--generate-source --internal $<

BUILT_SOURCES = \
	eosknowledge/ekn-resource-private.h \
	eosknowledge/ekn-resource.c \
	$(NULL)
EXTRA_DIST += \
	$(resource_files) \
	data/eos-knowledge-library.gresource.xml \
	$(NULL)

eosknowledge_public_installed_headers = eosknowledge/eosknowledge.h

eosknowledge_private_installed_headers = \
	eosknowledge/ekn-enums.h \
	eosknowledge/ekn-hello.h \
	eosknowledge/ekn-history-item-model.h \
	eosknowledge/ekn-macros.h \
	eosknowledge/ekn-types.h \
	eosknowledge/ekn-version.h \
	$(NULL)

eosknowledge_library_sources = \
	eosknowledge/ekn-hello.c \
	eosknowledge/ekn-history-item-model.c \
	eosknowledge/ekn-init.c eosknowledge/ekn-init-private.h \
	eosknowledge/ekn-resource.c eosknowledge/ekn-resource-private.h \
	$(NULL)

# Endless Knowledge Apps GUI library
lib_LTLIBRARIES = libeosknowledge-@EKN_API_VERSION@.la
libeosknowledge_@EKN_API_VERSION@_la_SOURCES = \
	$(eosknowledge_public_installed_headers) \
	$(eosknowledge_private_installed_headers) \
	$(eosknowledge_library_sources) \
	$(NULL)
# Defining G_LOG_DOMAIN allows you to run any program with
# G_MESSAGES_DEBUG=EosKnowledgeLibrary ./myprogram
# and turn on debug messages
libeosknowledge_@EKN_API_VERSION@_la_CPPFLAGS = \
	@EOS_KNOWLEDGE_CFLAGS@ \
	-DG_LOG_DOMAIN=\"EosKnowledgeLibrary\" \
	-DCOMPILING_EOS_KNOWLEDGE \
	-DDATADIR=\""$(datadir)"\" \
	$(NULL)
libeosknowledge_@EKN_API_VERSION@_la_CFLAGS = $(AM_CFLAGS)
libeosknowledge_@EKN_API_VERSION@_la_LIBADD = @EOS_KNOWLEDGE_LIBS@
libeosknowledge_@EKN_API_VERSION@_la_LDFLAGS = \
	-version-info @EKN_LT_VERSION_INFO@ \
	-export-symbols-regex "^ekn_" \
	$(NULL)

# Public header files
publicincludedir = $(includedir)/@EKN_API_NAME@
nobase_publicinclude_HEADERS = \
	$(endless_public_installed_headers) \
	$(endless_private_installed_headers) \
	$(NULL)
