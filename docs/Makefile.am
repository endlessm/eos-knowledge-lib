## Process this file with automake to produce Makefile.in

# Copyright 2017 Endless Mobile, Inc.

EXTRA_DIST = \
	api/domain.md \
	api/flatpak-bundle.md \
	api/hotdoc.json \
	api/index.md \
	api/sitemap.txt \
	framework/hotdoc.json \
	framework/index.md \
	framework/modules.md \
	framework/modules/window.md \
	framework/sitemap.txt \
	framework/tools.md \
	$(NULL)

HOTDOC_PROJECTS = framework

framework_HOTDOC_FLAGS = \
	--conf-file $(abs_srcdir)/framework/hotdoc.json \
	-o $(abs_builddir)/framework/built \
	--html-theme $(datadir)/eos-hotdoc-theme \
	--mf-introspect-utility $(abs_top_builddir)/tools/introspect-local \
	$(FRAMEWORK_EXTRA_HOTDOC_FLAGS) \
	$(NULL)

if ENABLE_DOCUMENTATION
-include $(HOTDOC_MAKEFILE)
endif ENABLE_DOCUMENTATION
