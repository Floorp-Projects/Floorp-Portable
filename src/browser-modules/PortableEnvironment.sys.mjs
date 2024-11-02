/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const appDirPath = Services.dirsvc.get("XREExeF", Ci.nsIFile).parent.path;

export default class PortableEnvironment {
  static async getPortableVersion() {
    return (await IOUtils.readUTF8(
      PathUtils.join(appDirPath, "portable_version.txt")
    )).replaceAll("\r", "").replaceAll("\n", "").replaceAll(" ", "");
  }
}
