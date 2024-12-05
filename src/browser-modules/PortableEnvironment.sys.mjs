/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { AppConstants } from "resource://gre/modules/AppConstants.sys.mjs";

const appDirPath = Services.dirsvc.get("XREExeF", Ci.nsIFile).parent.path;

const isFirstRun_ = !Services.prefs.getStringPref(
  "browser.startup.homepage_override.mstone",
  null,
);

export default class PortableEnvironment {
  static async getPortableVersion() {
    return (await IOUtils.readUTF8(
      PathUtils.join(appDirPath, "portable_version.txt")
    )).replaceAll("\r", "").replaceAll("\n", "").replaceAll(" ", "");
  }
  static isFirstRun() {
    return isFirstRun_
  };
  static async isUpdated() {
    const nowVersion = await this.getPortableVersion();
    const oldVersionPref = Services.prefs.getStringPref(
      "floorp.portable.startup.oldVersion",
      null,
    );

    Services.prefs.setStringPref("floorp.portable.startup.oldVersion", nowVersion);

    return oldVersionPref !== nowVersion && !this.isFirstRun;
  };
  static isMainBrowser() {
    return Services.env.get("MOZ_BROWSER_TOOLBOX_PORT") === "";
  };
  static clearStartupCache() {
    // The startup cache will be cleared on the next startup.
    Services.appinfo.invalidateCachesOnRestart();
  };
}
