/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { ExtensionParent } from "resource://gre/modules/ExtensionParent.sys.mjs";
import { AppConstants } from "resource://gre/modules/AppConstants.sys.mjs";
import { FileUtils } from "resource://gre/modules/FileUtils.sys.mjs";
import { CommonUtils } from "resource://services-common/utils.sys.mjs";
import {
  clearInterval,
  setInterval,
} from "resource://gre/modules/Timer.sys.mjs";
import ArchiveExtractUtils from "resource:///modules/portable/ArchiveExtractUtils.sys.mjs";
import PortableEnvironment from "resource:///modules/portable/PortableEnvironment.sys.mjs";
import {
  PortableI18nL10nLoader,
  PortableI18nLocalizer,
} from "resource:///modules/portable/PortableI18nUtils.sys.mjs";
import { verifyJson } from "resource:///modules/portable/PortablePublicKeyDb.sys.mjs";
import { SessionStore } from "resource:///modules/sessionstore/SessionStore.sys.mjs";

const AlertsService = Cc["@mozilla.org/alerts-service;1"].getService(
  Ci.nsIAlertsService
);

const API_BASE_URL = !Services.prefs.getBoolPref(
  "portable.update.develop.enabled",
  false
)
  ? "https://floorp-update.ablaze.one"
  : Services.prefs.getStringPref("portable.update.develop.url", "");

const platformInfo = ExtensionParent.PlatformInfo;
const isWin = platformInfo.os === "win";

const appDirPath = Services.dirsvc.get("XREExeF", Ci.nsIFile).parent.path;
const appDirParentDirPath = PathUtils.parent(appDirPath);
const updateTmpDirPath = PathUtils.join(appDirParentDirPath, "update_tmp");
const updateZipFilePath = PathUtils.join(updateTmpDirPath, "update.zip");
const updateTarZstFilePath = PathUtils.join(updateTmpDirPath, "update.tar.zst");
const coreUpdateReadyFilePath = PathUtils.join(
  updateTmpDirPath,
  "CORE_UPDATE_READY"
);

const localizer = (async () => {
  const locales = await PortableI18nL10nLoader.load();
  const availableLocales = Object.keys(locales);
  return new PortableI18nLocalizer(
    undefined,
    availableLocales,
    undefined,
    locales
  );
})();

const PortableUpdateUtils = {
  notifyAutoUpdateInterval: -1,

  init() {
    return;
    Services.obs.addObserver(this, "quit-application");
    Services.obs.addObserver(this, "do-portable-update");

    this.notifyAutoUpdate();
    this.notifyAutoUpdateInterval = setInterval(
      this.notifyAutoUpdate,
      1000 * 60 * 60 * 6 /* 6 hours */
    );
  },

  destroy() {
    clearInterval(this.notifyAutoUpdateInterval);
    Services.obs.removeObserver(this, "quit-application");
    Services.obs.removeObserver(this, "do-portable-update");
  },

  notifyAutoUpdate() {
    if (!Services.prefs.getBoolPref("portable.update.auto", false)) {
      return;
    }
    Services.obs.notifyObservers({ latestNotify: false }, "do-portable-update");
  },

  async getCheckUpdateBaseUrl() {
    let platform;
    switch (platformInfo.os) {
      case "win":
        platform = "Windows";
        break;
      case "linux":
        platform = "Linux";
        break;
      case "mac":
        platform = "macOS";
        break;
      default:
        throw new Error(`Unsupported OS: ${platformInfo.os}`);
    }

    let architecture;
    switch (platformInfo.arch) {
      case "arm":
        architecture = "arm64";
        break;
      case "x86-32":
        architecture = "x86";
        break;
      case "x86-64":
        architecture = "x86_64";
        break;
      default:
        throw new Error(`Unsupported architecture: ${platformInfo.arch}`);
    }

    const params = {
      Platform: platform,
      Architecture: architecture,
      Version: await PortableEnvironment.getFullVersion(),
    };

    let url = `${API_BASE_URL}/update/${AppConstants.MOZ_APP_DISPLAYNAME_DO_NOT_USE}/`;
    for (const param of Object.entries(params)) {
      url += `${param[0]}:${param[1]}/`;
    }

    return url;
  },

  async fetchLatestInfo() {
    const base_url = await this.getCheckUpdateBaseUrl();
    const url = base_url + "update.json";
    const url_sig = base_url + "signature.json";

    const result = await fetch(url, { cache: "no-store" });
    if (!result.ok) {
      throw new Error(`${result.status} ${result.statusText}`);
    }

    const result_sig = await fetch(url_sig, { cache: "no-store" });
    if (!result_sig.ok) {
      console.warn("Signature file not found");
      return {};
    }

    const data = await result.arrayBuffer();
    const signature_detail = await result_sig.json();
    if (
      !signature_detail.algorism ||
      !signature_detail.signature ||
      !PortableEnvironment.validateBase64(signature_detail.signature)
    ) {
      console.warn("Invalid signature file");
      return {};
    }
    const signature = await PortableEnvironment.base64ToArrayBuffer(
      signature_detail.signature
    );
    if (
      !(await verifyJson(
        data,
        signature_detail.algorism,
        signature,
        "portable-updates"
      ))
    ) {
      console.warn("Verification failed");
      return {};
    }

    const data_json = JSON.parse(new TextDecoder().decode(data));

    return data_json;
  },

  async checkUpdate() {
    const result = await this.fetchLatestInfo();
    if (!result || !result.version || !result.url) {
      console.warn("invalid response data or no updates found");
      return {
        isUpdateFound: false,
        url: null,
        sha256: null,
      };
    }
    if (!result.sha256) {
      console.error("hash not found");
      return {
        isUpdateFound: false,
        url: null,
        sha256: null,
      };
    }

    const current_version = await PortableEnvironment.getFullVersion();

    const isUpdateFound = result.version !== current_version;

    return {
      isUpdateFound: isUpdateFound,
      url: isUpdateFound ? result.url : null,
      sha256: result.sha256,
    };
  },

  async applyRuntimeUpdate() {
    // Update portable runtime

    const app_name = AppConstants.MOZ_APP_NAME;

    await IOUtils.remove(
      isWin
        ? PathUtils.join(appDirParentDirPath, `${app_name}.exe`)
        : PathUtils.join(appDirParentDirPath, app_name)
    );

    await IOUtils.move(
      isWin
        ? PathUtils.join(updateTmpDirPath, `${app_name}.exe`)
        : PathUtils.join(updateTmpDirPath, app_name),
      isWin
        ? PathUtils.join(appDirParentDirPath, `${app_name}.exe`)
        : PathUtils.join(appDirParentDirPath, app_name)
    );

    return true;
  },

  async downloadUpdate(url, hash) {
    const result = await fetch(url);
    if (!result.ok) {
      throw new Error(`${result.status} ${result.statusText}`);
    }

    const data = new Uint8Array(await result.arrayBuffer());

    let hasher = Cc["@mozilla.org/security/hash;1"].createInstance(
      Ci.nsICryptoHash
    );
    hasher.init(hasher.SHA256);
    hasher.update(data, data.length);
    const result_hash = CommonUtils.bytesAsHex(hasher.finish(false));

    if (result_hash !== hash) {
      throw new Error("Hash mismatch");
    }

    await IOUtils.write(isWin ? updateZipFilePath : updateTarZstFilePath, data);
  },

  async showNotification(type) {
    let image, title, body;

    switch (type) {
      case "ready":
        image = "resource:///modules/portable/icons/update-pending.png";
        title = (await localizer).mustLocalize("bm-updater-ready-notify-title");
        body = (await localizer).mustLocalize(
          "bm-updater-ready-notify-message"
        );
        break;
      case "failed-runtime":
        image = "resource:///modules/portable/icons/failed.png";
        title = (await localizer).mustLocalize(
          "bm-updater-failed-notify-title"
        );
        message = (await localizer).mustLocalize(
          "bm-updater-failed-runtime-message"
        );
        break;
      case "failed-prepare":
        image = "resource:///modules/portable/icons/failed.png";
        title = (await localizer).mustLocalize(
          "bm-updater-failed-notify-title"
        );
        message = (await localizer).mustLocalize(
          "bm-updater-failed-prepare-message"
        );
        break;
      case "success":
        image = "resource:///modules/portable/icons/update-with-check.png";
        title = (await localizer).mustLocalize(
          "bm-updater-success-notify-title"
        );
        body = (await localizer).mustLocalize(
          "bm-updater-success-notify-message"
        );
        break;
      case "found":
        image = "resource:///modules/portable/icons/download.png";
        title = (await localizer).mustLocalize("bm-updater-found-notify-title");
        body = (await localizer).mustLocalize(
          "bm-updater-found-notify-message"
        );
        break;
      case "not-found":
        image = "resource:///modules/portable/icons/update-with-check.png";
        title = (await localizer).mustLocalize(
          "bm-updater-no-updates-found-notify-title"
        );
        body = (await localizer).mustLocalize(
          "bm-updater-no-updates-found-notify-message"
        );
        break;
    }

    if (!image || !title || !body) {
      return;
    }

    AlertsService.showAlertNotification(
      image, // Image URL
      title, // Title
      body, // Body
      true, // textClickable
      null, // id
      null // clickCallback
    );
  },

  isUpdating: false,

  async doUpdate(options) {
    if (this.isUpdating) {
      return;
    }
    this.isUpdating = true;

    try {
      if (!Services.prefs.getBoolPref("portable.update.enabled", false)) {
        return;
      }

      if (await IOUtils.exists(coreUpdateReadyFilePath)) {
        this.showNotification("ready");

        // When updating only the portable runtime, clearing the startup cache may be necessary.
        PortableEnvironment.clearStartupCache();

        return;
      }

      if (
        await IOUtils.exists(
          PathUtils.join(updateTmpDirPath, "REDIRECTOR_UPDATE_READY")
        ) /* Old version of Floorp Portable */
      ) {
        try {
          await this.applyRuntimeUpdate();
        } catch (e) {
          console.error(e);
          this.showNotification("failed-runtime");
          return;
        } finally {
          await IOUtils.remove(
            PathUtils.join(updateTmpDirPath, "REDIRECTOR_UPDATE_READY")
          );
        }
      }

      if (await PortableEnvironment.isUpdated()) {
        this.showNotification("success");
      }

      if (await IOUtils.exists(updateTmpDirPath)) {
        await IOUtils.remove(updateTmpDirPath, { recursive: true });
      }

      const updateInfo = await this.checkUpdate();
      if (updateInfo.isUpdateFound) {
        this.showNotification("found");

        try {
          await this.downloadUpdate(updateInfo.url, updateInfo.sha256);
          if (isWin) {
            await ArchiveExtractUtils.extractZip(
              updateZipFilePath,
              updateTmpDirPath
            );
          } else {
            await ArchiveExtractUtils.extractTarZst(
              updateTarZstFilePath,
              updateTmpDirPath
            );
          }
          await this.applyRuntimeUpdate();
          await IOUtils.writeUTF8(coreUpdateReadyFilePath, "");
        } catch (e) {
          console.error(e);
          this.showNotification("failed-prepare");
          return;
        }

        this.showNotification("ready");

        // When updating only the portable runtime, clearing the startup cache may be necessary.
        PortableEnvironment.clearStartupCache();
      } else if (options.latestNotify) {
        this.showNotification("not-found");
      }
    } finally {
      this.isUpdating = false;
    }
  },

  observe(subj, topic) {
    switch (topic) {
      case "do-portable-update":
        this.doUpdate(Object.assign({}, subj?.wrappedJSObject));
        break;
      case "quit-application":
        // When updating only the portable runtime, clearing the startup cache may be necessary.
        // As a precaution, if update files are detected, the application will schedule clearing the startup cache upon exit.
        // As a precaution to ensure synchronous processing, IOUtils is not used.
        const file = new FileUtils.File(coreUpdateReadyFilePath);
        if (file.exists()) {
          PortableEnvironment.clearStartupCache();
        }

        this.destroy();
        break;
    }
  },
};

PortableUpdateUtils.init();
