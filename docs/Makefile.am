## Process this file with automake to produce Makefile.in

# Copyright 2017 Endless Mobile, Inc.

EXTRA_DIST = \
	api/domain.md \
	api/flatpak-bundle.md \
	api/hotdoc.json \
	api/index.md \
	api/sitemap.txt \
	framework/concepts/custom_modules.md \
	framework/concepts/index.md \
	framework/concepts/presets.md \
	framework/concepts/yaml_format.md \
	framework/hotdoc.json \
	framework/images/ccapp-logo.png \
	framework/images/ccapp-screenshot1.png \
	framework/images/ccapp-screenshot2.png \
	framework/images/ccapp-screenshot3.png \
	framework/images/ccapp-screenshot4.png \
	framework/images/hatch-previewer-screenshot.png \
	framework/images/presets/blog.svg \
	framework/images/presets/course.svg \
	framework/images/presets/encyclopedia.svg \
	framework/images/presets/exploration.svg \
	framework/images/presets/gallery.svg \
	framework/images/presets/library-list.svg \
	framework/images/presets/library.svg \
	framework/images/presets/news.svg \
	framework/images/presets/thematic.svg \
	framework/images/presets/video_list.svg \
	framework/index.md \
	framework/modules.md \
	framework/modules/banner.md \
	framework/modules/window.md \
	framework/sitemap.txt \
	framework/theme/templates/navbar_center.html \
	framework/tools.md \
	framework/tutorial/app-full-code.md \
	framework/tutorial/app.md \
	framework/tutorial/index.md \
	framework/tutorial/ingester-full-code.md \
	framework/tutorial/ingester.md \
	framework/tutorial/install.md \
	framework/tutorial/shard-full-code.md \
	framework/tutorial/shard.md \
	$(NULL)

HOTDOC_PROJECTS = framework

framework_HOTDOC_FLAGS = \
	--conf-file $(abs_srcdir)/framework/hotdoc.json \
	-o $(abs_builddir)/framework/built \
	--html-theme $(EOS_HOTDOC_THEME_DIR) \
	--mf-introspect-utility $(abs_top_builddir)/tools/introspect-local \
	$(FRAMEWORK_EXTRA_HOTDOC_FLAGS) \
	$(NULL)

if ENABLE_DOCUMENTATION
-include $(HOTDOC_MAKEFILE)
endif ENABLE_DOCUMENTATION
