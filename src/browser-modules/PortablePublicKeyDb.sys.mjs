/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import PortableEnvironment from "resource:///modules/portable/PortableEnvironment.sys.mjs";

const PUBLIC_KEY_CONFIGS = [
  {
    name: "floorp-updates-portable-2024-12-19-pub.pem",
    algorism: { name: "ECDSA", namedCurve: "P-384" }, // secp384r1
    algorismVerifies: [
      { name: "ECDSA", hash: "SHA-384" }
    ],
    categories: [
      "floorp-updates",
    ],
  }
];

function removePemHeaderAndFooter(pem) {
  const pem_header = "-----BEGIN PUBLIC KEY-----";
  const pem_footer = "-----END PUBLIC KEY-----";
  const pem_contents = pem.trim().substring(
    pem_header.length,
    pem.trim().length - pem_footer.length,
  ).trim();
  return pem_contents.replaceAll("\n", "").replaceAll("\r", "");
}

export async function verifyData(data, signature, category) {
  for (const publickey_config of PUBLIC_KEY_CONFIGS) {
    if (publickey_config.categories.includes(category)) {
      const publickey_uri = `resource:///modules/portable/public-keys/${publickey_config.name}`;
      const pem = await (await fetch(publickey_uri)).text();
      const pem_contents = removePemHeaderAndFooter(pem);

      const pem_contents_buf = await PortableEnvironment.base64ToArrayBuffer(pem_contents);

      const publickey = await crypto.subtle.importKey(
        "spki",
        pem_contents_buf,
        publickey_config.algorism,
        true,
        ["verify"],
      );

      for (const algorism_verify of publickey_config.algorismVerifies) {
        const result = await crypto.subtle.verify(
          algorism_verify,
          publickey,
          signature,
          data,
        );

        if (result) {
          return true;
        }
      }
    }
  }
  return false;
}
