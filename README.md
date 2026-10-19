# <img src="frontend/ncssm_logo.jpg" alt="NCSSM Logo" height="38" style="vertical-align: middle; margin-right: 8px; border-radius: 6px;" /> WindTunnel lab · 2D Airfoil Wind Tunnel

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/fsantibanezc/WindTunnel/blob/main/WindTunnel_Lab_Colab.ipynb)

Real-time 2D aerodynamic wind tunnel simulation of NACA airfoils powered by the Lattice Boltzmann Method (LBM D2Q9), featuring GPU acceleration, interactive WebGL visualization, MacCormack anti-diffusion smoke streamlines, dynamic force vector overlays, and student stall polar data acquisition.

---

## ⚡ Run Instantly on Google Colab (Zero-Install Cloud GPU)

For students, classrooms, or anyone without a local GPU, **WindTunnel lab** can be launched in one click on Google Colab:

1. Click the **[Open in Colab](https://colab.research.google.com/github/fsantibanezc/WindTunnel/blob/main/WindTunnel_Lab_Colab.ipynb)** badge.
2. In Colab, select **Runtime** ➔ **Change runtime type** ➔ **T4 GPU** (free tier).
3. Run **Step 1** to set up the environment and **Step 2** to launch the server and Cloudflare tunnel.
4. Click the generated **`🚀 Open WindTunnel lab ↗`** link to access the interactive wind tunnel in your browser.

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

- **Interactive Aerodynamic Diagnostics & Stall Lab**:
  - **Expanded Angle of Attack**: $\alpha \in [-20^\circ, +35^\circ]$ with continuous slider and fine $\pm 0.5^\circ$ stepper buttons (`◀` / `▶` or arrow keys), providing ample span to observe linear pre-stall slope, stall onset, and deep separated vortex shedding.
  - **Student Data Acquisition (DAQ) & Stall Polar Lab**:
    - **Live 5s "Acquire" Burst (Hotkey `L`)**: Samples a 5.0-second burst (~200 frames at 40 FPS) with an animated progress bar and live converging mean readout.
    - **Integer Vortex Shedding Cycle Integration**: Isolates the shedding oscillation wave and integrates over exact integer cycles from peak to peak ($\int \sin(\omega t) dt = 0$), completely eliminating the phase-dependent variation that previously scrambled the stall curve.
    - **Shedding Oscillation Envelope & Whiskers**: Measures the full dynamic envelope $[C_{L,\min}, C_{L,\max}]$, fluctuation amplitude $\Delta C_L$, and $\sigma_{C_L}$, rendering vertical error whiskers and translucent glow ribbons on the polar diagram.
    - **Flow Settling Telemetry**: Automatic transient indicator warns when flow is settling following an angle change and lights up green when ready for acquisition.
    - **Interactive Polar Plot ($C_L$ vs. $\alpha$)**: Real-time graphing connecting true cycle-mean $C_L$ points with thin-airfoil theoretical slope reference ($C_L = 2\pi(\alpha - \alpha_0)$).
    - **Automated Stall Point Identification**: Identifies $C_{L,\max}$ and $\alpha_{\text{stall}}$ with glowing beacons, axial drop lines, and regime classification tags (*Linear Attached*, *Stall Onset*, *Vortex Shedding*, *Deep Stall*).
    - **Data Table & Enhanced CSV Export**: Comprehensive tabular viewer with individual point deletion and full-fidelity CSV export including cycle means, oscillation envelopes, cycle counts, and lattice steps for lab reports.
  - **Live Time-Series Strip Chart**: Real-time rolling chart tracking instantaneous $C_L(t)$ and $C_D(t)$ fluctuations.
  - **Colormaps**: Smoke streamlines, Turbo, Ice/Fire (diverging), and Inferno.
  - **Pan & Zoom controls**: Smooth zooming up to $20\times$ magnification and panning.

---

## Architecture

- **`WindTunnel_Lab_Colab.ipynb`**: Turnkey Google Colab notebook for running WindTunnel lab on cloud GPUs with Cloudflare tunnel streaming.
- **`backend/lbm.py`**: D2Q9 Lattice Boltzmann solver with NumPy/CuPy backends, momentum-exchange force integration, and MacCormack dye advection.
- **`backend/airfoil.py`**: Analytical NACA 4-digit airfoil equation generator with pivot rotation about quarter-chord ($c/4$).
- **`backend/server.py`**: FastAPI & WebSocket streaming server with asynchronous background simulation loop.
- **`DOCUMENTATION/`**:
  - `physics_description.tex`: Complete mathematical and physical formulation in LaTeX.
  - `physics_description.pdf`: Compiled technical reference PDF covering LBM D2Q9 kinetic theory, Chapman-Enskog expansion, Smagorinsky LES closure, momentum exchange forces, and MacCormack dye transport.
- **`frontend/`**:
  - `index.html`: Modern aerodynamic laboratory control interface.
  - `main.js`: WebGL fragment shaders for field rendering, Canvas 2D overlay for force vectors, pointer interactions, and WebSocket state synchronization.
  - `style.css`: Polished glassmorphism dark mode aesthetic.
  - `ncssm_logo.jpg`: NCSSM institutional emblem.

---

## Local Quickstart

### Prerequisites
- Python 3.12+
- [`uv`](https://docs.astral.sh/uv/) package manager
- (Optional) NVIDIA GPU with CUDA drivers for hardware acceleration

### Installation & Run

1. **Clone repository**:
   ```bash
   git clone git@github.com:fsantibanezc/WindTunnel.git
   cd WindTunnel
   ```

2. **Sync dependencies**:
   - **For CPU only**:
     ```bash
     uv sync
     ```
   - **With GPU Acceleration (NVIDIA CUDA 12)**:
     ```bash
     uv sync --extra gpu
     ```

3. **Launch the wind tunnel server**:
   ```bash
   uv run python backend/server.py
   ```

4. **Open your browser**:
   ```
   http://localhost:8000
   ```

---

## Enabling GPU Acceleration (CuPy / CUDA)

WindTunnel lab features high-performance GPU execution via [CuPy](https://cupy.dev/). On modern NVIDIA GPUs (Ampere, Ada Lovelace, Hopper, RTX series), the GPU backend delivers **120–190+ MLUPS** (Million Lattice Updates Per Second), enabling high resolutions ($1280 \times 480$, $2048 \times 768$) to stream fluidly at interactive 40–60 FPS.

### 1. Requirements
- An NVIDIA GPU with CUDA driver installed (`nvidia-smi` working).
- CUDA Toolkit/runtime 12.x (or 11.x).

### 2. Installation
Using `uv`:
```bash
# For CUDA 12.x
uv sync --extra gpu

# If using standard pip
pip install -e .[gpu]
```

> **Note for CUDA 11.x:** If your system uses CUDA 11 instead of CUDA 12:
> ```bash
> uv pip install "cupy-cuda11x>=13.0"
> ```

### 3. Verification
Verify that CuPy recognizes your GPU:
```bash
uv run python -c "import cupy as cp; print('Detected GPU:', cp.cuda.Device(0).name)"
```

You can also run the headless solver benchmark to compare CPU vs. GPU throughput:
```bash
uv run python tests/check_solver.py
```
*Example benchmark output:*
```
CPU aoa=0: Cl=+0.000 Cd=0.134 stable=True MLUPS=2.1
CPU aoa=6: Cl=+0.497 Cd=0.155 stable=True MLUPS=2.0
GPU aoa=6: Cl=+0.497 Cd=0.155 MLUPS=141.2
GPU 2048x768 MLUPS=189
```

### 4. Runtime Selection
- When CuPy and a compatible CUDA GPU are detected, the server **automatically selects GPU mode** on startup.
- In the web UI under the **Compute** section:
  - Click **`GPU · CuPy`** or **`CPU · NumPy`** to seamlessly switch backends on the fly without resetting flow state.
  - If no CUDA GPU is detected, the `GPU · CuPy` button is disabled with an explanatory tooltip.

---

## License

MIT

