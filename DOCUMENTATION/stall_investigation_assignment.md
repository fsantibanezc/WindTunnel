# 🌪️ NCSSM Connect Program · Honors Aerospace Engineering
## Multi-Group Wind Tunnel Flight Investigation
### Parametric Scaling & Functional Dependence of Aerodynamic Stall: $\alpha_{\text{stall}} = f(\alpha,\, m,\, t/c,\, Re)$
**Platform:** [WindTunnel lab](https://github.com/fsantibanezc/WindTunnel) (2D Lattice Boltzmann Wind Tunnel)  
**Author / Course:** Developed by F. Santibanez, Ph.D. — Honors Aerospace Engineering — NCSSM Connect Program  

---

## 🎯 Mission Briefing & Core Research Objective

In computational aerodynamics and flight testing, **aerodynamic stall** represents the critical boundary where a wing experiences severe loss of lift, surging pressure drag, and unsteady wake shedding due to boundary layer separation. While idealized thin-airfoil theory predicts an unyielding linear lift curve:
$$C_L(\alpha) = 2\pi(\alpha - \alpha_0)$$
viscous fluids in real tunnels cannot climb the adverse pressure gradient on the suction surface indefinitely.

Your class is commissioned as an **Aerodynamics Research Consortium** to characterize and map the empirical multi-variable response surface of stall:
$$\alpha_{\text{stall}} = \Phi\left(m,\, \frac{t}{c},\, Re\right) \quad \text{and} \quad C_{L,\max} = \Psi\left(m,\, \frac{t}{c},\, Re\right)$$

To achieve this comprehensive parametric exploration, students are divided into **four specialized research divisions**, each isolating one physical axis while holding other controls constant. Following individual team testing, the divisions will pool their data into a master class repository to formulate a unified global scaling law.

---

## 🔬 Theoretical Foundations

### 1. Thin-Airfoil Theory & Camber Shifts
For an attached, inviscid flow over a slender airfoil, thin-airfoil theory predicts a constant lift slope:
$$\frac{dC_L}{d\alpha} = 2\pi \approx 6.28\,\text{rad}^{-1} \approx 0.110\,\text{deg}^{-1}$$
Camber shifts the zero-lift angle $\alpha_0$ to negative angles:
$$\alpha_0 \approx -k_c \cdot m \quad (k_c \approx 1.10 \text{ rad/unit camber})$$
where $m$ is the maximum camber ratio (first digit of the NACA 4-digit designation divided by 100).

### 2. Adverse Pressure Gradients & Boundary Layer Separation
Viscous dissipation continuously strips near-wall momentum from the fluid as it climbs the adverse pressure gradient downstream of the suction peak ($dp/dx > 0$). When the wall shear stress vanishes:
$$\tau_w = \left. \mu \frac{\partial u}{\partial y} \right|_{y=0} = 0$$
the boundary layer separates. The detached shear layer generates massive vorticity shedding and aerodynamic stall.

### 3. Governing Parameters
1. **Airfoil Thickness ($t/c$):** Controls leading-edge nose radius ($r_{\text{le}} \approx 1.1019\,(t/c)^2 c$). Thin airfoils suffer sharp leading-edge suction spikes and abrupt thin-airfoil stall; thicker profiles promote docile trailing-edge stall.
2. **Airfoil Camber ($m$):** Intensifies suction surface curvature, increasing $C_L$ at a given $\alpha$ but worsening the adverse pressure gradient $dp/dx$.
3. **Reynolds Number ($Re = U_\infty c / \nu$):** Governs boundary layer energization. Since laminar boundary layer thickness scales as $\delta \propto c / \sqrt{Re}$, higher $Re$ provides greater near-wall momentum, delaying flow detachment to higher angles of attack.

---

## ⏱️ Standardized Data Acquisition (DAQ) Protocol

To guarantee experimental repeatability across all teams, every data point must follow the **5-Second Integer Vortex Shedding Integration Protocol**:

1. **Airfoil Entry:** Enter the target 4-digit NACA profile in the `NACA 4-digit` input box.
2. **Flow Parameters:** Set target Reynolds number ($Re$) slider and ensure `Smagorinsky LES` is checked.
3. **Angle Dialing:**
   - Use the slider for coarse adjustments ($2.0^\circ$ increments).
   - Use the fine stepper buttons (`◀` / `▶` or arrow keys) for high-resolution $0.5^\circ$ increments in the vicinity of the stall peak.
4. **Flow Settling Verification:** After changing angle or flow parameters, look at the telemetry status badge. Wait until the indicator changes from **Flow Settling** to **Flow Settled · Ready** (approx. 3–5 seconds).
5. **Acquire 5s Burst:** Click `⏱ Acquire (5s)` (or press hotkey `L`). The solver integrates forces across exact integer cycles of vortex shedding:
   $$\int_{0}^{T_{\text{shed}}} \sin(\omega t)\, dt \equiv 0$$
   This eliminates phase error from turbulent vortex shedding.
6. **Telemetry Verification:** The polar diagram plots the cycle-mean $C_L$ with vertical error whiskers representing the shedding envelope $[C_{L,\min}, C_{L,\max}]$.
7. **CSV Export:** When your sweep is complete, click `💾 CSV` to download your raw data for plotting and statistical regression.

---

## 👥 Consortium Division Assignments

### 🔹 Division 1: Airfoil Thickness ($t/c$) & Nose Curvature Division
* **Objective:** Quantify how leading-edge radius and airfoil slenderness affect $\alpha_{\text{stall}}$ and determine the optimal thickness for maximum lift and stall delay.
* **Fixed Controls:** Baseline $Re = 1000$, Camber $m = 0\%$ (Symmetric Series), $U_\infty = 0.08$.
* **Airfoil Test Matrix:**
  1. **NACA 0006:** Ultra-thin ($t/c = 6\%$) — Sharp nose, prone to thin-airfoil stall.
  2. **NACA 0009:** Moderately thin ($t/c = 9\%$) — Classic transonic/aerobatic foil.
  3. **NACA 0012:** Benchmark standard ($t/c = 12\%$) — Standard reference section.
  4. **NACA 0018:** Thick subsonic ($t/c = 18\%$) — Blunt leading edge, high structural depth.
  5. **NACA 0024:** Very thick ($t/c = 24\%$) — Strut and wing-root profile.
* **Angle Sweep Range:** $\alpha \in [-2.0^\circ,\, +24.0^\circ]$ ($2.0^\circ$ steps from $-2^\circ$ to $8^\circ$; $0.5^\circ$ steps from $8^\circ$ to $20^\circ$).
* **Required Plots:**
  - **Plot 1.1:** Composite polar plot overlaying $C_L(\alpha)$ for all five thickness ratios.
  - **Plot 1.2:** Functional curves of $\alpha_{\text{stall}}$ vs $(t/c)$ and $C_{L,\max}$ vs $(t/c)$.

---

### 🔹 Division 2: Airfoil Camber ($m$) & Zero-Lift Asymmetry Division
* **Objective:** Determine how mean camber line curvature shifts zero-lift angle $\alpha_0$, alters maximum lift $C_{L,\max}$, and affects the stall angle $\alpha_{\text{stall}}$.
* **Fixed Controls:** Baseline $Re = 1000$, Thickness $t/c = 12\%$, Maximum Camber Location $p = 0.4c$ (NACA X412 family), $U_\infty = 0.08$.
* **Airfoil Test Matrix:**
  1. **NACA 0012:** Symmetric baseline ($m = 0\%$).
  2. **NACA 1412:** Mild camber ($m = 1\%$).
  3. **NACA 2412:** Benchmark camber ($m = 2\%$, typical general aviation).
  4. **NACA 4412:** High-lift camber ($m = 4\%$).
  5. **NACA 6412:** Extreme camber ($m = 6\%$, STOL/cargo section).
* **Angle Sweep Range:** $\alpha \in [-8.0^\circ,\, +22.0^\circ]$ ($2.0^\circ$ steps from $-8^\circ$ to $4^\circ$; $0.5^\circ$ steps through the stall peak).
* **Required Plots:**
  - **Plot 2.1:** Lift-curve slope validation ($dC_L/d\alpha$ vs theoretical $2\pi$) and experimental $\alpha_0$ vs $-1.1 m$.
  - **Plot 2.2:** Functional curve of $\alpha_{\text{stall}}$ vs $m$ and $C_{L,\max}$ vs $m$. (Does camber delay or accelerate stall?)

---

### 🔹 Division 3: Reynolds Number ($Re$) & Viscous Scale Division
* **Objective:** Determine the empirical scaling law connecting Reynolds number to boundary layer momentum and stall angle delay.
* **Fixed Controls:** Standard NACA 2412 profile ($m=2\%, p=0.4c, t/c=12\%$), $U_\infty = 0.08$.
* **Reynolds Number Test Matrix:**
  1. **$Re = 300$:** Viscous-dominated flow (thick laminar boundary layer, micro-air vehicle scale).
  2. **$Re = 600$:** Low Reynolds transitional regime.
  3. **$Re = 1200$:** Standard wind tunnel baseline scale.
  4. **$Re = 2500$:** Moderate Reynolds number with elevated momentum transport.
  5. **$Re = 5000$:** High Reynolds number testing (energized boundary layer).
* **Angle Sweep Range:** $\alpha \in [-4.0^\circ,\, +22.0^\circ]$ for each $Re$ ($0.5^\circ$ resolution in the $[8^\circ, 18^\circ]$ stall zone).
* **Required Plots:**
  - **Plot 3.1:** Family of $C_L(\alpha)$ curves showing the progression of stall softening and delay with increasing $Re$.
  - **Plot 3.2:** Semilogarithmic scaling plot: $\alpha_{\text{stall}}$ vs $\ln(Re)$ and test for power-law correlation $\alpha_{\text{stall}} \propto Re^k$.

---

### 🔹 Division 4: Coupled Interaction & Post-Stall Shedding Dynamics Division
* **Objective:** Interrogate coupled camber-thickness interactions and quantify dynamic vortex shedding oscillation amplitudes and inverted stall asymmetry.
* **Test Matrix A (Coupled Geometry):**
  1. **NACA 4406:** High camber ($4\%$) + Ultra-thin ($6\%$) — Severe suction peak combined with sharp nose.
  2. **NACA 4418:** High camber ($4\%$) + Thick ($18\%$) — Camber-thickness synergy.
  3. **NACA 0006 vs NACA 0018:** Extremes under symmetric conditions.
* **Test Matrix B (Bidirectional Inverted Stall):**
  1. Execute a continuous bidirectional sweep on **NACA 2412** from $\alpha = -16.0^\circ$ to $+20.0^\circ$.
  2. Locate positive stall ($\alpha_{\text{stall}}^+, C_{L,\max}^+$) and inverted negative stall ($\alpha_{\text{stall}}^-, C_{L,\min}^-$).
* **Required Plots:**
  - **Plot 4.1:** Dynamic shedding envelope diagram: plot oscillation amplitude $\Delta C_L = C_{L,\max} - C_{L,\min}$ as a function of degrees past stall $(\alpha - \alpha_{\text{stall}})$.
  - **Plot 4.2:** Cambered airfoil stall asymmetry: contrast positive vs inverted stall modes.

---

## 📊 Consortium Master Data Table

After individual group sweeps, each team uploads their data into the master class table:

| Division | Airfoil / Case | Camber $m$ | Thickness $t/c$ | Reynolds No. $Re$ | Meas. $\alpha_{\text{stall}}$ ($^\circ$) | Meas. $C_{L,\max}$ | Post-Stall $\Delta C_L$ |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **1** | NACA 0006 | 0.00 | 0.06 | 1000 | | | |
| **1** | NACA 0009 | 0.00 | 0.09 | 1000 | | | |
| **1** | NACA 0012 | 0.00 | 0.12 | 1000 | | | |
| **1** | NACA 0018 | 0.00 | 0.18 | 1000 | | | |
| **1** | NACA 0024 | 0.00 | 0.24 | 1000 | | | |
| **2** | NACA 1412 | 0.01 | 0.12 | 1000 | | | |
| **2** | NACA 2412 | 0.02 | 0.12 | 1000 | | | |
| **2** | NACA 4412 | 0.04 | 0.12 | 1000 | | | |
| **2** | NACA 6412 | 0.06 | 0.12 | 1000 | | | |
| **3** | NACA 2412 ($Re=300$) | 0.02 | 0.12 | 300 | | | |
| **3** | NACA 2412 ($Re=600$) | 0.02 | 0.12 | 600 | | | |
| **3** | NACA 2412 ($Re=1200$) | 0.02 | 0.12 | 1200 | | | |
| **3** | NACA 2412 ($Re=2500$) | 0.02 | 0.12 | 2500 | | | |
| **3** | NACA 2412 ($Re=5000$) | 0.02 | 0.12 | 5000 | | | |
| **4** | NACA 4406 | 0.04 | 0.06 | 1000 | | | |
| **4** | NACA 4418 | 0.04 | 0.18 | 1000 | | | |
| **4** | NACA 2412 (Inverted) | 0.02 | 0.12 | 1000 | | | |

---

## 📝 Synthesis & Analysis Questions

Address each prompt in your team's engineering report:

1. **Thickness Optimization & Stall Mechanism Transition:**
   - At what thickness ratio does $\alpha_{\text{stall}}$ peak?
   - Explain the fluid mechanical difference between "thin-airfoil stall" (leading-edge bubble burst) and "trailing-edge stall" (progressive boundary layer thickening).
   - Why does increasing thickness beyond $t/c \approx 0.18$ lead to earlier flow separation?

2. **Camber Effects: Stall Angle vs. Maximum Lift:**
   - Does adding camber increase or decrease $\alpha_{\text{stall}}$?
   - Why does NACA 6412 achieve higher $C_{L,\max}$ than NACA 0012 despite suffering earlier adverse pressure gradients?
   - Compare your experimental linear slope $dC_L/d\alpha$ with theoretical $2\pi$ and zero-lift angle $\alpha_0$ with $-1.1 m$.

3. **Reynolds Number Scaling:**
   - Fit an empirical logarithmic model:
     $$\alpha_{\text{stall}} = A + B \ln\left(\frac{Re}{1000}\right)$$
   - Relate your findings to the laminar boundary layer thickness $\delta \propto 1/\sqrt{Re}$. Why does an energized boundary layer resist separation?

4. **Force Vectors & Vortex Shedding Dynamics:**
   - How does the orientation of the resultant force vector $\vec{R}$ change as the airfoil enters stall?
   - Describe the relationship between the shedding envelope $[C_{L,\min}, C_{L,\max}]$ and the formation of von Kármán vortex streets in the smoke visualization.

5. **Global Multi-Variable Regression Model:**
   Using the master class dataset, perform a multi-linear regression to fit the empirical response surface:
   $$\alpha_{\text{stall}}\left(m,\, \frac{t}{c},\, Re\right) \approx C_0 + C_m \cdot m + C_t \cdot \left(\frac{t}{c}\right) + C_{Re} \cdot \ln\left(\frac{Re}{1000}\right)$$
   Determine the sensitivity coefficients $C_0, C_m, C_t, C_{Re}$ and discuss which physical parameter provides the greatest leverage for delaying stall in subsonic aircraft design.

---

## 💯 Grading Rubric (100 Points Total)

| Criterion | Performance Expectations | Points |
| :--- | :--- | :---: |
| **Experimental Protocol & DAQ Rigor** | Correct execution of 5s burst integration protocol; flow settled state verified; appropriate angle density ($0.5^\circ$ near stall); complete CSV exports. | **20** |
| **Data Visualization & Polar Curves** | Publication-grade polar plots ($C_L$ vs $\alpha$, $C_D$ vs $\alpha$, $L/D$ vs $\alpha$) with error whiskers, stall points clearly identified, and theoretical reference slopes. | **20** |
| **Physical Mechanisms & Aerodynamics** | Sound physical reasoning explaining adverse pressure gradients, suction peaks, boundary layer momentum, vortex shedding, and thin vs trailing-edge stall. | **25** |
| **Consortium Synthesis & Global Regression** | Integration with class dataset; formulation and statistical evaluation of the multi-variable scaling model $\alpha_{\text{stall}} = \Phi(m, t/c, Re)$. | **20** |
| **Technical Communication & Report Format** | Professional engineering report organization; proper unit annotations; clear executive summary, tables, and discussions. | **15** |
| **Total** | | **100** |
