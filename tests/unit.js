/* globals
    require
 */

/*
 * With the following two lines, there is no need to add files manually to the
 * karma configuration when adding tests. Adding a new test to the tests/unit/
 * directory is then enough :)
 *
 * Thanks to
 * https://medium.com/information-and-technology/unit-testing-browser-extensions-bdd4e60a4f3d
 * for the tip !
 */

const testsContext = require.context('.', true, /unit\/$/);

testsContext.keys().forEach(testsContext);
