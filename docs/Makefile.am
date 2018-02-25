## Process this file with automake to produce Makefile.in

# Copyright 2017 Endless Mobile, Inc.

EXTRA_DIST = \
	api/domain.md \
	api/flatpak-bundle.md \
	api/hotdoc.json \
	api/index.md \
	api/sitemap.txt \
	framework/concepts/index.md \
	framework/concepts/yaml_format.md \
	framework/hotdoc.json \
	framework/index.md \
	framework/modules.md \
	framework/modules/window.md \
	framework/sitemap.txt \
	framework/tools.md \
	framework/tutorial/index.md \
	framework/tutorial/ingester.md \
	framework/tutorial/ingester-full-code.md \
	framework/tutorial/install.md \
	$(NULL)

HOTDOC_PROJECTS = framework

framework_HOTDOC_FLAGS = \
	--conf-file $(abs_srcdir)/framework/hotdoc.json \
	-o $(abs_builddir)/framework/built \
	--mf-introspect-utility $(abs_top_builddir)/tools/introspect-local \
	$(FRAMEWORK_EXTRA_HOTDOC_FLAGS) \
	$(NULL)

if ENABLE_DOCUMENTATION
-include $(HOTDOC_MAKEFILE)
endif ENABLE_DOCUMENTATION
