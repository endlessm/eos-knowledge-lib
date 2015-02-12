## Copyright 2014 Endless Mobile, Inc.
## Included in toplevel Makefile.am

jsdir = $(pkgdatadir)/js

search_files = \
	js/search/EosKnowledgeSearch.js \
	js/search/articleObjectModel.js \
	js/search/blacklist.js \
	js/search/contentObjectModel.js \
	js/search/datadir.js \
	js/search/engine.js \
	js/search/mediaObjectModel.js \
	js/search/searchProvider.js \
	js/search/searchUtils.js \
	js/search/treeNode.js \
	js/search/xapianQuery.js \
	$(NULL)
searchdir = $(jsdir)/search
dist_search_DATA = $(search_files)

EXTRA_DIST += js/ekn-app-runner js/ekn-search-provider
bin_SCRIPTS += js/ekn-app-runner js/ekn-search-provider
