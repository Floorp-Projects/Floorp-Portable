/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

export const EXPORTED_SYMBOLS = ["isFirstRun", "isUpdated", "isMainBrowser"];

import { AppConstants } from "resource://gre/modules/AppConstants.sys.mjs";

export const isFirstRun = !Services.prefs.getStringPref(
  "browser.startup.homepage_override.mstone",
  null,
);

export const isUpdated = (function () {
  const nowVersion = AppConstants.MOZ_APP_VERSION_DISPLAY;
  const oldVersionPref = Services.prefs.getStringPref(
    "floorp.portable.startup.oldVersion",
    null,
  );

  Services.prefs.setStringPref("floorp.portable.startup.oldVersion", nowVersion);

  return oldVersionPref !== nowVersion && !isFirstRun;
})();

export const isMainBrowser = Services.env.get("MOZ_BROWSER_TOOLBOX_PORT") === "";

if (isMainBrowser) {
  try {
    ChromeUtils.importESModule("resource:///modules/portable/PortableAboutPage.sys.mjs");
  } catch (e) {
    console.error(e);
  }

  if (Services.prefs.getBoolPref("floorp.portable.enabled", false)) {
    try {
      ChromeUtils.importESModule("resource:///modules/portable/PortableInjections.sys.mjs");
    } catch (e) {
      console.error(e);
    }

    if (Services.prefs.getBoolPref("floorp.portable.update.enabled", false)) {
      try {
        ChromeUtils.importESModule("resource:///modules/portable/PortableUpdate.sys.mjs");
      } catch (e) {
        console.error(e);
      }
    }
  }
}
