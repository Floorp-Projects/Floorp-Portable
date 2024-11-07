/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { ExtensionCommon } from "resource://gre/modules/ExtensionCommon.sys.mjs";
import { PortableI18nL10nLoader, PortableI18nLocalizer } from "resource:///modules/portable/PortableI18nUtils.sys.mjs";

const localizer = (async() => {
  const locales = await PortableI18nL10nLoader.load();
  const availableLocales = Object.keys(locales);
  return new PortableI18nLocalizer(
    undefined,
    availableLocales,
    undefined,
    locales,
  );
})();

const seenDocuments = new WeakSet();
const documentObserver = {
  observe(doc) {
    if (
      ExtensionCommon.instanceOf(doc, "HTMLDocument") &&
      !seenDocuments.has(doc)
    ) {
      seenDocuments.add(doc);
      const window_ = doc.defaultView;
      const document_ = window_.document;
      const uriObj = Services.io.newURI(window_.location.href);
      const uriWithoutQueryRef = uriObj.prePath + uriObj.filePath;
      if (uriWithoutQueryRef == "chrome://browser/content/aboutDialog.xhtml") {
        window_.addEventListener(
          "pageshow",
          function() {
            const button = document_.getElementById("checkForUpdatesButton");
            if (Services.prefs.getBoolPref("floorp.portable.update.enabled")) {
              button.addEventListener("command", function() {
                Services.obs.notifyObservers(null, "do-portable-update");
              });
            } else {
              button.remove();
            }

            const licensePortable = new (window_.customElements.get("text-link"))();
            licensePortable.setAttribute("class", "bottom-link text-link");
            licensePortable.setAttribute("is", "text-link")
            licensePortable.setAttribute("useoriginprincipal", "true");
            licensePortable.setAttribute("href", "about:license-portable");
            const span1 = document_.createXULElement("span");
            span1.style.display = "inline";
            span1.setAttribute("data-l10n-id", "bottomLinks-license");
            licensePortable.appendChild(span1);
            const span2 = document_.createXULElement("span");
            span2.style.display = "inline";
            span2.innerHTML = " (Portable)";
            licensePortable.appendChild(span2);
            document_.querySelector('label[href="about:license"]').insertAdjacentElement("afterend", licensePortable);
          },
          { once: true }
        );
      } else if (
        uriWithoutQueryRef == "chrome://floorp/content/preferences/preferences.xhtml" ||
        uriWithoutQueryRef == "chrome://browser/content/preferences/preferences.xhtml" ||
        uriWithoutQueryRef == "about:preferences"
      ) {
        // Floorp Portable does not support setting nor detection of default browser
        // https://searchfox.org/mozilla-esr128/source/browser/components/preferences/main.js#1731-1737
        window_.getShellService = function () {};

        // Hide built-in updater, etc settings
        const portableCSSElem = document_.createElement("style");
        portableCSSElem.id = "portableCSS";
        portableCSSElem.innerText = `
        #updateDeck {
          display: none;
        }

        #showUpdateHistory {
          display: none;
        }

        #updateSettingsContainer {
          display: none;
        }

        #updateAllowDescription {
          display: none;
        }

        #defaultBrowserBox {
          display: none;
        }
        `;
        document_.head.appendChild(portableCSSElem);

        window_.addEventListener(
          "pageshow",
          async () => {
            await window_.gMainPane.initialized;

            const portableUpdatePref = "floorp.portable.update.enabled";
            const updateApp = document_.getElementById("updateApp");
            const portableUpdateOption = document_.createXULElement("checkbox");
            portableUpdateOption.setAttribute(
              "label",
              (await localizer).mustLocalize("bm-pref-floorp-portable-update-enabled")
            );
            portableUpdateOption.checked = Services.prefs.getBoolPref(portableUpdatePref, false);
            Services.prefs.addObserver(portableUpdatePref, function () {
              portableUpdateOption.checked = Services.prefs.getBoolPref(portableUpdatePref, false);
            });
            portableUpdateOption.addEventListener("command", function(e) {
              Services.prefs.setBoolPref(portableUpdatePref, e.currentTarget.checked);
            });
            updateApp.appendChild(portableUpdateOption);
          },
          { once: true },
        );
      }
    }
  },
};
Services.obs.addObserver(documentObserver, "chrome-document-interactive");
