"""Headless sanity check: stability, lift sign, CPU vs GPU agreement, MLUPS."""
import sys, time
sys.path.insert(0, "backend")
import numpy as np
from airfoil import airfoil_mask
from lbm import LBM, gpu_available

def run(backend, aoa, steps=3000, nx=480, ny=180):
    s = LBM(nx, ny, backend=backend, u_in=0.08)
    chord = nx * 0.16
    s.tau = 0.5 + 3 * 0.08 * chord / 500
    s.set_solid(airfoil_mask(nx, ny, "0012", aoa, chord=chord, x_le=nx * 0.22))
    s.reset()
    for _ in range(steps // 50):
        s.step(50)
    q = 0.5 * 0.08**2 * chord
    return s, s.force[1] / q, s.force[0] / q

for aoa in (0, 6):
    s, cl, cd = run("cpu", aoa)
    print(f"CPU aoa={aoa}: Cl={cl:+.3f} Cd={cd:.3f} stable={not s.is_unstable()} MLUPS={s.mlups:.1f}")
if gpu_available():
    s, cl, cd = run("gpu", 6)
    print(f"GPU aoa=6: Cl={cl:+.3f} Cd={cd:.3f} MLUPS={s.mlups:.1f}")
    big = LBM(2048, 768, backend="gpu"); big.step(50); big.step(200)
    print(f"GPU 2048x768 MLUPS={big.mlups:.0f}")
