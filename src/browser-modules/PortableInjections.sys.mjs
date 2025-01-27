/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { ExtensionCommon } from "resource://gre/modules/ExtensionCommon.sys.mjs";
import { PortableI18nL10nLoader, PortableI18nLocalizer } from "resource:///modules/portable/PortableI18nUtils.sys.mjs";
import PortableEnvironment from "resource:///modules/portable/PortableEnvironment.sys.mjs";

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
          async function() {
            const button = document_.getElementById("checkForUpdatesButton");
            if (Services.prefs.getBoolPref("portable.update.enabled")) {
              button.addEventListener("command", function() {
                Services.obs.notifyObservers({ latestNotify: true }, "do-portable-update");
              });
            } else {
              button.remove();
            }

            const licensePortable = new (window_.customElements.get("text-link"))();
            licensePortable.setAttribute("class", "bottom-link text-link");
            licensePortable.setAttribute("is", "text-link")
            licensePortable.setAttribute("useoriginprincipal", "true");
            licensePortable.setAttribute("href", "about:license-portable");
            licensePortable.style.whiteSpace = "pre-wrap";
            licensePortable.innerHTML = (await localizer).mustLocalize("bm-about-dialog-license-portable");
            document_.querySelector('label[href="about:license"]').insertAdjacentElement("afterend", licensePortable);

            window_.sizeToContent();
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

        #policies-container {
          display: none;
        }
        `;
        document_.head.appendChild(portableCSSElem);

        window_.addEventListener(
          "pageshow",
          async () => {
            await window_.gMainPane.initialized;

            const portableUpdatePref = "portable.update.auto";
            const updateApp = document_.getElementById("updateApp");
            const portableUpdateOption = document_.createXULElement("checkbox");
            portableUpdateOption.setAttribute(
              "label",
              (await localizer).mustLocalize("bm-pref-portable-update-auto-enabled")
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
      } else if (
        uriWithoutQueryRef.startsWith("chrome://noraneko-settings/")
      ) {
        const interval = window_.setInterval(async () => {
          if (!document_.querySelector("#portable-tab-link")) {
            const aboutTabLink = document_.querySelector('a[href="/about"]');

            const cloned = aboutTabLink.cloneNode(true);
            cloned.id = "portable-tab-link";
            cloned.querySelector("div > p").innerText = "Portable Settings";
            cloned.addEventListener("click", (e) => {
              e.preventDefault();

              if (window_.location.pathname != "/portable") {
                window_.history.pushState({}, "", "/portable");
                // invoke React Router handler
                window_.dispatchEvent(new PopStateEvent("popstate"));
              }
            });

            aboutTabLink.insertAdjacentElement("beforebegin", cloned);
          }

          if (window_.location.pathname  == "/about") {
            const aboutSectionTitle = document_.querySelector('img[alt="logo"][src="chrome://branding/content/about-logo@2x.png"] + p');
            const aboutSectionVersionInfo = document_.querySelector('div:has(> img[alt="logo"][src="chrome://branding/content/about-logo@2x.png"]) + p');
            if (!aboutSectionTitle || !aboutSectionVersionInfo) {
              return;
            }

            aboutSectionTitle.innerText = (await localizer).mustLocalize("bm-original-pref-about-section-title");

            if (!document_.querySelector("#portable-version-info")) {
              const portableVersionInfo = document_.createElement("p");
              portableVersionInfo.id = "portable-version-info";

              const version = await PortableEnvironment.getPortableVersion();
              portableVersionInfo.innerText = (await localizer).mustLocalize("bm-original-pref-about-section-portable-version-info", { version });

              aboutSectionVersionInfo.insertAdjacentElement("beforebegin", portableVersionInfo);
            }
          }

          if (window_.location.pathname  == "/portable") {
            if (!document_.querySelector("#portable-content")) {
              const contentParent = document_.querySelector('div:has(> div > a[href="/about"]) + div > div');

              const portableContent = document_.createElement("div");
              portableContent.id = "portable-content";

              const iframe = document_.createElement("iframe");
              iframe.src = "resource:///modules/portable/portable-settings/index.html";
              iframe.style.width = "100%";
              // iframe.addEventListener("load", () => {
              //   iframe.style.height = `${iframe.contentWindow.document.body.scrollHeight}px`;
              // });
              Services.obs.addObserver((subj) => {
                const data = subj?.wrappedJSObject;
                iframe.style.height = `${data.height}px`;
              }, "portable-settings-on-document-size-changed");

              portableContent.appendChild(iframe);

              contentParent.appendChild(portableContent);
            }
          } else {
            document_.querySelector("#portable-content")?.remove();
          }
        }, 0);

        window_.addEventListener("unload", () => {
          window_.clearInterval(interval);
        });
      }
    }
  },
};
Services.obs.addObserver(documentObserver, "chrome-document-interactive");
