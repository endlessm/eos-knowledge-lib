dnl Copyright 2013 Endless Mobile, Inc.
dnl
dnl Macros to check for GObject introspection libraries

# EOS_PROG_GJS
# ------------
# Checks for the presence of GJS in the path. Issues an error
# if it is not.

AC_DEFUN_ONCE([EOS_PROG_GJS], [
  AC_PATH_PROG([GJS], [gjs], [notfound])
  AS_IF([test "x$GJS" = "xnotfound"],
    [AC_MSG_ERROR([GJS is required, but was not found. If GJS is installed, try passing
its path in an environment variable as GJS=/path/to/gjs.])])
])

# _EOS_GJS_IFELSE(program, [action-if-true], [action-if-false])
# -------------------------------------------------------------
# Comparable to AC_RUN_IFELSE(), but runs the program using GJS
# instead of trying to compile it and link it.

AC_DEFUN([_EOS_GJS_IFELSE], [
  AC_REQUIRE([EOS_PROG_GJS])
  echo "$1" >conftest.js
  $GJS conftest.js >/dev/null 2>&1
  AS_IF([test $? -eq 0], [$2], [$3])
])

# EOS_CHECK_GJS_GIR(<module>, [<version>])
# ------------------------------------
# Example:
# EOS_CHECK_GJS_GIR([Gtk], [3.0])
#
# Check that the GIR <module> is importable in GJS. The API
# version must be at least <version>, if given. Note that the
# API version is different from the release version; GTK
# currently has API version 3.0, but that could mean any
# release from the 3.0, 3.2, 3.4,... series. To check for
# specific API that was added in a later version, use
# EOS_CHECK_GJS_GIR_API.

AC_DEFUN([EOS_CHECK_GJS_GIR], [
  AS_IF([test -z "$2"], [
    AC_MSG_CHECKING([for $1])
    _EOS_GJS_IFELSE([const Library = imports.gi.$1;],
      [AC_MSG_RESULT([yes])],
      [AC_MSG_FAILURE([no])]
    )
  ], [
    AC_MSG_CHECKING([for version $2 of $1])
    _EOS_GJS_IFELSE([
        imports.gi.versions@<:@\"$1\"@:>@ = \"$2\";
        const Library = imports.gi.$1;
      ],
      [AC_MSG_RESULT([yes])],
      [
        AC_MSG_RESULT([no])
        GIRNAME="gir1.2-m4_tolower($1)-$2"
        AC_MSG_ERROR([You do not have at least API version $2 of
the GObject Introspection bindings for the $1 library.
If on Ubuntu, try installing the '$GIRNAME' package.])
      ]
    )
  ])
])

# EOS_CHECK_GJS_GIR_API(<module>, <symbol>)
# -----------------------------------------
# Example:
# EOS_CHECK_GJS_GIR_API([Gtk], [ListBox])
#
# Check that <symbol> is defined inside the GIR <module> and
# is discoverable (not undefined) in GJS.

AC_DEFUN([EOS_CHECK_GJS_GIR_API], [
  AC_MSG_CHECKING([for $1.$2])
  _EOS_GJS_IFELSE([
    const Library = imports.gi.$1;
    if(typeof Library.$2 === 'undefined')
      throw 1;
  ],
  [AC_MSG_RESULT([yes])],
  [
    AC_MSG_RESULT([no])
    AC_MSG_ERROR([Your GObject Introspection bindings for
the $1 library do not define the symbol $1.$2.
Perhaps you need a newer version of the library?])
  ])
])

