if ENABLE_JS_DOC

build_naturaldocs_verbose = $(build_naturaldocs_verbose_@AM_V@)
build_naturaldocs_verbose_ = $(build_naturaldocs_verbose_@AM_DEFAULT_V@)
build_naturaldocs_verbose_0 = @echo '  DOC    Building naturaldocs for $(naturaldocs_input_dir)';

# Stamp file is present if all the docs have been built, and carries the
# timestamp of the last successful build.
stamp_file = doc-build.stamp

$(stamp_file): eos.css
	$(build_naturaldocs_verbose)$(MKDIR_P) html && \
	naturaldocs -o HTML html -p . -s Default eos -hl All \
				-i $(top_srcdir)/js/search \
				-i $(top_builddir)/js/search \
				-i $(top_srcdir)/overrides \
				-i $(top_builddir)/overrides && \
	touch $@

dist_noinst_DATA = $(stamp_file)

naturaldocs_extra_clean_files = \
	Data/*.nd \
	Menu.txt \
	Topics.txt \
	Languages.txt \
	$(NULL)
EXTRA_DIST = eos.css
CLEANFILES = $(stamp_file)
DISTCLEANFILES = \
	$(naturaldocs_extra_clean_files) \
	$(NULL)

distclean-local::
	@rm -rf html

# Copy from $builddir first, and if that's not there (for example during
# distcheck the docs don't get rebuilt because the stamp file is already there
# and the source files are not newer) copy from $srcdir.
dist-hook::
	@mkdir -p $(distdir)/html
	@if test -d html; then \
		cp -r html/* $(distdir)/html; \
	elif test -d $(srcdir)/html; then \
		cp -r $(srcdir)/html/* $(distdir)/html; \
	fi

endif
