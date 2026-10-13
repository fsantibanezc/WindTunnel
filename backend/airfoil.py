"""NACA 4-digit airfoil geometry and rasterization onto a lattice."""
import numpy as np


def naca4(code: str):
    """Return (camber m, camber position p, thickness t) for a NACA 4-digit code."""
    code = code.strip()
    if len(code) != 4 or not code.isdigit():
        raise ValueError(f"Invalid NACA 4-digit code: {code!r}")
    return int(code[0]) / 100.0, int(code[1]) / 10.0, int(code[2:]) / 100.0


def airfoil_mask(nx: int, ny: int, code: str = "0012", aoa_deg: float = 5.0,
                 chord: float = 100.0, x_le: float | None = None,
                 y_c: float | None = None) -> np.ndarray:
    """Boolean mask (ny, nx), True inside the airfoil.

    The airfoil is rotated about its quarter-chord point; positive AoA = nose up
    with the flow coming from the left (-x side).
    """
    m, p, t = naca4(code)
    if x_le is None:
        x_le = nx * 0.25
    if y_c is None:
        y_c = ny * 0.5
    a = np.deg2rad(aoa_deg)
    xq, yq = x_le + 0.25 * chord, y_c  # pivot

    Y, X = np.mgrid[0:ny, 0:nx].astype(np.float64)
    dx, dy = X - xq, Y - yq
    # Rotate grid points by +aoa to bring them into the (un-rotated) airfoil frame.
    xr = dx * np.cos(a) - dy * np.sin(a)
    yr = dx * np.sin(a) + dy * np.cos(a)
    xc = xr / chord + 0.25          # 0 at LE, 1 at TE
    yc = yr / chord

    inside = (xc >= 0.0) & (xc <= 1.0)
    xs = np.clip(xc, 0.0, 1.0)
    yt = 5 * t * (0.2969 * np.sqrt(xs) - 0.1260 * xs - 0.3516 * xs**2
                  + 0.2843 * xs**3 - 0.1036 * xs**4)
    if m > 0 and p > 0:
        ycam = np.where(xs < p,
                        m / p**2 * (2 * p * xs - xs**2),
                        m / (1 - p)**2 * ((1 - 2 * p) + 2 * p * xs - xs**2))
    else:
        ycam = np.zeros_like(xs)
    return inside & (np.abs(yc - ycam) <= yt)
