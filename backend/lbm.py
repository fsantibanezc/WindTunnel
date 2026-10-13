"""D2Q9 Lattice Boltzmann solver, backend-agnostic (NumPy on CPU, CuPy on GPU).

Layout: f has shape (9, ny, nx); row 0 is the bottom of the tunnel.
Boundaries: equilibrium inlet (left), zero-gradient outlet (right),
free-slip walls (top/bottom), full-way bounce-back on the airfoil.
"""
import time
import numpy as np

C = np.array([[0, 0], [1, 0], [0, 1], [-1, 0], [0, -1],
              [1, 1], [-1, 1], [-1, -1], [1, -1]])
W = np.array([4 / 9] + [1 / 9] * 4 + [1 / 36] * 4)
OPP = [0, 3, 4, 1, 2, 7, 8, 5, 6]
UP, DOWN = [2, 5, 6], [4, 8, 7]   # y-mirror pairs: 2<->4, 5<->8, 6<->7


def gpu_available() -> bool:
    try:
        import cupy as cp
        return cp.cuda.runtime.getDeviceCount() > 0
    except Exception:
        return False


def get_xp(backend: str):
    if backend == "gpu":
        import cupy as cp
        return cp
    return np


def to_numpy(a):
    return a.get() if hasattr(a, "get") else np.asarray(a)


class LBM:
    def __init__(self, nx=640, ny=240, backend="cpu", u_in=0.1, tau=0.6,
                 smagorinsky=0.15):
        self.nx, self.ny = nx, ny
        self.u_in = u_in
        self.tau = tau
        self.cs_smag = smagorinsky   # 0 disables the LES model
        self.step_count = 0
        self.force = np.zeros(2)     # smoothed (Fx, Fy) in lattice units
        self.mlups = 0.0
        self.track_dye = False       # advect smoke only when it is displayed
        self.smoke_lines = 28        # number of streams in the inlet rake
        self.smoke_mode = "continuous"  # "continuous" or "pulsed"
        self.wand = None             # dict(active=True, x=0.2, y=0.5, radius=3.0)
        self._set_backend(backend)
        self.solid = self.xp.zeros((ny, nx), dtype=bool)
        self.reset()

    # ------------------------------------------------------------ setup
    def _set_backend(self, backend):
        self.backend = backend
        xp = self.xp = get_xp(backend)
        f32 = xp.float32
        self.cx = xp.asarray(C[:, 0], dtype=f32).reshape(9, 1, 1)
        self.cy = xp.asarray(C[:, 1], dtype=f32).reshape(9, 1, 1)
        self.w = xp.asarray(W, dtype=f32).reshape(9, 1, 1)
        self._grid = None
        self._rake = None
        self._last_rake_lines = None

    def switch_backend(self, backend):
        if backend == self.backend:
            return
        f, solid, dye = to_numpy(self.f), to_numpy(self.solid), to_numpy(self.dye)
        self._set_backend(backend)
        self.f = self.xp.asarray(f)
        self.solid = self.xp.asarray(solid)
        self.dye = self.xp.asarray(dye)
        self._inlet = self.feq(1.0, self.u_in, 0.0)[:, :, 0]

    def feq(self, rho, ux, uy):
        xp = self.xp
        rho = xp.asarray(rho, dtype=xp.float32)
        ux = xp.asarray(ux, dtype=xp.float32)
        uy = xp.asarray(uy, dtype=xp.float32)
        if ux.ndim == 0:
            shape = (self.ny, self.nx)
            rho, ux, uy = (xp.broadcast_to(a, shape) for a in (rho, ux, uy))
        cu = 3.0 * (self.cx * ux + self.cy * uy)
        usq = 1.5 * (ux * ux + uy * uy)
        return (self.w * rho * (1.0 + cu + 0.5 * cu * cu - usq)).astype(xp.float32)

    def reset(self):
        xp = self.xp
        self.f = self.feq(1.0, self.u_in, 0.0)
        rest = self.feq(1.0, 0.0, 0.0)
        self.f = xp.where(self.solid, rest, self.f)
        self._inlet = self.feq(1.0, self.u_in, 0.0)[:, :, 0]
        self.dye = xp.zeros((self.ny, self.nx), dtype=xp.float32)
        self.step_count = 0
        self.force[:] = 0

    def clear_dye(self):
        self.dye = self.xp.zeros((self.ny, self.nx), dtype=self.xp.float32)

    def set_solid(self, mask_np: np.ndarray):
        xp = self.xp
        new = xp.asarray(mask_np)
        newly = new & ~self.solid
        rest = self.feq(1.0, 0.0, 0.0)
        self.f = xp.where(newly, rest, self.f)     # avoid trapped momentum
        freed = self.solid & ~new
        self.f = xp.where(freed, self.feq(1.0, self.u_in, 0.0), self.f)
        self.solid = new

    def set_inlet_velocity(self, u):
        self.u_in = float(u)
        self._inlet = self.feq(1.0, self.u_in, 0.0)[:, :, 0]

    # ------------------------------------------------------------ dynamics
    def macro(self, f=None):
        f = self.f if f is None else f
        rho = f.sum(axis=0)
        ux = (f * self.cx).sum(axis=0) / rho
        uy = (f * self.cy).sum(axis=0) / rho
        return rho, ux, uy

    def step(self, n=1):
        xp = self.xp
        t0 = time.perf_counter()
        fx_acc = fy_acc = 0.0
        for _ in range(n):
            f = self.f
            rho, ux, uy = self.macro(f)
            if self.track_dye and self.step_count % 2 == 0:
                self._advect_dye(ux * 2.0, uy * 2.0)
            feq = self.feq(rho, ux, uy)
            neq = f - feq
            if self.cs_smag > 0:
                pxx = (neq * self.cx * self.cx).sum(0)
                pyy = (neq * self.cy * self.cy).sum(0)
                pxy = (neq * self.cx * self.cy).sum(0)
                q = xp.sqrt(pxx * pxx + pyy * pyy + 2 * pxy * pxy)
                tau = 0.5 * (self.tau + xp.sqrt(self.tau ** 2
                             + 18.0 * 1.41421356 * self.cs_smag ** 2 * q / rho))
            else:
                tau = self.tau
            fpost = f - neq / tau
            fpost = xp.where(self.solid, f, fpost)

            # streaming
            fs = xp.empty_like(fpost)
            for i in range(9):
                fs[i] = xp.roll(fpost[i], (int(C[i, 1]), int(C[i, 0])), axis=(0, 1))

            # momentum exchange on the body: F = 2 * sum_i c_i f_i(incoming)
            jx = (fs * self.cx).sum(0)
            jy = (fs * self.cy).sum(0)
            fx_acc += 2.0 * (jx * self.solid).sum()
            fy_acc += 2.0 * (jy * self.solid).sum()

            # bounce-back
            fs = xp.where(self.solid, fs[OPP], fs)
            # free-slip walls
            fs[UP, 0, :] = fs[DOWN, 0, :]
            fs[DOWN, -1, :] = fs[UP, -1, :]
            # inlet / outlet
            fs[:, :, 0] = self._inlet
            fs[:, :, -1] = fs[:, :, -2]
            self.f = fs
            self.step_count += 1

        fnew = np.array([float(fx_acc), float(fy_acc)]) / n  # syncs GPU
        self.force = 0.9 * self.force + 0.1 * fnew if self.step_count > n else fnew
        dt = time.perf_counter() - t0
        self.mlups = self.nx * self.ny * n / dt / 1e6
        return self.force

    def is_unstable(self):
        return not bool(self.xp.isfinite(self.f[0, self.ny // 2, :]).all())

    # ------------------------------------------------------------ smoke
    def _bilerp(self, d, ux, uy):
        gx, gy = self._grid
        x = self.xp.clip(gx - ux, 0, self.nx - 1.001)
        y = self.xp.clip(gy - uy, 0, self.ny - 1.001)
        x0 = x.astype(self.xp.int32)
        y0 = y.astype(self.xp.int32)
        fx = x - x0
        fy = y - y0
        return ((d[y0, x0] * (1 - fx) + d[y0, x0 + 1] * fx) * (1 - fy)
                + (d[y0 + 1, x0] * (1 - fx) + d[y0 + 1, x0 + 1] * fx) * fy)

    def _advect_dye(self, ux, uy):
        """MacCormack anti-diffusion transport of smoke with Gaussian rake nozzles and wand."""
        xp, nx, ny = self.xp, self.nx, self.ny
        if self._grid is None or self._rake is None or getattr(self, "_last_rake_lines", None) != self.smoke_lines:
            gy, gx = xp.mgrid[0:ny, 0:nx]
            self._grid = (gx.astype(xp.float32), gy.astype(xp.float32))
            spacing = ny / (self.smoke_lines + 1)
            yy = xp.arange(ny, dtype=xp.float32)[:, None]
            rake = xp.zeros((ny, 1), dtype=xp.float32)
            sigma = max(1.1, spacing * 0.12)
            for k in range(1, self.smoke_lines + 1):
                rake += xp.exp(-0.5 * ((yy - k * spacing) / sigma) ** 2)
            self._rake = xp.clip(rake, 0.0, 1.0).astype(xp.float32)
            self._last_rake_lines = self.smoke_lines

        # MacCormack predictor-corrector: forward, backward, error compensation
        f_fwd = self._bilerp(self.dye, ux, uy)
        f_bwd = self._bilerp(f_fwd, -ux, -uy)
        f_corr = xp.clip(self.dye + 0.5 * (self.dye - f_bwd), 0.0, 1.0)
        v = self._bilerp(f_corr, ux, uy)

        # Subtle dissipation prevents ambient background fog accumulation
        v = v * 0.9995
        v = xp.where(self.solid, 0.0, v).astype(xp.float32)

        # Inlet rake injection (continuous or pulsed)
        inject = True
        if self.smoke_mode == "pulsed":
            # 14 steps on, 16 steps off
            inject = ((self.step_count // 2) % 24) < 11
        if inject:
            v[:, 0] = xp.maximum(v[:, 0], self._rake[:, 0])

        # Interactive smoke wand injection
        if self.wand and self.wand.get("active", False):
            wx = float(self.wand.get("x", 0.2)) * nx
            wy = float(self.wand.get("y", 0.5)) * ny
            r = float(self.wand.get("radius", 3.0))
            gx, gy = self._grid
            wand_puff = xp.exp(-0.5 * (((gx - wx) ** 2 + (gy - wy) ** 2) / (r ** 2)))
            v = xp.clip(v + wand_puff.astype(xp.float32) * 0.9, 0.0, 1.0)

        self.dye = v

    # ------------------------------------------------------------ output
    def field(self, name="speed") -> np.ndarray:
        """Return a float32 (ny, nx) numpy field; NaN inside the airfoil."""
        xp = self.xp
        rho, ux, uy = self.macro()
        if name == "smoke":
            out = self.dye
        elif name == "vorticity":
            out = (xp.roll(uy, -1, 1) - xp.roll(uy, 1, 1)
                   - xp.roll(ux, -1, 0) + xp.roll(ux, 1, 0)) * 0.5
            out = out / max(self.u_in, 1e-6)
        elif name == "pressure":   # Cp = (p - p_inf) / (0.5 rho U^2), p = rho/3
            out = (rho - 1.0) / 3.0 / (0.5 * max(self.u_in, 1e-6) ** 2)
        elif name == "ux":
            out = ux / max(self.u_in, 1e-6)
        elif name == "uy":
            out = uy / max(self.u_in, 1e-6)
        else:
            out = xp.sqrt(ux * ux + uy * uy) / max(self.u_in, 1e-6)
        out = xp.where(self.solid, xp.nan, out).astype(xp.float32)
        return to_numpy(out)
