dnl Process this file with autoconf to produce configure

# Copyright 2014 Endless Mobile, Inc.

dnl ------------
dnl configure.ac
dnl ------------
dnl Please keep this file well-commented. Autotools involve a lot of magical
dnl incantations, and it is easy to mess things up if you don't know what you
dnl are doing.

# Version numbers
# ---------------
# API name and version for pkg-config; increment when breaking API/ABI.
# This version number is also the major version number.
m4_define([_EKN_API_VERSION_MACRO], [0])

# Minor and micro versions: increment micro version when making a release. Minor
# version is even for a stable release and odd for a development release.
# When making any release, if the API changes, set the interface age to 0.
m4_define([_EKN_MINOR_VERSION_MACRO], [4])
m4_define([_EKN_MICRO_VERSION_MACRO], [0])
m4_define([_EKN_INTERFACE_AGE_MACRO], [0])

# Full version, for use in AC_INIT
m4_define([_EKN_VERSION_MACRO],
    [_EKN_API_VERSION_MACRO._EKN_MINOR_VERSION_MACRO._EKN_MICRO_VERSION_MACRO])

# Initialization
# --------------
# Initialize Autoconf: package name, version, bug report address, tarball name,
# website
AC_INIT([Endless OS Knowledge GUI Library], [_EKN_VERSION_MACRO],
    [], [eos-knowledge], [http://endlessm.com])
# Verify that the source directory can be found
AC_CONFIG_SRCDIR([lib/eosknowledgeprivate/ekn-util.h])
# Initialize Automake: enable all warnings and do not insist on GNU standards
# no-portability suppresses warnings about syntax specific to GNU make
# parallel-tests specifies that we use the new parallel-running test harness.
# Unlike serial-tests, this option is accepted by Automake 1.11
# tar-ustar is required because there may be files whose entire paths exceed
# 99 characters.
# subdir-objects is for forward compatibility with Automake 2.0 and can be
# removed when we upgrade to that version.
AM_INIT_AUTOMAKE([-Wall -Wno-portability foreign 1.11 parallel-tests tar-ustar subdir-objects])
# Avoid spewing garbage over the terminal ('make V=1' to see the garbage)
AM_SILENT_RULES([yes])
# Initialize Libtool; don't build static libraries
LT_INIT([disable-static])
# Keep Autotools macros local to this source tree
AC_CONFIG_MACRO_DIR([m4])

AC_CACHE_SAVE

# Gettext package name
AC_SUBST([GETTEXT_PACKAGE], ["$PACKAGE"])
AC_DEFINE_UNQUOTED(GETTEXT_PACKAGE, ["$GETTEXT_PACKAGE"],
    [Package name for Gettext])
# Detect which languages are available
AS_ALL_LINGUAS

# Required build tools
# --------------------
# Make sure we can create directory hierarchies
AC_PROG_MKDIR_P
# Make sure we can symlink
AC_PROG_LN_S
AS_IF([test "$LN_S" = "ln -s"], [], [AC_MSG_ERROR([Symlink support required.])])
# C compiler
AC_PROG_CC
AC_PROG_CC_C99
# Make sure the C compiler supports per-target CFLAGS
AM_PROG_CC_C_O
# Library configuration tool
PKG_PROG_PKG_CONFIG
# Gettext
AM_GNU_GETTEXT([external])
AM_GNU_GETTEXT_VERSION([0.18.1])
# GObject Introspection
GOBJECT_INTROSPECTION_REQUIRE([1.30])
# Various tools
AC_PROG_AWK  # needed for TAP driver
AC_PROG_SED  # needed for finding files for coverage
AC_REQUIRE_AUX_FILE([tap-driver.sh])
AC_PATH_PROG([NATURALDOCS], [naturaldocs], [notfound])
AC_ARG_VAR([NATURALDOCS], [Path to naturaldocs])
AC_SUBST([GLIB_COMPILE_RESOURCES], [`$PKG_CONFIG --variable glib_compile_resources gio-2.0`])
AC_PATH_PROG([SCSS], [scss], [notfound])
AS_IF([test x$SCSS = xnotfound], [AC_MSG_ERROR([SCSS compiler not found.
Try installing the "sass" Ruby gem or its equivalent package.])])
AC_ARG_VAR([SCSS], [Path to SCSS compiler])
AC_MSG_CHECKING([whether SCSS compiler supports compass])
AS_IF([scss --compass], [AC_MSG_RESULT([yes])],
    [AC_MSG_ERROR([SCSS compiler does not have Compass support.
Try installing the "compass" Ruby gem or its equivalent package.])])

AC_CACHE_SAVE

# Check that the compiler really supports C99
AS_IF([test "x$ac_cv_prog_cc_c99" = "xno"], [AC_MSG_ERROR([C99 is required.])])

# Configure options
# -----------------
# --enable-strict-flags: Compile with strict compiler flags. Done automatically
# during 'make distcheck'.
AC_ARG_ENABLE([strict-flags],
    [AS_HELP_STRING([--enable-strict-flags=@<:@no/yes/error@:>@],
        [Use strict compiler flags @<:@default=no@:>@])],
    [],
    [enable_strict_flags=no])
# Emmanuele's list of flags
STRICT_COMPILER_FLAGS="$STRICT_COMPILER_FLAGS
    -Wall
    -Wcast-align
    -Wuninitialized
    -Wno-strict-aliasing
    -Werror=pointer-arith
    -Werror=missing-declarations
    -Werror=redundant-decls
    -Werror=empty-body
    -Werror=format
    -Werror=format-security
    -Werror=format-nonliteral
    -Werror=init-self"
AS_CASE([$enable_strict_flags],
    [yes],
        [AS_COMPILER_FLAGS([STRICT_CFLAGS], [$STRICT_COMPILER_FLAGS])],
    [no],
        [],
        [error],
        [
            STRICT_COMPILER_FLAGS="$STRICT_COMPILER_FLAGS -Werror"
            AS_COMPILER_FLAGS([STRICT_CFLAGS], [$STRICT_COMPILER_FLAGS])
        ],
    [AC_MSG_ERROR([Invalid option for --enable-strict-flags])])
AC_SUBST([STRICT_CFLAGS])

# --enable-js-doc: Build pure Javascript module documentation.
AC_ARG_ENABLE([js-doc],
    [AS_HELP_STRING([--enable-js-doc],
        [Build documentation for pure Javascript modules @<:@default=no@:>@])])
AS_IF([test "x$enable_js_doc" = "xyes"], [
    AS_IF([test "x$NATURALDOCS" = "xnotfound"],
        [AC_MSG_ERROR([NaturalDocs must be installed for --enable-js-doc])])])
AM_CONDITIONAL([ENABLE_JS_DOC], [test "x$enable_js_doc" = "xyes"])

# --enable-inspector: Allow opening the WebKit inspector in the webviews by
# right-clicking
AC_ARG_ENABLE([inspector], AS_HELP_STRING([--enable-inspector],
    [Allow activating WebKit inspector on HTML pages (default=no)]))
AS_IF([test "x$enable_inspector" != "xyes"], [inspector=false], [inspector=true])
AC_SUBST([inspector])

# --disable-metrics: Don't send metrics to Endless, and don't require the
# optional eos-metrics dependency
AC_ARG_ENABLE([metrics], AS_HELP_STRING([--disable-metrics],
    [Sending metrics requires eos-metrics dependency (default=yes)]))
AS_IF([test "x$enable_metrics" != "xno"], [metrics=true], [metrics=false])
AC_SUBST([metrics])

# --with-mathjax-dir: Use mathjax from a location besides the default /usr/share
AC_ARG_WITH([mathjax-dir], AS_HELP_STRING([--with-mathjax-dir],
    [Use mathjax from a location besides the default /usr/share]),
    [MATHJAXDIR=$withval],
    [MATHJAXDIR=/usr/share/javascript/mathjax])
AC_MSG_CHECKING([for mathjax javsacript library])
if test -d $MATHJAXDIR; then
    AC_MSG_RESULT([yes])
    AC_SUBST([MATHJAXDIR])
else
    AC_MSG_ERROR([Cannot find mathjax package])
fi

# JASMINE_JUNIT_REPORTS_DIR: Where to put test reports
AC_MSG_CHECKING([where to put test reports])
AC_ARG_VAR([JASMINE_JUNIT_REPORTS_DIR], [Where to put test reports])
AS_IF([test -n "$JASMINE_JUNIT_REPORTS_DIR"],
    [JASMINE_REPORT_ARGUMENT="--junit $JASMINE_JUNIT_REPORTS_DIR/\$\${log/%.log/.js.xml}"
    AC_MSG_RESULT([in $JASMINE_JUNIT_REPORTS_DIR])],
    [JASMINE_REPORT_ARGUMENT=
    AC_MSG_RESULT([nowhere])])
AC_SUBST([JASMINE_REPORT_ARGUMENT])

# Required libraries
# ------------------
# Update these whenever you use a function that requires a certain API version
PKG_CHECK_MODULES([EOS_KNOWLEDGE_PRIVATE], [
    glib-2.0
    gobject-2.0
    gio-2.0
    gtk+-3.0 >= 3.12
    webkit2gtk-4.0
])
PKG_CHECK_MODULES([GRESOURCE_PLUGIN], [
    gio-2.0
    glib-2.0
    gmodule-2.0
    webkit2gtk-4.0
])
PKG_CHECK_MODULES([TOOLTIP_PLUGIN], [
    glib-2.0
    gmodule-2.0
    gio-2.0
    webkit2gtk-4.0
    javascriptcoregtk-4.0
])
PKG_CHECK_MODULES([SCROLL_PLUGIN], [
    glib-2.0
    gmodule-2.0
    gio-2.0
    webkit2gtk-4.0
])

# Check installed GIRs for Javascript overrides
EOS_CHECK_GJS_GIR([Endless], [0])
EOS_CHECK_GJS_GIR([EosShard], [0])
EOS_CHECK_GJS_GIR([EvinceDocument], [3.0])
EOS_CHECK_GJS_GIR([EvinceView], [3.0])
EOS_CHECK_GJS_GIR([Gdk], [3.0])
EOS_CHECK_GJS_GIR([GLib], [2.0])
EOS_CHECK_GJS_GIR([GObject], [2.0])
EOS_CHECK_GJS_GIR([Gtk], [3.0])
EOS_CHECK_GJS_GIR([Pango], [1.0])
EOS_CHECK_GJS_GIR([WebKit2], [4.0])
EOS_CHECK_GJS_GIR_API([Gdk], [Rectangle])

# Code Coverage
# -------------
EOS_COVERAGE_REPORT([c js])

AC_CACHE_SAVE

# Output
# ------
dnl List files here that the configure script should output
AC_CONFIG_FILES([
    Makefile
    data/eos-knowledge-0.pc
    po/Makefile.in
    js/app/config.js.in
])
AC_CONFIG_HEADERS([config.h])  dnl Header with system-dependent #defines
# Make docs/reference/js/eos.css available in the build tree
# as well as the source tree
AC_CONFIG_LINKS([
    docs/reference/js/eos.css:docs/reference/js/eos.css
])
# Do the output
AC_OUTPUT
