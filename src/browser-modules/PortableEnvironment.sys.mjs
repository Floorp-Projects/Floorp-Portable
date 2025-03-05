/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

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
  };
  static async getFullVersion() {
    const current_browser_version = AppConstants.MOZ_APP_VERSION_DISPLAY;
    const current_portable_version = await this.getPortableVersion();
    return `${current_browser_version}-${current_portable_version}`;
  }
  static isFirstRun() {
    return isFirstRun_
  };
  static async isUpdated() {
    const nowVersion = await this.getPortableVersion();
    const oldVersionPref = Services.prefs.getStringPref(
      "portable.startup.oldVersion",
      null,
    );

    Services.prefs.setStringPref("portable.startup.oldVersion", nowVersion);

    return oldVersionPref !== nowVersion && !this.isFirstRun;
  };
  static isMainBrowser() {
    return Services.env.get("MOZ_BROWSER_TOOLBOX_PORT") === "";
  };
  static clearStartupCache() {
    // The startup cache will be cleared on the next startup.
    Services.appinfo.invalidateCachesOnRestart();
  };
  static isSafeFilePath(path){
    try {
      // Example errors
      // PathUtils.splitRelative: PathUtils.splitRelative: Empty directory components ("") not allowed by options
      // PathUtils.splitRelative: PathUtils.splitRelative: Parent directory components ("..") not allowed by options
      // PathUtils.splitRelative: PathUtils.splitRelative requires a relative path
      PathUtils.splitRelative(path, {
        allowEmpty: false,
        allowCurrentDir: false,
        allowParentDir: false,
      });
    } catch (e) {
      return false;
    }
    return true;
  };
  static async validateBase64(base64) {
    return /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/.test(base64);
  }
  static async base64ToArrayBuffer(base64) {
    return await (await fetch(`data:application/octet-stream;base64,${base64}`)).arrayBuffer();
  }
}
