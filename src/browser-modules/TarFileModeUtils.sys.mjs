/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

export function TarFileModeParser(mode_raw) {
  if (typeof mode_raw !== "number" || Number.isNaN(mode_raw) || mode_raw > 4095 || mode_raw < 0) {
    throw new Components.Exception("Invalid mode format");
  }

  const mode_str = mode_raw.toString(8).padStart(4, "0");
  const mode_values = mode_str.split("");

  const mode_parsed = {
    execution: {
      uid: false,
      gid: false,
      vtx: false,
    },
    owner: {
      read: false,
      write: false,
      exec: false,
    },
    group: {
      read: false,
      write: false,
      exec: false,
    },
    other: {
      read: false,
      write: false,
      exec: false,
    },
  };

  for (let i = 0; i < mode_values.length; i++) {
    switch (i) {
      case 0:
        // set mode on execution
        const execution = mode_parsed["execution"];
        let execution_num = Number(mode_values[i]);
        while (execution_num !== 0) {
          if (execution_num >= 4) {
            // set UID on execution
            execution.uid = true;

            execution_num -= 4;
          } else if (execution_num >= 2) {
            // set GID on execution
            execution.gid = true;

            execution_num -= 2;
          } else if (execution_num >= 1) {
            // set VTX on execution
            execution.vtx = true;

            execution_num -= 1;
          }
        }
        break;
      default:
        let now_section;
        switch (i) {
          case 1:
            now_section = "owner";
            break;
          case 2:
            now_section = "group";
            break;
          case 3:
            now_section = "other";
            break;
        }

        const section = mode_parsed[now_section];
        let section_num = Number(mode_values[i]);
        while (section_num !== 0) {
          if (section_num >= 4) {
            // read
            section.read = true;

            section_num -= 4;
          } else if (section_num >= 2) {
            // write
            section.write = true;

            section_num -= 2;
          } else if (section_num >= 1) {
            // exec
            section.exec = true;

            section_num -= 1;
          }
        }
        break;
    }
  }

  return mode_parsed;
}

export function TarFileModeCreater(mode_parsed_raw) {
  const mode_parsed = {
    execution: Object.assign({
      uid: false,
      gid: false,
      vtx: false,
    }, mode_parsed_raw.execution),
    owner: Object.assign({
      read: false,
      write: false,
      exec: false,
    }, mode_parsed_raw.owner),
    group: Object.assign({
      read: false,
      write: false,
      exec: false,
    }, mode_parsed_raw.group),
    other: Object.assign({
      read: false,
      write: false,
      exec: false,
    }, mode_parsed_raw.other),
  }

  let execution_num = 0;
  let owner_num = 0;
  let group_num = 0;
  let other_num = 0;

  if (mode_parsed.execution.uid) {
    execution_num += 4;
  }
  if (mode_parsed.execution.gid) {
    execution_num += 2;
  }
  if (mode_parsed.execution.vtx) {
    execution_num += 1;
  }

  for (const now_section of ["owner", "group", "other"]) {
    let section_num = 0;
    if (mode_parsed[now_section].read) {
      section_num += 4;
    }
    if (mode_parsed[now_section].write) {
      section_num += 2;
    }
    if (mode_parsed[now_section].exec) {
      section_num += 1;
    }

    if (now_section === "owner") {
      owner_num = section_num;
    } else if (now_section === "group") {
      group_num = section_num;
    } else if (now_section === "other") {
      other_num = section_num;
    }
  }

  const mode_str = String(execution_num) + String(owner_num) + String(group_num) + String(other_num);

  return parseInt(mode_str, 8);
}
