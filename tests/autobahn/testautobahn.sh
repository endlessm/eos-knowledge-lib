#!/bin/bash

input=`readlink -f "$1"`
expected=${input/.yaml/.json}
"$G_TEST_SRCDIR/../autobahn" "$input" | diff -u "$expected" -
