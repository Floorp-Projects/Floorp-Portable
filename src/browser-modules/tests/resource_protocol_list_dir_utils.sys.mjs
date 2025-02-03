/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import ResourceProtocolListDirUtils from "resource:///modules/portable/ResourceProtocolListDirUtils.mjs";
import { Assert } from "resource:///modules/portable/PortableTestUtils.sys.mjs";

export function doTest() {
  Assert.exceptError(() => {
    const uri = "invalid";
    new ResourceProtocolListDirUtils(uri);
  });

  Assert.exceptError(() => {
    const uri = "https://example.org";
    new ResourceProtocolListDirUtils(uri);
  });

  const uri = "resource:///modules/portable/";
  const instance = new ResourceProtocolListDirUtils(uri);

  // Definition information must be defined.
  Assert.exceptError(() => {
    const test_data =
`201: META-INF/ 0 Mon,%2031%20Dec%201979%2015:00:00%20GMT DIRECTORY
`;
    instance.parseIndexedResponse(test_data);
  });

  // The number of actual values differs from the number of values in the definition information.
  Assert.exceptError(() => {
    const test_data =
`200: filename content-length last-modified file-type invalid
201: META-INF/ 0 Mon,%2031%20Dec%201979%2015:00:00%20GMT DIRECTORY
`;
    instance.parseIndexedResponse(test_data);
  });

  const test_data =
`200: filename content-length last-modified file-type
201: META-INF/ 0 Mon,%2031%20Dec%201979%2015:00:00%20GMT DIRECTORY
201: chrome.manifest 72 Thu,%2031%20Dec%202009%2015:00:00%20GMT FILE
`;
  const list = instance.parseIndexedResponse(test_data);

  Assert.equal(
    list.length,
    2,
  );

  const item = list[0];

  Assert.equal(
    Object.keys(item).length,
    4,
  );

  Assert.ok(
    Object.keys(item).every(key =>
      ["filename", "content-length", "last-modified", "file-type"].includes(key))
  );

  Assert.ok(
    item["filename"] == "META-INF/" &&
    item["content-length"] == "0" &&
    item["last-modified"] == "Mon, 31 Dec 1979 15:00:00 GMT" &&
    item["file-type"] == "DIRECTORY"
  );
}
