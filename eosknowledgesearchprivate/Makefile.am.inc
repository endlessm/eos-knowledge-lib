
lib_LTLIBRARIES += libeosknowledgesearchprivate.la
libeosknowledgesearchprivate_la_SOURCES = \
        eosknowledgesearchprivate/ekns-subtree-dispatcher.c \
        eosknowledgesearchprivate/ekns-subtree-dispatcher.h

libeosknowledgesearchprivate_la_CPPFLAGS = @EOS_KNOWLEDGE_CFLAGS@
libeosknowledgesearchprivate_la_CFLAGS = $(AM_CFLAGS)
libeosknowledgesearchprivate_la_LIBADD = @EOS_KNOWLEDGE_LIBS@
