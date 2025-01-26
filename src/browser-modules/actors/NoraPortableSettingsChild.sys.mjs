/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { RemotePageChild } from "resource://gre/actors/RemotePageChild.sys.mjs";

export class NoraPortableSettingsChild extends RemotePageChild {
  actorCreated() {
    super.actorCreated();
    const window = this.contentWindow;
    if (!window) {
      return;
    }

    Cu.exportFunction(this.getBrowserPref.bind(this), window, {
      defineAs: "getBrowserPref",
    });

    Cu.exportFunction(this.setBrowserPref.bind(this), window, {
      defineAs: "setBrowserPref",
    });
  }

  getBrowserPref({ prefName, prefType, prefDefaultValue }) {
    const args = [];
    args.push(prefName);
    if (prefDefaultValue != undefined) {
      args.push(prefDefaultValue);
    }

    switch (prefType) {
      case "string":
        return Services.prefs.getStringPref(...args);
      case "boolean":
        return Services.prefs.getBoolPref(...args);
      case "integer":
        return Services.prefs.getIntPref(...args);
      default:
        throw new Error("Invalid pref type");
    }
  }

  #setBrowserPrefResolvers = [];

  setBrowserPref(options) {
    return this.wrapPromise(new Promise((resolve) => {
      this.#setBrowserPrefResolvers.push(resolve);
      this.sendAsyncMessage("SetPref", options);
    }));
  }

  async receiveMessage(message) {
    switch (message.name) {
      case "SetPref":
        const resolver = this.#setBrowserPrefResolvers.shift();
        resolver?.();
        break;
    }
  }
}
