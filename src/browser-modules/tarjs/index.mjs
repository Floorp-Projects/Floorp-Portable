/*! @gera2ld/tarjs v0.3.1 | MIT License */
const encoder = new TextEncoder();
const utf8Encode = input => encoder.encode(input);
const decoder = new TextDecoder();
const utf8Decode = input => decoder.decode(input);
function getArrayBuffer(file) {
  if (typeof file === 'string') return utf8Encode(file).buffer;
  if (file instanceof ArrayBuffer) return file;
  if (ArrayBuffer.isView(file)) return new Uint8Array(file).buffer;
  return file.arrayBuffer();
}

class TarReader {
  static async load(file) {
    const buffer = await getArrayBuffer(file);
    const fileInfos = loadTarFile(buffer);
    return new TarReader(buffer, fileInfos);
  }
  #buffer;
  constructor(buffer, fileInfos) {
    this.fileInfos = fileInfos;
    this.#buffer = buffer;
  }
  getTextFile(filename) {
    const item = this.fileInfos.find(info => info.name === filename);
    if (!item) throw new Error(`File not found: ${filename}`);
    return readTextFile(this.#buffer, item.headerOffset + 512, item.size);
  }
  getFileBlob(filename, mimetype = '') {
    const item = this.fileInfos.find(info => info.name === filename);
    if (!item) throw new Error(`File not found: ${filename}`);
    return readFileBlob(this.#buffer, item.headerOffset + 512, item.size, mimetype);
  }
}
function loadTarFile(buffer) {
  const fileInfos = [];
  let offset = 0;
  while (offset < buffer.byteLength - 512) {
    const fileName = readFileName(buffer, offset);
    if (!fileName) break;
    const fileType = readFileType(buffer, offset);
    const fileSize = readFileSize(buffer, offset);
    const fileUid = readFileUid(buffer, offset);
    const fileGid = readFileGid(buffer, offset);
    const fileMode = readFileMode(buffer, offset);
    const fileUname = readFileUname(buffer, offset);
    const fileGname = readFileGname(buffer, offset);
    fileInfos.push({
      name: fileName,
      type: fileType,
      size: fileSize,
      uid: fileUid,
      gid: fileGid,
      mode: fileMode,
      user: fileUname,
      group: fileGname,
      headerOffset: offset
    });
    offset += 512 + 512 * Math.floor((fileSize + 511) / 512);
  }
  return fileInfos;
}
function readString(buffer, offset, maxSize) {
  let size = 0;
  let view = new Uint8Array(buffer, offset, maxSize);
  while (size < maxSize && view[size]) size += 1;
  view = new Uint8Array(buffer, offset, size);
  return utf8Decode(view);
}
function readFileName(buffer, offset) {
  return readString(buffer, offset, 100);
}
function readFileType(buffer, offset) {
  // offset = 156, length = 1
  const view = new Uint8Array(buffer, offset + 156, 1);
  return view[0];
}
function readFileSize(buffer, offset) {
  // offset = 124, length = 12
  const view = new Uint8Array(buffer, offset + 124, 12);
  const sizeStr = utf8Decode(view);
  return parseInt(sizeStr, 8);
}
function readFileUid(buffer, offset) {
  // offset = 108, length = 8
  const view = new Uint8Array(buffer, offset + 108, 8);
  const uidStr = utf8Decode(view);
  return parseInt(uidStr, 8);
}
function readFileGid(buffer, offset) {
  // offset = 116, length = 8
  const view = new Uint8Array(buffer, offset + 116, 8);
  const gidStr = utf8Decode(view);
  return parseInt(gidStr, 8);
}
function readFileMode(buffer, offset) {
  // offset = 100, length = 8
  const view = new Uint8Array(buffer, offset + 100, 8);
  const modeStr = utf8Decode(view);
  return parseInt(modeStr);
}
function readFileUname(buffer, offset) {
  // offset = 265, length = 32
  return readString(buffer, offset + 265, 32);
}
function readFileGname(buffer, offset) {
  // offset = 297, length = 32
  return readString(buffer, offset + 297, 32);
}
function readFileBlob(buffer, offset, size, mimetype) {
  const view = new Uint8Array(buffer, offset, size);
  return new Blob([view], {
    type: mimetype
  });
}
function readTextFile(buffer, offset, size) {
  const view = new Uint8Array(buffer, offset, size);
  return utf8Decode(view);
}

let TarFileType = /*#__PURE__*/function (TarFileType) {
  TarFileType[TarFileType["File"] = 0] = "File";
  TarFileType[TarFileType["Dir"] = 53] = "Dir";
  return TarFileType;
}({});

class TarWriter {
  #fileData;
  constructor() {
    this.#fileData = [];
  }
  addFile(name, file, opts) {
    const data = getArrayBuffer(file);
    const size = data.byteLength ?? file.size;
    const item = {
      name,
      type: TarFileType.File,
      data,
      size,
      opts
    };
    this.#fileData.push(item);
  }
  addFolder(name, opts) {
    this.#fileData.push({
      name,
      type: TarFileType.Dir,
      data: null,
      size: 0,
      opts
    });
  }
  async write() {
    const buffer = createBuffer(this.#fileData);
    const view = new Uint8Array(buffer);
    let offset = 0;
    for (const item of this.#fileData) {
      // write header
      writeFileName(buffer, item.name, offset);
      writeFileType(buffer, item.type, offset);
      writeFileSize(buffer, item.size, offset);
      fillHeader(buffer, offset, item.opts, item.type);
      writeChecksum(buffer, offset);

      // write data
      const itemBuffer = await item.data;
      if (itemBuffer) {
        const data = new Uint8Array(itemBuffer);
        view.set(data, offset + 512);
      }
      offset += 512 + 512 * Math.floor((item.size + 511) / 512);
    }
    return new Blob([buffer], {
      type: 'application/x-tar'
    });
  }
}
function createBuffer(fileData) {
  const dataSize = fileData.reduce((prev, item) => prev + 512 + 512 * Math.floor((item.size + 511) / 512), 0);
  const bufSize = 10240 * Math.floor((dataSize + 10240 - 1) / 10240);
  return new ArrayBuffer(bufSize);
}
function writeString(buffer, str, offset, size) {
  const bytes = utf8Encode(str);
  const view = new Uint8Array(buffer, offset, size);
  for (let i = 0; i < size; i += 1) {
    view[i] = i < bytes.length ? bytes[i] : 0;
  }
}
function writeFileName(buffer, name, offset) {
  // offset: 0
  writeString(buffer, name, offset, 100);
}
function writeFileType(buffer, type, offset) {
  // offset: 156
  const typeView = new Uint8Array(buffer, offset + 156, 1);
  typeView[0] = type;
}
function writeFileSize(buffer, size, offset) {
  // offset: 124
  const sizeStr = size.toString(8).padStart(11, '0');
  writeString(buffer, sizeStr, offset + 124, 12);
}
function writeFileMode(buffer, mode, offset) {
  // offset: 100
  writeString(buffer, mode.toString(8).padStart(7, '0'), offset + 100, 8);
}
function writeFileUid(buffer, uid, offset) {
  // offset: 108
  writeString(buffer, uid.toString(8).padStart(7, '0'), offset + 108, 8);
}
function writeFileGid(buffer, gid, offset) {
  // offset: 116
  writeString(buffer, gid.toString(8).padStart(7, '0'), offset + 116, 8);
}
function writeFileMtime(buffer, mtime, offset) {
  // offset: 136
  writeString(buffer, mtime.toString(8).padStart(11, '0'), offset + 136, 12);
}
function writeFileUser(buffer, user, offset) {
  // offset: 265
  writeString(buffer, user, offset + 265, 32);
}
function writeFileGroup(buffer, group, offset) {
  // offset: 297
  writeString(buffer, group, offset + 297, 32);
}
function writeChecksum(buffer, offset) {
  const header = new Uint8Array(buffer, offset, 512);
  // fill checksum fields with space
  for (let i = 0; i < 8; i += 1) {
    header[148 + i] = 32;
  }
  // add up header bytes as checksum
  let chksum = 0;
  for (let i = 0; i < 512; i += 1) {
    chksum += header[i];
  }
  writeString(buffer, chksum.toString(8).padEnd(8, ' '), offset + 148, 8);
}
function fillHeader(buffer, offset, opts, fileType) {
  const {
    uid,
    gid,
    mode,
    mtime,
    user,
    group
  } = {
    uid: 1000,
    gid: 1000,
    mode: fileType === TarFileType.File ? 0o664 : 0o775,
    mtime: ~~(Date.now() / 1000),
    user: 'gera2ld',
    group: 'tarjs',
    ...opts
  };
  writeFileMode(buffer, mode, offset);
  writeFileUid(buffer, uid, offset);
  writeFileGid(buffer, gid, offset);
  writeFileMtime(buffer, mtime, offset);
  writeString(buffer, 'ustar', offset + 257, 6); // magic string
  writeString(buffer, '00', offset + 263, 2); // magic version

  writeFileUser(buffer, user, offset);
  writeFileGroup(buffer, group, offset);
}

export { TarFileType, TarReader, TarWriter, createBuffer, getArrayBuffer, loadTarFile, readFileBlob, readTextFile, utf8Decode, utf8Encode };
