#!/bin/bash

input="$G_TEST_SRCDIR/../$1"
expected=${input/.yaml/.json}
"$G_TEST_SRCDIR/../autobahn" "$input" | diff -u "$expected" -
