/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

export default class ResourceProtocolListDirUtils {
  uri;

  constructor(uri) {
    let u;
    try {
      u = new URL(uri);
    } catch (e) {
      throw new Components.Exception("Invalid uri");
    }
    if (u.protocol !== "resource:") {
      throw new Components.Exception("Invalid protocol");
    }

    this.uri = uri;
  }

  #parseIndexedResponse(res) {
    const list = [];
    const defines = [];

    const lines = res.replaceAll("\r\n", "\n").replaceAll("\r", "\n").split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line == "") {
        break; // EOF
      }

      const body = line.slice(5);

      if (line.startsWith("200: ")) {
        // status code 200 line is a define information.
        const values = body.split(" ");
        defines.push(...values);
        continue;
      }

      if (line.startsWith("201: ")) {
        // status code 201 line is a data.
        if (defines.length == 0) {
          throw new Components.Exception("Invalid format: Definition information must be defined.");
        }

        const values = body.split(" ");
        if (defines.length !== values.length) {
          throw new Components.Exception("Invalid format: The number of actual values differs from the number of values in the definition information.");
        }

        const data = {};
        for (let i = 0; i < values.length; i++) {
          const value = values[i];
          const define = defines[i];

          data[define] = decodeURIComponent(value);
        }

        list.push(data);
      }
    }

    return list;
  }

  async listDir() {
    let result;
    try {
      result = await fetch(this.uri);
    } catch (e) {
      throw new Components.Exception("Directory not found.");
    }

    const list = this.#parseIndexedResponse(await result.text());

    return list;
  }
}
