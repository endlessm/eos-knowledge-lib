#!/bin/bash

trap "rm -f actual.json" EXIT

input="$G_TEST_SRCDIR/../$1"
expected=${input/.yaml/.json}
"$G_TEST_SRCDIR/../autobahn" "$input" -o actual.json
diff -u "$expected" actual.json
