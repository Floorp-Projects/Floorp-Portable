/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const TESTS = [
  ChromeUtils.importESModule("resource:///modules/portable/tests/resource_protocol_list_dir_utils.sys.mjs")
];

export default class PortableTestLauncher {
  testSuccess = false;
  testFailed = false;
  doTests() {
    this.testSuccess = false;
    this.testFailed = false;
    for (const { doTest } of TESTS) {
      try {
        doTest();
      } catch (e) {
        console.error(e);
        this.testFailed = true;
        return;
      }
    }
    this.testSuccess = true;
  }
}
