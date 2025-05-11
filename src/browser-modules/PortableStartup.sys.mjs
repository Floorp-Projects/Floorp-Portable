/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

export const EXPORTED_SYMBOLS = ["isFirstRun", "isUpdated", "isMainBrowser"];

import PortableEnvironment from "resource:///modules/portable/PortableEnvironment.sys.mjs";
import SessionStore from "resource:///modules/sessionstore/SessionStore.sys.mjs";

if (PortableEnvironment.isMainBrowser) {
  SessionStore.promiseAllWindowsRestored.then(() => {
    const win = Services.wm.getMostRecentWindow("navigator:browser");
    const notificationBox = win.gBrowser.getNotificationBox(
      win.gBrowser.selectedBrowser
    );
    notificationBox.appendNotification(
      "Floorp-Portable-end",
      {
        label:
          "End of Floorp Portable v1 Support. Please use Floorp Portable v2 for the latest version.",
        priority: 7,
      },
      [
        {
          label: "Learn More",
          popup: null,
          callback: () => {
            win.gBrowser.addTab(
              "https://blog.floorp.app/notice/end-of-support-portable-v1.html",
              {
                triggeringPrincipal:
                  Services.scriptSecurityManager.getSystemPrincipal(),
                inBackground: false,
              }
            );
            notificationBox.removeNotification("Floorp-Portable-end");
          },
        },
      ]
    );
  });

  // try {
  //   ChromeUtils.importESModule(
  //     "resource:///modules/portable/PortableAboutPage.sys.mjs"
  //   );
  // } catch (e) {
  //   console.error(e);
  // }

  // if (Services.prefs.getBoolPref("portable.enabled", false)) {
  //   try {
  //     ChromeUtils.importESModule(
  //       "resource:///modules/portable/PortableInjections.sys.mjs"
  //     );
  //   } catch (e) {
  //     console.error(e);
  //   }

  //   if (Services.prefs.getBoolPref("portable.update.enabled", false)) {
  //     try {
  //       ChromeUtils.importESModule(
  //         "resource:///modules/portable/PortableUpdate.sys.mjs"
  //       );
  //     } catch (e) {
  //       console.error(e);
  //     }
  //   }
  // }
}
