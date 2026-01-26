#!/usr/bin/env python3
"""
Simple manage script to run frontend and backend concurrently.

Usage:
  python manage.py runserver

This will:
 - start the FastAPI backend with uvicorn
 - start the frontend dev server with `npm run dev`

Both processes' stdout/stderr are streamed. Ctrl-C stops both.
"""
from __future__ import annotations

import argparse
import os
import shutil
import signal
import subprocess
import sys
import threading
from typing import Optional


ROOT = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(ROOT, "frontend")
BACKEND_MODULE = "backend.main:app"


def stream_output(prefix: str, stream):
    for line in iter(stream.readline, b""):
        try:
            text = line.decode(errors="replace").rstrip()
        except Exception:
            text = str(line)
        print(f"[{prefix}] {text}")


def start_process(cmd, cwd: Optional[str] = None, env: Optional[dict] = None, prefix: Optional[str] = None):
    # Use shell on Windows for npm to pick up .cmd files correctly
    use_shell = os.name == "nt"
    p = subprocess.Popen(
        cmd,
        cwd=cwd,
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        shell=use_shell,
    )

    if prefix and p.stdout:
        t = threading.Thread(target=stream_output, args=(prefix, p.stdout), daemon=True)
        t.start()

    return p


def runserver():
    # Check uvicorn availability
    python = sys.executable or "python"
    # Build backend command
    backend_cmd = [python, "-m", "uvicorn", BACKEND_MODULE, "--reload", "--host", "127.0.0.1", "--port", "8000"]

    # Build frontend command
    # Use npm by default
    npm = shutil.which("npm")
    if not npm:
        print("Warning: `npm` not found in PATH. Frontend will not be started.")
        npm_cmd = None
    else:
        # On Windows `shell=True` will run npm.cmd automatically when using the command string.
        npm_cmd = [npm, "run", "dev"]

    print("Starting backend: uvicorn on http://127.0.0.1:8000")
    backend_proc = start_process(backend_cmd, cwd=ROOT, prefix="backend")

    frontend_proc = None
    if npm_cmd:
        print("Starting frontend: npm run dev (Vite)")
        frontend_proc = start_process(npm_cmd, cwd=FRONTEND_DIR, prefix="frontend")

    # Wait for processes and handle shutdown
    try:
        while True:
            # Poll processes
            if backend_proc and backend_proc.poll() is not None:
                print("[backend] process exited")
                break
            if frontend_proc and frontend_proc.poll() is not None:
                print("[frontend] process exited")
                break
            # Sleep briefly
            try:
                import time

                time.sleep(0.5)
            except KeyboardInterrupt:
                break
    except KeyboardInterrupt:
        print("Shutting down (KeyboardInterrupt)...")
    finally:
        procs = [("frontend", frontend_proc), ("backend", backend_proc)]
        for name, p in procs:
            if p and p.poll() is None:
                print(f"Terminating {name}...")
                try:
                    p.terminate()
                except Exception:
                    try:
                        p.kill()
                    except Exception:
                        pass
        # Give processes a moment to exit
        try:
            import time

            time.sleep(1)
        except Exception:
            pass


def main(argv=None):
    parser = argparse.ArgumentParser(prog="manage.py")
    sub = parser.add_subparsers(dest="command")

    run = sub.add_parser("runserver", help="Start frontend and backend dev servers")

    args = parser.parse_args(argv)

    if args.command == "runserver":
        runserver()
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
