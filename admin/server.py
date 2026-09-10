#!/usr/bin/env python3
"""m0uss1 admin server — local ONLY, stdlib, never for production.

Run:  python3 admin/server.py      ->  http://localhost:8000
Open: http://localhost:8000/admin/index.html

Endpoints
  GET  /api/gallery                      -> data/gallery.json
  POST /api/gallery  {"items":[...]}     -> saves data/gallery.json
  POST /api/i18n     {"en":{},"fr":{},"tn":{}}   -> saves data/i18n.json
  POST /api/upload   {"data":"<b64>","name":"..","mime":".."}
                                         -> writes assets/uploads/<name>, returns {"path":...}
  GET  /api/uploads                      -> {"files":[...]}
  GET  /api/backup                       -> {"backups":[...]}  (list)
  POST /api/backup                       -> creates backup snapshots now
  GET  /api/backup?restore=<name>        -> restores gallery.json + i18n.json from a snapshot
Everything else is served statically from the repo root.
"""
import base64
import json
import os
import re
import shutil
from datetime import datetime
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, "data")
UPLOAD_DIR = os.path.join(ROOT, "assets", "uploads")
BACKUP_DIR = os.path.join(ROOT, "admin", "backups")
MAX_BODY = 25 * 1024 * 1024

GALLERY_FILE = os.path.join(DATA_DIR, "gallery.json")
I18N_FILE = os.path.join(DATA_DIR, "i18n.json")


def ensure_dirs():
    for d in (DATA_DIR, UPLOAD_DIR, BACKUP_DIR):
        os.makedirs(d, exist_ok=True)


def ok(handler, obj, status=200):
    body = json.dumps(obj).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


def fail(handler, msg, status=400):
    ok(handler, {"error": msg}, status=status)


def read_json_body(handler):
    length = int(handler.headers.get("Content-Length", 0) or 0)
    if length <= 0 or length > MAX_BODY:
        raise ValueError("bad content length")
    raw = handler.rfile.read(length)
    try:
        return json.loads(raw.decode("utf-8"))
    except Exception as exc:
        raise ValueError("invalid JSON: %s" % exc)


def write_json_atomic(path, obj):
    ensure_dirs()
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as fh:
        json.dump(obj, fh, ensure_ascii=False, indent=2)
        fh.write("\n")
    os.replace(tmp, path)


def load_json(path, default):
    ensure_dirs()
    if not os.path.exists(path):
        return default
    try:
        with open(path, "r", encoding="utf-8") as fh:
            return json.load(fh)
    except Exception:
        return default


SAFE_NAME = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]*$")
EXT_BY_MIME = {
    "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif",
    "image/avif": "avif", "video/mp4": "mp4", "video/webm": "webm",
}


class Handler(SimpleHTTPRequestHandler):
    def directory(self):
        return ROOT

    def _handle_api(self):
        path = urlparse(self.path).path

        if path == "/api/gallery" and self.command == "GET":
            ok(self, load_json(GALLERY_FILE, {"updated": "", "items": []}))

        elif path == "/api/gallery" and self.command == "POST":
            try:
                data = read_json_body(self)
            except ValueError as exc:
                return fail(self, str(exc))
            if not isinstance(data.get("items"), list):
                return fail(self, "items must be a list")
            data["updated"] = datetime.now().isoformat(timespec="seconds")
            write_json_atomic(GALLERY_FILE, data)
            ok(self, {"ok": True, "updated": data["updated"], "count": len(data["items"])})

        elif path == "/api/i18n" and self.command == "POST":
            try:
                data = read_json_body(self)
            except ValueError as exc:
                return fail(self, str(exc))
            for lang in ("en", "fr", "tn"):
                if lang not in data or not isinstance(data[lang], dict):
                    return fail(self, "missing lang object: " + lang)
            write_json_atomic(I18N_FILE, data)
            ok(self, {"ok": True})

        elif path == "/api/upload" and self.command == "POST":
            try:
                data = read_json_body(self)
            except ValueError as exc:
                return fail(self, str(exc))
            name = (data.get("name") or "").strip()
            mime = (data.get("mime") or "").strip().lower()
            b64 = (data.get("data") or "").split(",", 1)[-1]
            if not name or not b64:
                return fail(self, "name and data are required")
            clean = os.path.basename(name)
            if not SAFE_NAME.match(clean):
                return fail(self, "unsafe filename")
            ext = os.path.splitext(clean)[1].lstrip(".").lower()
            if not ext and EXT_BY_MIME.get(mime):
                ext = EXT_BY_MIME[mime]
            if ext not in EXT_BY_MIME.values():
                return fail(self, "unsupported media type")
            if not ext:
                return fail(self, "cannot determine extension")
            clean = re.sub(r"\.[^.]+$", "", clean) + "." + ext
            try:
                payload = base64.b64decode(b64)
            except Exception:
                return fail(self, "bad base64")
            if not payload:
                return fail(self, "empty payload")
            dest = os.path.join(UPLOAD_DIR, clean)
            with open(dest, "wb") as fh:
                fh.write(payload)
            ok(self, {"ok": True, "path": os.path.join("assets", "uploads", clean)})

        elif path == "/api/uploads" and self.command == "GET":
            ensure_dirs()
            files = sorted(f for f in os.listdir(UPLOAD_DIR) if not f.startswith("."))
            ok(self, {"files": files})

        elif path == "/api/backup" and self.command == "GET":
            ensure_dirs()
            q = parse_qs(urlparse(self.path).query)
            restore = (q.get("restore") or [None])[0]
            if restore:
                if not SAFE_NAME.match(restore):
                    return fail(self, "unsafe backup name")
                gal = os.path.join(BACKUP_DIR, "gallery-" + restore + ".json")
                i18n = os.path.join(BACKUP_DIR, "i18n-" + restore + ".json")
                if not (os.path.exists(gal) and os.path.exists(i18n)):
                    return fail(self, "backup not found", status=404)
                write_json_atomic(GALLERY_FILE, load_json(gal, {"updated": "", "items": []}))
                write_json_atomic(I18N_FILE, load_json(i18n, {"en": {}, "fr": {}, "tn": {}}))
                return ok(self, {"ok": True, "restored": restore})
            names = sorted({f.split("-", 1)[1][:-5] for f in os.listdir(BACKUP_DIR)
                            if f.startswith("gallery-") and f.endswith(".json")}, reverse=True)
            ok(self, {"backups": names})

        elif path == "/api/backup" and self.command == "POST":
            ensure_dirs()
            stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
            for src, prefix in ((GALLERY_FILE, "gallery"), (I18N_FILE, "i18n")):
                dst = os.path.join(BACKUP_DIR, "%s-%s.json" % (prefix, stamp))
                shutil.copyfile(src, dst)
            ok(self, {"ok": True, "name": stamp})

        else:
            fail(self, "not found", status=404)

    def do_GET(self):
        if self.path.startswith("/api/"):
            return self._handle_api()
        return super().do_GET()

    def do_POST(self):
        if self.path.startswith("/api/"):
            return self._handle_api()
        return super().do_GET()

    def log_message(self, fmt, *args):
        pass


if __name__ == "__main__":
    ensure_dirs()
    port = 8000
    server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    print("m0uss1 admin running  ->  http://localhost:%d/admin/index.html" % port)
    print("press Ctrl+C to stop")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nstopped.")