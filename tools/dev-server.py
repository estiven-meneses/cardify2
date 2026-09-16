#!/usr/bin/env python3
"""Servidor local de Cardify: archivos estáticos + recolector de errores (sin UI)."""

from __future__ import annotations

import json
import hashlib
import datetime as dt
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent.parent
LOGS_LOCAL = ROOT / "logs" / "local"
LOGS_PROD = ROOT / "logs" / "production"
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 4173


def today_stamp() -> str:
    return dt.datetime.now().strftime("%Y-%m-%d")


def now_iso() -> str:
    return dt.datetime.now().astimezone().isoformat(timespec="seconds")


def now_time() -> str:
    return dt.datetime.now().strftime("%H:%M:%S")


def day_file(env: str, day: str | None = None) -> Path:
    folder = LOGS_LOCAL if env == "local" else LOGS_PROD
    folder.mkdir(parents=True, exist_ok=True)
    return folder / f"{day or today_stamp()}.json"


def pending_file(env: str) -> Path:
    folder = LOGS_LOCAL if env == "local" else LOGS_PROD
    folder.mkdir(parents=True, exist_ok=True)
    return folder / "_pending.json"


def read_json(path: Path, default):
    if not path.exists():
        return default
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return default


def write_json(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def rebuild_pending(env: str) -> list:
    folder = LOGS_LOCAL if env == "local" else LOGS_PROD
    pending = []
    if folder.exists():
        for path in sorted(folder.glob("*.json")):
            if path.name.startswith("_"):
                continue
            entries = read_json(path, [])
            if not isinstance(entries, list):
                continue
            for item in entries:
                if item.get("status") == "pending":
                    pending.append({
                        "id": item.get("id"),
                        "date": path.stem,
                        "time": item.get("time"),
                        "level": item.get("level"),
                        "message": item.get("message"),
                        "source": item.get("source"),
                        "count": item.get("count", 1),
                    })
    write_json(pending_file(env), pending)
    return pending


def fingerprint(level: str, message: str, stack: str) -> str:
    raw = f"{level}|{message}|{(stack or '')[:240]}"
    return hashlib.sha1(raw.encode("utf-8")).hexdigest()[:10]


def append_error(env: str, payload: dict) -> dict:
    path = day_file(env)
    entries = read_json(path, [])
    if not isinstance(entries, list):
        entries = []

    fp = fingerprint(payload.get("level", "error"), payload.get("message", ""), payload.get("stack", ""))
    for item in entries:
        if item.get("fingerprint") == fp and item.get("status") == "pending":
            item["count"] = int(item.get("count") or 1) + 1
            item["lastSeenAt"] = now_iso()
            item["lastSeenTime"] = now_time()
            write_json(path, entries)
            rebuild_pending(env)
            return item

    entry = {
        "id": f"e-{today_stamp().replace('-', '')}-{now_time().replace(':', '')}-{fp[:4]}",
        "fingerprint": fp,
        "status": "pending",
        "level": payload.get("level") or "error",
        "message": payload.get("message") or "Error desconocido",
        "stack": payload.get("stack") or "",
        "source": payload.get("source") or "client",
        "url": payload.get("url") or "",
        "userAgent": payload.get("userAgent") or "",
        "createdAt": now_iso(),
        "time": now_time(),
        "count": 1,
        "resolvedAt": None,
        "resolvedNote": None,
    }
    entries.append(entry)
    write_json(path, entries)
    rebuild_pending(env)
    return entry


def resolve_error(env: str, error_id: str, note: str) -> dict | None:
    folder = LOGS_LOCAL if env == "local" else LOGS_PROD
    if not folder.exists():
        return None
    for path in folder.glob("*.json"):
        if path.name.startswith("_"):
            continue
        entries = read_json(path, [])
        if not isinstance(entries, list):
            continue
        for item in entries:
            if item.get("id") == error_id:
                item["status"] = "resolved"
                item["resolvedAt"] = now_iso()
                item["resolvedNote"] = note or "Corregido"
                write_json(path, entries)
                rebuild_pending(env)
                return item
    return None


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, fmt: str, *args) -> None:
        sys.stderr.write("%s - %s\n" % (self.log_date_time_string(), fmt % args))

    def _json(self, code: int, data) -> None:
        raw = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(raw)

    def _read_json(self) -> dict:
        length = int(self.headers.get("Content-Length") or 0)
        if length <= 0 or length > 200_000:
            return {}
        raw = self.rfile.read(length)
        try:
            data = json.loads(raw.decode("utf-8"))
            return data if isinstance(data, dict) else {}
        except (json.JSONDecodeError, UnicodeDecodeError):
            return {}

    def do_GET(self):
        if self.path.split("?", 1)[0] == "/__logs__/pending":
            env = "production" if "env=production" in self.path else "local"
            self._json(200, rebuild_pending(env))
            return
        super().do_GET()

    def do_POST(self):
        path = self.path.split("?", 1)[0]
        env = "local"
        if path == "/__log__" or path == "/api/logs":
            entry = append_error(env, self._read_json())
            self._json(201, {"ok": True, "id": entry["id"], "status": entry["status"]})
            return
        if path == "/__logs__/resolve":
            body = self._read_json()
            item = resolve_error(env, str(body.get("id") or ""), str(body.get("note") or "Corregido"))
            if not item:
                self._json(404, {"ok": False, "error": "id no encontrado"})
                return
            self._json(200, {"ok": True, "id": item["id"], "status": item["status"]})
            return
        self._json(404, {"ok": False, "error": "ruta desconocida"})


def main() -> None:
    LOGS_LOCAL.mkdir(parents=True, exist_ok=True)
    LOGS_PROD.mkdir(parents=True, exist_ok=True)
    rebuild_pending("local")
    server = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    print(f"Cardify local: http://127.0.0.1:{PORT}")
    print(f"Logs: {LOGS_LOCAL}")
    print("Sin UI de backend. Errores → logs/local/AAAA-MM-DD.json")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor detenido")


if __name__ == "__main__":
    main()
