/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

export class NoraPortableSettingsParent extends JSWindowActorParent {
  async receiveMessage(message) {
    switch (message.name) {
      case "SetPref":
        const data = message.data;

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
    }
  }
}
