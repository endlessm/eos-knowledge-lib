GLIB_COMPILE_RESOURCES = glib-compile-resources
srcdir = .
builddir = .

all: test.gresource

resource_files = $(shell $(GLIB_COMPILE_RESOURCES) --sourcedir=$(srcdir) --generate-dependencies $(srcdir)/test.gresource.xml)
test.gresource: test.gresource.xml $(resource_files)
	$(GLIB_COMPILE_RESOURCES) --target=$@ --sourcedir=$(srcdir)  $<

clean:
	rm -f test.gresource

.PHONY: all clean
