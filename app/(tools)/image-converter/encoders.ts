export function encodeBmp(img: { width: number; height: number; data: Uint8ClampedArray }): Blob {
  const { width: w, height: h, data } = img;
  const rowSize = Math.ceil((w * 3) / 4) * 4;
  const size = 54 + rowSize * h;
  const buf = new ArrayBuffer(size);
  const v = new DataView(buf);
  v.setUint8(0, 0x42); // "B"
  v.setUint8(1, 0x4d); // "M"
  v.setUint32(2, size, true);
  v.setUint32(10, 54, true); // pixel data offset
  v.setUint32(14, 40, true); // DIB header size
  v.setInt32(18, w, true);
  v.setInt32(22, h, true);
  v.setUint16(26, 1, true); // planes
  v.setUint16(28, 24, true); // bits per pixel
  v.setUint32(34, rowSize * h, true);
  v.setInt32(38, 2835, true); // 72 dpi
  v.setInt32(42, 2835, true);

  const px = new Uint8Array(buf);
  for (let y = 0; y < h; y++) {
    const srcRow = (h - 1 - y) * w * 4; // BMP rows are stored bottom-up
    const dst = 54 + y * rowSize;
    for (let x = 0; x < w; x++) {
      const s = srcRow + x * 4;
      const d = dst + x * 3;
      px[d] = data[s + 2]; // B
      px[d + 1] = data[s + 1]; // G
      px[d + 2] = data[s]; // R
    }
  }
  return new Blob([buf], { type: "image/bmp" });
}

/** Single-image ICO that wraps PNG data (supported by every modern OS and browser). */
export function wrapIco(png: Uint8Array, size: number): Blob {
  const head = new DataView(new ArrayBuffer(22));
  head.setUint16(0, 0, true); // reserved
  head.setUint16(2, 1, true); // type: icon
  head.setUint16(4, 1, true); // image count
  head.setUint8(6, size >= 256 ? 0 : size); // width (0 means 256)
  head.setUint8(7, size >= 256 ? 0 : size); // height
  head.setUint8(8, 0); // palette colors
  head.setUint8(9, 0); // reserved
  head.setUint16(10, 1, true); // color planes
  head.setUint16(12, 32, true); // bits per pixel
  head.setUint32(14, png.length, true); // image data size
  head.setUint32(18, 22, true); // image data offset
  return new Blob([head.buffer, png], { type: "image/x-icon" });
}

const CRC_TABLE = (() => {
  const t: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(d: Uint8Array) {
  let c = 0xffffffff;
  for (let i = 0; i < d.length; i++) c = CRC_TABLE[(c ^ d[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** ZIP with no compression: images are already compressed, so this is fast and simple. */
export function zipStore(files: { name: string; data: Uint8Array }[]): Blob {
  const enc = new TextEncoder();
  const parts: BlobPart[] = [];
  const central: BlobPart[] = [];
  const now = new Date();
  const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
  const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
  let offset = 0;
  let centralSize = 0;

  files.forEach((f) => {
    const name = enc.encode(f.name);
    const len = f.data.length;
    const crc = crc32(f.data);

    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true);
    lh.setUint16(4, 20, true); // version needed
    lh.setUint16(6, 0x0800, true); // UTF-8 names
    lh.setUint16(8, 0, true); // method: stored
    lh.setUint16(10, dosTime, true);
    lh.setUint16(12, dosDate, true);
    lh.setUint32(14, crc, true);
    lh.setUint32(18, len, true);
    lh.setUint32(22, len, true);
    lh.setUint16(26, name.length, true);
    lh.setUint16(28, 0, true);
    parts.push(lh.buffer, name, f.data);

    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true);
    ch.setUint16(4, 20, true);
    ch.setUint16(6, 20, true);
    ch.setUint16(8, 0x0800, true);
    ch.setUint16(10, 0, true);
    ch.setUint16(12, dosTime, true);
    ch.setUint16(14, dosDate, true);
    ch.setUint32(16, crc, true);
    ch.setUint32(20, len, true);
    ch.setUint32(24, len, true);
    ch.setUint16(28, name.length, true);
    ch.setUint32(42, offset, true);
    central.push(ch.buffer, name);

    centralSize += 46 + name.length;
    offset += 30 + name.length + len;
  });

  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true);
  end.setUint32(12, centralSize, true);
  end.setUint32(16, offset, true);

  return new Blob([...parts, ...central, end.buffer], { type: "application/zip" });
}
