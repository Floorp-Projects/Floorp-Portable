/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const TESTS = [
  ChromeUtils.importESModule("resource:///modules/portable/tests/resource_protocol_list_dir_utils.sys.mjs")
];

export default class PortableTestLauncher {
  doTests() {
    const testResults = [];

    for (const { name, doTest } of TESTS) {
      try {
        doTest();
      } catch (e) {
        console.error(e);
        console.log(`TEST FAILED: ${name}`);
        testResults.push({
          passed: false,
          name: name,
          error: e,
        });
        continue;
      }
      console.log(`TEST PASSED: ${name}`);
      testResults.push({
        passed: true,
        name: name,
        error: null,
      });
    }

    return testResults;
  }
}
