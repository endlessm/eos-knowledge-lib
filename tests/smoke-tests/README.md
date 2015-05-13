About these Smoke Tests
=======================

To run these test, use the smoke-test-runner which will set up environment
variable appropriately (for the import path for example).

./smoke-test-runner cardSmokeTest.js

Will run against locally build libraries and code, so like out unit test
the library need not be actually installed. The smoke test do currently
support out of tree builds.

*Warning!!!*

These tests are likely to be broken sometimes! We do not maintain these
in sync with our actual library.

If you need to use any of these, feel free to bring them back to life.
Your effort will be appreciated!
