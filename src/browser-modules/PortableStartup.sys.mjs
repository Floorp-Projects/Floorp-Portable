/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

export const EXPORTED_SYMBOLS = ["isFirstRun", "isUpdated", "isMainBrowser"];

import PortableEnvironment from "resource:///modules/portable/PortableEnvironment.sys.mjs";

if (PortableEnvironment.isMainBrowser) {
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
