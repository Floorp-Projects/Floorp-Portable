/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import ResourceProtocolListDirUtils from "resource:///modules/portable/ResourceProtocolListDirUtils.mjs";

export class PortableI18nL10nLoader {
  static async load() {
    const locales = {};

    const l10n_dir = "resource:///modules/portable/l10n/";
    const listDirUtils = new ResourceProtocolListDirUtils(l10n_dir);
    const list = await listDirUtils.listDir();

    for (const item of list) {
      if (!item["file-type"] == "FILE") {
        continue;
      }
      if (!item["filename"].endsWith(".json")) {
        continue;
      }

      const locale = item["filename"].slice(0, -5);

      const uri = (new URL(item["filename"], l10n_dir)).href;
      const result = await fetch(uri);
      const locale_data = await result.json();

      locales[locale] = locale_data;
    }

    return locales;
  }
}

// Use BCP47 for language format
export class PortableI18nLocalizer {
  requestLocales;
  availableLocales;
  defaultLocale;
  localesData;
  selectedLocales;

  constructor(requestLocales = Services.locale.appLocalesAsBCP47, availableLocales, defaultLocale = "en-US", localesData) {
    if (typeof requestLocales === "string") {
      requestLocales = [requestLocales];
    }
    if (typeof availableLocales === "string") {
      availableLocales = [availableLocales];
    }

    this.requestLocales = requestLocales;
    this.availableLocales = availableLocales;
    this.defaultLocale = defaultLocale;
    this.localesData = localesData;

    if (!localesData[defaultLocale]) {
      throw new Components.Exception("The language set in defaultLocale must always have data in localesData.");
    }

    this.selectedLocales = Services.locale.negotiateLanguages(
      requestLocales,
      availableLocales,
      defaultLocale,
    );
  }

  localize(id) {
    const selectedLocales = this.selectedLocales;
    const defaultLocale = this.defaultLocale;

    for (const selectedLocale of selectedLocales) {
      const value = this.localesData[selectedLocale]?.[id];
      if (value) {
        return value;
      }
    }

    return this.localesData[defaultLocale]?.[id];
  }

  mustLocalize(id) {
    const result = this.localize(id);

    if (!result) {
      throw new Components.Exception(`"${id}" key is not found`);
    }

    return result;
  }
}
