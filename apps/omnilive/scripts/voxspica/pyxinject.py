#!/usr/bin/env python3
"""Inject a new data entry into a PyInstaller CArchive (append-only, offset-safe).

Layout: [bootloader][data entries...][PYZ][TOC][cookie88]
Insertion: new data appended right before TOC; TOC gets one entry appended;
cookie pkglen/toc/tocLen updated. Existing entries keep their offsets.

Usage:
  python pyixinject.py <exe> <file-to-add> <archive-relative-name> <backup-path>

Example (VoxSpica zh-TW patch):
  python pyxinject.py C:\\opt\\voxspica\\app\\VoxSpica.exe \\
    apps/omnilive/scripts/voxspica/zhtw.json "dictophone\\locales\\zhtw.json" \\
    C:\\opt\\voxspica\\app\\VoxSpica.orig.exe
"""
import struct, sys, zlib, shutil, os

MAGIC = b'MEI\x0c\x0b\x0a\x0b\x0e'

def main():
    exe, add_file, arc_name, backup = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
    with open(exe, 'rb') as f:
        orig = f.read()
    fsize = len(orig)
    cookie = orig[fsize - 88:]
    magic, pkglen, toc_off, toc_len, pyver = struct.unpack('!8siiii', cookie[:24])
    assert magic == MAGIC, f'bad cookie magic {magic!r}'
    pylib = cookie[24:88]
    overlay = fsize - pkglen
    with open(add_file, 'rb') as f:
        raw = f.read()
    comp = zlib.compress(raw, 9)
    name = arc_name.encode('utf-8') + b'\0'
    new_epos = toc_off
    entry = struct.pack('!iIIIBc', 18 + len(name), new_epos, len(comp), len(raw), 1, b'b') + name
    old_toc = orig[overlay + toc_off: overlay + toc_off + toc_len]
    new_pkglen = pkglen + len(comp) + len(entry)
    new_toc_off = toc_off + len(comp)
    new_toc_len = toc_len + len(entry)
    new_cookie = struct.pack('!8siiii', MAGIC, new_pkglen, new_toc_off, new_toc_len, pyver) + pylib
    patched = orig[: overlay + toc_off] + comp + old_toc + entry + new_cookie
    shutil.copy2(exe, backup)
    with open(exe, 'wb') as f:
        f.write(patched)
    print(f'orig {fsize} -> patched {len(patched)} (+{len(patched)-fsize})')
    print(f'entry: {arc_name} epos={new_epos} c={len(comp)} u={len(raw)}')
    print(f'backup: {backup}')

if __name__ == '__main__':
    main()
