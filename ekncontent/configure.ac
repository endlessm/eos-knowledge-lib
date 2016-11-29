# Process this file with autoconf to produce configure

# Copyright 2016 Endless Mobile, Inc.

# ------------
# configure.ac
# ------------
# Please keep this file well-commented. Autotools involve a lot of magical
# incantations, and it is easy to mess things up if you don't know what you
# are doing.

# API name and version for pkg-config; increment when breaking API/ABI.
# This version number is also the major version number.
m4_define([_EKN_CONTENT_API_VERSION_MACRO], [0])

# Minor and micro versions: increment micro version when making a release. Minor
# version is even for a stable release and odd for a development release.
# When making any release, if the API changes, set the interface age to 0.
m4_define([_EKN_CONTENT_MINOR_VERSION_MACRO], [0])
m4_define([_EKN_CONTENT_MICRO_VERSION_MACRO], [0])
m4_define([_EKN_CONTENT_INTERFACE_AGE_MACRO], [0])

# Full version, for use in AC_INIT
m4_define([_EKN_CONTENT_VERSION_MACRO],
    [_EKN_CONTENT_API_VERSION_MACRO._EKN_CONTENT_MINOR_VERSION_MACRO._EKN_CONTENT_MICRO_VERSION_MACRO])


# Initialization
# --------------
# Initialize Autoconf: package name, version, bug report address, tarball name,
# website
AC_INIT([Endless OS Knowledge Content Library], [_EKN_CONTENT_VERSION_MACRO],
    [], [eos-knowledge-content], [http://endlessm.com])
# Verify that the source directory can be found
AC_CONFIG_SRCDIR([ekncontent/eknc-utils.h])
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

# Variables to define
# -------------------
# Version numbers and macros
EKN_CONTENT_API_VERSION=_EKN_CONTENT_API_VERSION_MACRO
AC_SUBST(EKN_CONTENT_API_VERSION)
EKN_CONTENT_API_NAME="eos-knowledge-content-$EKN_CONTENT_API_VERSION"
AC_SUBST(EKN_CONTENT_API_NAME)
EKN_CONTENT_INTERFACE_AGE=_EKN_CONTENT_INTERFACE_AGE_MACRO
AC_SUBST([EKN_CONTENT_MAJOR_VERSION], [_EKN_CONTENT_API_VERSION_MACRO])
AC_SUBST([EKN_CONTENT_MINOR_VERSION], [_EKN_CONTENT_MINOR_VERSION_MACRO])
AC_SUBST([EKN_CONTENT_MICRO_VERSION], [_EKN_CONTENT_MICRO_VERSION_MACRO])
AC_DEFINE([EKN_CONTENT_VERSION], [_EKN_CONTENT_VERSION_MACRO], [Full version number])

# Before making a release, the EKN_CONTENT_LT_VERSION_INFO string should be modified. The
# string is of the form c:r:a. Follow these instructions sequentially:
#   1. If the library source code has changed at all since the last update, then
#      increment revision (‘c:r:a’ becomes ‘c:r+1:a’).
#   2. If any interfaces have been added, removed, or changed since the last
#      update, increment current, and set revision to 0.
#   3. If any interfaces have been added since the last public release, then
#      increment age.
#   4. If any interfaces have been removed or changed since the last public
#      release, then set age to 0.
AC_SUBST([EKN_CONTENT_LT_VERSION_INFO],[0:0:0])

# Required build tools
# --------------------
# Make sure we can create directory hierarchies
AC_PROG_MKDIR_P
# C compiler
AC_PROG_CC
AC_PROG_CC_C99
# Library configuration tool
PKG_PROG_PKG_CONFIG
# Gtk-doc; 0.18 required for Markdown parsing
GTK_DOC_CHECK([1.18])
# GObject Introspection
GOBJECT_INTROSPECTION_REQUIRE([1.30])
# Various tools
AC_PROG_AWK  # needed for TAP driver
AC_PROG_SED  # needed for finding files for coverage
AC_REQUIRE_AUX_FILE([tap-driver.sh])
AC_PATH_PROG([GIO_QUERYMODULES], [gio-querymodules], [notfound])
AS_IF([test x$GIO_QUERYMODULES = xnotfound], [AC_MSG_ERROR([gio-querymodules not found.
Try installing "glib" package.])])

AC_CACHE_SAVE

# Check that the compiler really supports C99
AS_IF([test "x$ac_cv_prog_cc_c99" = "xno"], [AC_MSG_ERROR([C99 is required.])])

AX_COMPILER_FLAGS

# JASMINE_JUNIT_REPORTS_DIR: Where to put test reports
AC_MSG_CHECKING([where to put test reports])
AC_ARG_VAR([JASMINE_JUNIT_REPORTS_DIR], [Where to put test reports])
AS_IF([test -n "$JASMINE_JUNIT_REPORTS_DIR"],
    [JASMINE_REPORT_ARGUMENT="--junit $JASMINE_JUNIT_REPORTS_DIR/\$\${log/%.log/.js.xml}"
    AC_MSG_RESULT([in $JASMINE_JUNIT_REPORTS_DIR])],
    [JASMINE_REPORT_ARGUMENT=
    AC_MSG_RESULT([nowhere])])
AC_SUBST([JASMINE_REPORT_ARGUMENT])

# Package dependencies
# Update these whenever you use a function that requires a certain API version
AX_PKG_CHECK_MODULES([EKN_CONTENT], [glib-2.0 gio-2.0 gobject-2.0], [eos-shard-0 >= 0.1.2])
AX_PKG_CHECK_MODULES([EKN_VFS], [], [eos-shard-0 gio-2.0 gmodule-2.0])

# Code Coverage
# -------------
AX_CODE_COVERAGE

AC_CACHE_SAVE

# Output
# ------
# List files here that the configure script should output
AC_CONFIG_FILES([
    Makefile
    ekncontent/eknc-version.h
    $EKN_CONTENT_API_NAME.pc:eos-knowledge-content.pc.in
    docs/reference/ekncontent/Makefile
    docs/reference/ekncontent/version.xml
])

# Do the output
AC_OUTPUT
