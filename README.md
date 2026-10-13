# AeroLab · 2D Airfoil Wind Tunnel

Real-time 2D aerodynamic wind tunnel simulation of NACA airfoils powered by the Lattice Boltzmann Method (LBM D2Q9), featuring GPU acceleration, interactive WebGL visualization, MacCormack anti-diffusion smoke streamlines, and dynamic force vector overlays.

---

## Features

- **LBM D2Q9 Physics Engine**:
  - Equilibrium inlet, zero-gradient convective outlet, free-slip tunnel walls, and momentum-exchange bounce-back boundaries on airfoil surfaces.
  - Smagorinsky Subgrid-Scale (LES) eddy viscosity model for numerical stability at elevated Reynolds numbers.
  - Backend-agnostic: NumPy CPU fallback or high-throughput CuPy GPU execution delivering **120–190+ MLUPS** (Million Lattice Updates Per Second) on modern NVIDIA GPUs.

- **Smoke Streamlines & Flow Visualization**:
  - **MacCormack Predictor-Corrector Transport Scheme**: Anti-diffusive dye advection preserves razor-sharp streamlines wrapping across the leading edge into shedding wakes.
  - **Anti-Aliased Gaussian Nozzles**: Configurable inlet streamline rakes (16 to 48 streams).
  - **Continuous & Pulsed Modes**: Switch between steady streamlines and pulsed streakline packets.
  - **Interactive Smoke Wand**: Inject localized smoke plumes anywhere in the tunnel with real-time pointer tracking (`Shift + Drag` or toggle button).

- **Dynamic Lift & Drag Force Vectors Overlay**:
  - Antialiased vector arrows anchored to the airfoil's quarter-chord aerodynamic center ($c/4$):
    - **Lift Vector ($\vec{L}$)**: Glowing cyan arrow pointing normal to freestream, labeled with $C_L$.
    - **Drag Vector ($\vec{D}$)**: Glowing coral arrow pointing downstream, labeled with $C_D$.
    - **Resultant Vector ($\vec{R}$)**: Glowing amber vector showing total aerodynamic force magnitude and direction.
    - **Force Parallelogram**: Dashed projection lines completing the orthogonal force decomposition.
  - Adjustable vector scale slider ($0.2\times$ to $3.0\times$) with automatic screen-edge clamping.

- **Interactive Aerodynamic Diagnostics**:
  - Live strip chart tracking $C_L$ and $C_D$ over time.
  - Instant parameter tuning: NACA 4-digit geometry, Angle of Attack ($\alpha \in [-15^\circ, +25^\circ]$), Reynolds number ($\mathrm{Re}$), and lattice inlet velocity.
  - Colormaps: Smoke, Turbo, Ice/Fire (diverging), and Inferno.
  - Pan & Zoom controls up to $20\times$ magnification.

---

## Architecture

- **`backend/lbm.py`**: D2Q9 Lattice Boltzmann solver with NumPy/CuPy backends, momentum-exchange force integration, and MacCormack dye advection.
- **`backend/airfoil.py`**: Analytical NACA 4-digit airfoil equation generator with pivot rotation about quarter-chord ($c/4$).
- **`backend/server.py`**: FastAPI & WebSocket streaming server with asynchronous background simulation loop.
- **`frontend/`**:
  - `index.html`: Modern aerodynamic laboratory control interface.
  - `main.js`: WebGL fragment shaders for field rendering, Canvas 2D overlay for force vectors, pointer interactions, and WebSocket state synchronization.
  - `style.css`: Polished glassmorphism dark mode aesthetic.

---

## Quickstart

### Prerequisites
- Python 3.12+
- [`uv`](https://docs.astral.sh/uv/) package manager
- (Optional) NVIDIA GPU with CUDA & CuPy for GPU acceleration

### Installation & Run

1. Clone repository:
   ```bash
   git clone git@github.com:fsantibanezc/WindTunnel.git
   cd WindTunnel
   ```

2. Sync dependencies using `uv`:
   ```bash
   uv sync
   ```

3. Launch the wind tunnel server:
   ```bash
   uv run python backend/server.py
   ```

4. Open your browser:
   ```
   http://localhost:8000
   ```

---

## License

MIT
