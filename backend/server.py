"""FastAPI server: runs the LBM simulation in a background thread and streams
fields to the browser over a WebSocket.

Run:  uv run python backend/server.py   ->  http://localhost:8000
"""
import asyncio
import json
import math
import sys
import threading
import time
from contextlib import asynccontextmanager
from pathlib import Path

# Ensure backend directory is on sys.path regardless of execution cwd
BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import numpy as np
import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from airfoil import airfoil_mask
from lbm import LBM, gpu_available

FRONTEND = Path(__file__).resolve().parent.parent / "frontend"
RESOLUTIONS = {"low": (480, 180), "medium": (800, 300), "high": (1280, 480), "ultra": (2048, 768)}


class Simulation:
    def __init__(self):
        self.gpu = gpu_available()
        self.params = dict(
            naca="2412", aoa=8.0, re=1000.0, u_in=0.08, resolution="medium",
            backend="gpu" if self.gpu else "cpu", smagorinsky=True,
            field="smoke", paused=False,
            smoke_mode="continuous", smoke_lines=28,
        )
        self.wand = {"active": False, "x": 0.2, "y": 0.5, "radius": 3.0}
        self.lock = threading.Lock()
        self.pending = {}
        self.frame = None
        self.frame_id = 0
        self.status = "ok"
        self._build()
        threading.Thread(target=self._run, daemon=True).start()

    # -------------------------------------------------- configuration
    def _chord(self):
        return self.sim.nx * 0.16

    def _tau(self):
        nu = self.params["u_in"] * self._chord() / self.params["re"]
        return 0.5 + 3.0 * nu

    def _build(self):
        nx, ny = RESOLUTIONS[self.params["resolution"]]
        self.sim = LBM(nx, ny, backend=self.params["backend"], u_in=self.params["u_in"])
        self._apply_physics()
        self._apply_geometry()
        self.sim.reset()

    def _apply_physics(self):
        p = self.params
        self.sim.set_inlet_velocity(p["u_in"])
        self.sim.tau = self._tau()
        self.sim.cs_smag = 0.15 if p["smagorinsky"] else 0.0
        self.sim.track_dye = p["field"] == "smoke"
        self.sim.smoke_mode = p.get("smoke_mode", "continuous")
        self.sim.smoke_lines = int(p.get("smoke_lines", 28))
        self.sim.wand = self.wand

    def _apply_geometry(self):
        p = self.params
        mask = airfoil_mask(self.sim.nx, self.sim.ny, p["naca"], p["aoa"],
                            chord=self._chord(), x_le=self.sim.nx * 0.22)
        self.sim.set_solid(mask)

    def update(self, msg: dict):
        with self.lock:
            self.pending.update(msg)

    def _consume(self):
        with self.lock:
            msg, self.pending = self.pending, {}
        if not msg:
            return
        if "wand" in msg:
            self.wand.update(msg.pop("wand"))
            self.sim.wand = self.wand
        if msg.pop("clear_smoke", False):
            self.sim.clear_dye()

        p = self.params
        reset = msg.pop("reset", False)
        if "backend" in msg and msg["backend"] == "gpu" and not self.gpu:
            msg.pop("backend")
        if "naca" in msg:
            try:
                from airfoil import naca4
                naca4(msg["naca"])
            except ValueError:
                msg.pop("naca")
        old = dict(p)
        for k in p:
            if k in msg:
                p[k] = type(p[k])(msg[k])
        if p["resolution"] != old["resolution"]:
            self._build()
            return
        if p["backend"] != old["backend"]:
            self.sim.switch_backend(p["backend"])
        if any(p[k] != old[k] for k in ("re", "u_in", "smagorinsky", "field", "smoke_mode", "smoke_lines")):
            self._apply_physics()
        if p["naca"] != old["naca"] or p["aoa"] != old["aoa"]:
            self._apply_geometry()
        if reset:
            self.sim.reset()
            self.status = "ok"

    # -------------------------------------------------- loop
    def _run(self):
        last_frame = 0.0
        while True:
            try:
                self._consume()
                if self.params["paused"]:
                    time.sleep(0.03)
                    self._make_frame()
                    continue
                n = 20 if self.sim.backend == "gpu" else 5
                self.sim.step(n)
                if self.sim.is_unstable():
                    self.status = "unstable — lower Re/velocity, then reset"
                    self.sim.reset()
                now = time.perf_counter()
                if now - last_frame > 1 / 40:
                    self._make_frame()
                    last_frame = now
            except Exception as e:   # keep the server alive
                self.status = f"error: {e}"
                time.sleep(0.5)

    def _make_frame(self):
        p, s = self.params, self.sim
        field = s.field(p["field"])
        finite = field[np.isfinite(field)]
        if p["field"] == "smoke":
            vmin, vmax = 0.0, 1.0
        elif p["field"] in ("vorticity", "uy", "pressure"):
            lim = float(np.percentile(np.abs(finite), 99.5)) if finite.size else 1.0
            vmin, vmax = -lim, lim
        else:
            vmin, vmax = 0.0, float(np.percentile(finite, 99.8)) if finite.size else 1.0
        q = 0.5 * s.u_in ** 2 * self._chord()
        a = math.radians(p["aoa"])
        fx, fy = s.force
        chord_val = self._chord()
        x_ac = (s.nx * 0.22 + 0.25 * chord_val) / s.nx
        y_ac = 0.5
        meta = dict(
            type="frame", nx=s.nx, ny=s.ny, vmin=vmin, vmax=max(vmax, vmin + 1e-6),
            cl=float(fy / q), cd=float(fx / q), step=s.step_count,
            mlups=round(s.mlups, 2), backend=s.backend, gpu=self.gpu,
            tau=round(s.tau, 4), status=self.status, params=p,
            ac=[round(x_ac, 4), round(y_ac, 4)],
            chord_norm=round(chord_val / s.nx, 4),
        )
        with self.lock:
            self.frame = (json.dumps(meta), field.astype(np.float16).tobytes())
            self.frame_id += 1


sim: Simulation | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global sim
    sim = Simulation()
    yield


app = FastAPI(title="2D Wind Tunnel", lifespan=lifespan)


@app.get("/")
def index():
    return FileResponse(FRONTEND / "index.html")


app.mount("/static", StaticFiles(directory=FRONTEND), name="static")


@app.websocket("/ws")
async def ws(websocket: WebSocket):
    await websocket.accept()
    if sim:
        # Push initial configuration and hardware state to client immediately
        init_msg = json.dumps({"type": "init", "params": sim.params, "gpu": sim.gpu})
        await websocket.send_text(init_msg)

    async def receiver():
        while True:
            sim.update(json.loads(await websocket.receive_text()))

    recv = asyncio.create_task(receiver())
    last = -1
    try:
        while not recv.done():
            if sim.frame_id != last and sim.frame:
                last = sim.frame_id
                meta, data = sim.frame
                await websocket.send_text(meta)
                await websocket.send_bytes(data)
            await asyncio.sleep(1 / 60)
    except WebSocketDisconnect:
        pass
    finally:
        recv.cancel()


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
