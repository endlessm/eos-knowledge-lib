## Copyright 2014 Endless Mobile, Inc.
## Included in toplevel Makefile.am

jsdir = $(pkgdatadir)/js

search_files = \
	js/search/EosKnowledgeSearch.js \
	js/search/articleObjectModel.js \
	js/search/contentObjectModel.js \
	js/search/engine.js \
	js/search/mediaObjectModel.js \
	js/search/searchProvider.js \
	js/search/treeNode.js \
	$(NULL)
searchdir = $(jsdir)/search
dist_search_DATA = $(search_files)

# Standalone ekn-app-runner bin script
EXTRA_DIST += js/ekn-app-runner
bin_SCRIPTS += js/ekn-app-runner
