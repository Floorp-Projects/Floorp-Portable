/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { PortableI18nL10nLoader, PortableI18nLocalizer } from "resource:///modules/portable/PortableI18nUtils.sys.mjs";

export class NoraPortableSettingsParent extends JSWindowActorParent {
  #localizer = null;

  async receiveMessage(message) {
    const data = message.data;

    switch (message.name) {
      case "SetPref":
        switch (data.prefType) {
          case "string":
            Services.prefs.setStringPref(data.prefName, data.prefValue);
            break;
          case "boolean":
            Services.prefs.setBoolPref(data.prefName, data.prefValue);
            break;
          case "integer":
            Services.prefs.setIntPref(data.prefName, data.prefValue);
            break;
        }
        this.sendAsyncMessage("SetPref");
        break;
      case "PortableLocalize":
        if (!this.#localizer) {
          const locales = await PortableI18nL10nLoader.load();
          const availableLocales = Object.keys(locales);
          this.#localizer = new PortableI18nLocalizer(
            undefined,
            availableLocales,
            undefined,
            locales,
          );
        }
        const localized = this.#localizer.localize(data.id, data.args);
        this.sendAsyncMessage("PortableLocalize", localized);
        break;
    }
  }
}
