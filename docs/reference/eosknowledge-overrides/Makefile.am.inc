if ENABLE_JS_DOC

build_overridedocs_verbose = $(build_overridedocs_verbose_@AM_V@)
build_overridedocs_verbose_ = $(build_overridedocs_verbose_@AM_DEFAULT_V@)
build_overridedocs_verbose_0 = @echo '  DOC    Building JS overrides docs';

## $(public_overrides) defined in overrides/Makefile.am.inc
overridedocs_input_files = $(public_overrides) $(reader_overrides)
# Stamp file is present if all the docs have been built, and carries the
# timestamp of the last successful build.
override_stamp_file = docs/reference/eosknowledge-overrides/doc-build.stamp

$(override_stamp_file): $(overridedocs_input_files) docs/reference/eosknowledge-overrides/eos.css
	$(build_overridedocs_verbose)$(MKDIR_P) $(@D)/html && \
	naturaldocs -i $(<D) -o HTML $(@D)/html -p $(@D) -s Default eos -hl All && \
	touch $@

dist_noinst_DATA += $(override_stamp_file)

overridedocs_extra_clean_files = \
	docs/reference/eosknowledge-overrides/Data/*.nd \
	docs/reference/eosknowledge-overrides/Menu.txt \
	docs/reference/eosknowledge-overrides/Topics.txt \
	docs/reference/eosknowledge-overrides/Languages.txt \
	$(NULL)
EXTRA_DIST += docs/reference/eosknowledge-overrides/eos.css
CLEANFILES += $(override_stamp_file)
DISTCLEANFILES += \
	$(overridedocs_extra_clean_files) \
	$(NULL)

distclean-local::
	@rm -rf docs/reference/eosknowledge-overrides/html

# Copy from $builddir first, and if that's not there (for example during
# distcheck the docs don't get rebuilt because the stamp file is already there
# and the source files are not newer) copy from $srcdir.
dist-hook::
	@mkdir -p $(distdir)/docs/reference/eosknowledge-overrides/html
	@if test -d docs/reference/eosknowledge-overrides/html; then \
		cp -r docs/reference/eosknowledge-overrides/html/* $(distdir)/docs/reference/eosknowledge-overrides/html; \
	elif test -d $(srcdir)/docs/reference/eosknowledge-overrides/html; then \
		cp -r $(srcdir)/docs/reference/eosknowledge-overrides/html/* $(distdir)/docs/reference/eosknowledge-overrides/html; \
	fi

endif
