/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

async function onDocumentSizeChanged() {
  await notifyBrowserObservers({
    topic: "portable-settings-on-document-size-changed",
    data: {
      width:  document.body.scrollWidth,
      height:  document.body.scrollHeight,
    },
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  for (const elem of document.querySelectorAll("[data-l10n-id]")) {
    const id = elem.getAttribute("data-l10n-id");
    const value = await portableLocalize({ id });
    elem.innerText = value;
  }

  onDocumentSizeChanged();

  for (const elem of document.querySelectorAll("[data-preference]")) {
    const prefName = elem.getAttribute("data-preference");
    let prefType;
    switch (elem.type) {
      case "text":
        prefType = "string";
        break;
      case "checkbox":
        prefType = "boolean";
        break;
      case "number":
        prefType = "integer";
        break;
    }

    const value = getBrowserPref({ prefName, prefType });

    switch (elem.type) {
      case "text":
        elem.value = value;
        break;
      case "checkbox":
        elem.checked = value;
        break;
      case "number":
        elem.value = value;
        break;
    }

    elem.addEventListener("change", async () => {
      const prefValue = elem.type == "checkbox" ? elem.checked : elem.value;
      await setBrowserPref({ prefName, prefType, prefValue: prefValue });
    });
  }
});
