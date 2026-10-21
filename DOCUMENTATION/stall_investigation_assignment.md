# 🌪️ NCSSM Connect Program · Honors Aerospace Engineering
## Multi-Group Wind Tunnel Flight Investigation
### Parametric Scaling & Functional Dependence of Aerodynamic Stall: $\alpha_{\text{stall}} = f(\alpha,\, m,\, t/c,\, Re)$
**Platform:** [WindTunnel lab](https://github.com/fsantibanezc/WindTunnel) (2D Lattice Boltzmann Wind Tunnel)  
**Author / Course:** Developed by F. Santibanez, Ph.D. — Honors Aerospace Engineering — NCSSM Connect Program  

---

## 🎯 Mission Briefing & Core Research Objective

In aerodynamics, **aerodynamic stall** represents the sudden loss of lift and surge in drag when airflow separates from the upper surface of a wing. Using **Dimensional Analysis**, we can show that the critical stall angle does not depend on random combinations of units, but on three fundamental dimensionless parameters: airfoil thickness ratio ($t/c$), camber ($m$), and the Reynolds number ($Re$):
$$\alpha_{\text{stall}} = \Phi\left(\frac{t}{c},\, m,\, Re\right) \quad \text{and} \quad C_{L,\max} = \Psi\left(\frac{t}{c},\, m,\, Re\right)$$

Your class is commissioned as an **Aerodynamics Research Consortium** to characterize and map this empirical response surface using the GPU-accelerated **WindTunnel lab**. Students are divided into **three specialized research teams**—each dedicated to one governing dimensionless $\Pi$-group. Following individual team testing, the teams will pool their findings into a master class repository to formulate a unified general power-law scaling model.

---

## 🔬 Dimensional Analysis & The Physics of Stall

### 1. The Physical Problem: What Causes Stall?
When an airfoil moves through air at an angle of attack $\alpha$, fluid streams smoothly over both surfaces, generating lift. However, as $\alpha$ increases, air flowing over the upper surface must turn sharply around the nose and decelerate into an increasing pressure hill (the *adverse pressure gradient*). At a critical angle called the **stall angle** ($\alpha_{\text{stall}}$), the sluggish air near the surface can no longer overcome this hill. The flow detaches (separates) from the upper surface, forming an unsteady, swirling turbulent wake. Lift collapses, drag surges, and the wing stalls.

### 2. Identifying Physical Variables (Dimensional Matrix)
Before conducting wind tunnel experiments, aerospace engineers apply **Dimensional Analysis** (the Buckingham $\Pi$ Theorem) to determine the dimensionless groups that govern the physics:

| Physical Variable | Symbol | SI Units | Dimensions $[M, L, T]$ |
| :--- | :---: | :---: | :---: |
| **Stall Angle of Attack** | $\alpha_{\text{stall}}$ | $\text{rad}$ or $\text{deg}$ | $[1]$ (dimensionless) |
| **Airfoil Chord Length** | $c$ | $\text{m}$ | $[L]$ |
| **Maximum Thickness** | $t$ | $\text{m}$ | $[L]$ |
| **Maximum Camber Height** | $h$ | $\text{m}$ | $[L]$ |
| **Freestream Airspeed** | $U_\infty$ | $\text{m/s}$ | $[L T^{-1}]$ |
| **Air Density** | $\rho$ | $\text{kg/m}^3$ | $[M L^{-3}]$ |
| **Air Dynamic Viscosity** | $\mu$ | $\text{Pa}\cdot\text{s}$ | $[M L^{-1} T^{-1}]$ |

### 3. Applying the Buckingham $\Pi$ Theorem
We have $n = 7$ physical variables expressed in $k = 3$ fundamental dimensions (mass $[M]$, length $[L]$, and time $[T]$). The Buckingham $\Pi$ Theorem proves that the system reduces to exactly $n - k = 7 - 3 = 4$ independent dimensionless groups ($\Pi$-groups):

1. **Target Dimensionless Output ($\Pi_{\alpha} = \alpha_{\text{stall}}$)**: The critical stall angle of attack (dimensionless).
2. **Group 1 ($\Pi_1 = \frac{t}{c}$)**: The **Airfoil Thickness Ratio** (maximum thickness relative to chord).
3. **Group 2 ($\Pi_2 = \frac{h}{c} = m$)**: The **Airfoil Camber Ratio** (maximum camber relative to chord).
4. **Group 3 ($\Pi_3 = \frac{\rho U_\infty c}{\mu} = Re$)**: The **Reynolds Number**, scaling fluid inertia (momentum) against viscous friction.

Therefore, dimensional analysis establishes that the stall angle is strictly governed by three independent dimensionless groups:
$$\mathbf{\alpha_{\text{stall}} = \Phi\left(\Pi_1,\, \Pi_2,\, \Pi_3\right) = \Phi\left(\frac{t}{c},\, m,\, Re\right)}$$

These three independent $\Pi$-groups define the direct division of labor across our **three specialized student research teams**.

During an angle of attack sweep, the dimensionless lift coefficient $C_L = \frac{L}{\frac{1}{2}\rho U_\infty^2 c}$ traces an aerodynamic polar curve:
$$C_L = g\left(\alpha;\, m,\, \frac{t}{c},\, Re\right)$$
whose peak identifies $C_{L,\max}$ occurring at $\alpha = \alpha_{\text{stall}}$.

### 4. Physical Intuition Behind Each Dimensionless Parameter
- **Angle of Attack ($\alpha$):** The operational control variable. In attached flow, lift increases linearly following thin-airfoil theory ($C_L \approx 2\pi(\alpha - \alpha_0)$). As $\alpha$ increases, the suction peak at the leading edge grows sharper until the near-wall flow runs out of energy and separates.
- **Thickness Ratio ($t/c$):** Controls nose roundness ($r_{\text{le}} \propto (t/c)^2$). A sharp, thin airfoil ($t/c = 6\%$) forces air around an abrupt bend, causing sudden bubble bursting and sharp thin-airfoil stall. A blunt, thicker airfoil ($t/c = 18\%$) smooths out the flow turning, promoting progressive trailing-edge stall and delaying separation to higher angles.
- **Camber Ratio ($m$):** Curvature shifts the zero-lift angle to negative values ($\alpha_0 \approx -1.1 m$), producing positive lift at $0^\circ$. However, extra upper-surface curvature steepens the adverse pressure hill, affecting stall onset.
- **Reynolds Number ($Re$):** Measures how fast and energetic the flow is compared to its internal friction. High-$Re$ air has high momentum and thinner boundary layers ($\delta \propto 1/\sqrt{Re}$), enabling it to climb steeper pressure hills without detaching, which delays stall to higher angles.

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
7. **CSV Export:** When your sweep is complete, click `💾 CSV` to download your raw data for plotting and power-law analysis.

---

## 👥 Consortium Research Team Assignments (One per $\Pi$-Group)

The class is partitioned into **three specialized research teams**, corresponding directly to the three dimensionless $\Pi$-groups derived from Buckingham $\Pi$ analysis:
- **Team 1 ($\Pi_1 = t/c$):** Airfoil Thickness & Nose Curvature Team
- **Team 2 ($\Pi_2 = m$):** Airfoil Camber & Zero-Lift Asymmetry Team
- **Team 3 ($\Pi_3 = Re$):** Reynolds Number & Viscous Scale Team

Each team executes systematic angle of attack sweeps across their assigned $\Pi$-group parameter matrix to extract their individual power-law scaling exponent, and additionally acquires one coupled benchmark validation profile to test the consortium's unified general model.

---

### 🔹 Team 1: Airfoil Thickness Ratio ($\Pi_1 = t/c$) Team
* **Objective:** Quantify how leading-edge radius and thickness ratio govern stall onset angle, extract the power-law exponent $a$ in $\alpha_{\text{stall}} \propto (t/c)^a$, and evaluate coupled thin-camber validation profile NACA 4406.
* **Fixed Controls:** Baseline $Re = 1000$, Camber $m = 0\%$ (Symmetric Series), $U_\infty = 0.08$.
* **Primary Airfoil Sweep Matrix:**
  1. **NACA 0006:** Ultra-thin ($t/c = 6\%$) — Sharp nose, prone to thin-airfoil bubble burst.
  2. **NACA 0009:** Moderately thin ($t/c = 9\%$) — Classic transonic/aerobatic foil.
  3. **NACA 0012:** Benchmark standard ($t/c = 12\%$) — Standard reference section.
  4. **NACA 0018:** Thick subsonic ($t/c = 18\%$) — Blunt leading edge, high structural depth.
  5. **NACA 0024:** Very thick ($t/c = 24\%$) — Strut and wing-root profile.
* **Angle Sweep Range:** $\alpha \in [-2.0^\circ,\, +24.0^\circ]$ ($2.0^\circ$ steps from $-2^\circ$ to $8^\circ$; $0.5^\circ$ steps from $8^\circ$ to $20^\circ$).
* **Required Deliverables:**
  - **Plot 1.1:** Composite polar plot overlaying $C_L(\alpha)$ for all five thickness ratios.
  - **Plot 1.2 (Power-Law Evaluation):** Log-log plot of $\ln(\alpha_{\text{stall}})$ vs $\ln(t/c)$ for $t/c \in [0.06, 0.18]$. Determine the thickness exponent $a$ from the slope of $\alpha_{\text{stall}} \propto (t/c)^a$ and document why $t/c = 0.24$ departs from this trend.
  - **Coupled Validation Benchmark:** Sweep **NACA 4406** ($m=0.04, t/c=0.06, Re=1000$) to provide an independent blind-test case evaluating how high camber acts on an ultra-thin leading edge.

---

### 🔹 Team 2: Airfoil Camber Ratio ($\Pi_2 = m$) Team
* **Objective:** Quantify how mean camber line curvature shifts zero-lift angle $\alpha_0$ and stall angle $\alpha_{\text{stall}}$, extract the power-law exponent $b$ in $\alpha_{\text{stall}} \propto (1+m)^b$, and evaluate coupled thick-camber validation profile NACA 4418.
* **Fixed Controls:** Baseline $Re = 1000$, Thickness $t/c = 12\%$, Maximum Camber Location $p = 0.4c$ (NACA X412 family), $U_\infty = 0.08$.
* **Primary Airfoil Sweep Matrix:**
  1. **NACA 0012:** Symmetric baseline ($m = 0\%$).
  2. **NACA 1412:** Mild camber ($m = 1\%$).
  3. **NACA 2412:** Benchmark camber ($m = 2\%$, typical general aviation).
  4. **NACA 4412:** High-lift camber ($m = 4\%$).
  5. **NACA 6412:** Extreme camber ($m = 6\%$, STOL/cargo section).
* **Angle Sweep Range:** $\alpha \in [-8.0^\circ,\, +22.0^\circ]$ ($2.0^\circ$ steps from $-8^\circ$ to $4^\circ$; $0.5^\circ$ steps through the stall peak).
* **Required Deliverables:**
  - **Plot 2.1:** Lift-curve slope validation ($dC_L/d\alpha$ in linear attached regime vs theoretical $2\pi$) and experimental $\alpha_0$ vs $-1.1 m$.
  - **Plot 2.2 (Power-Law Evaluation):** Plot of normalized stall angle $\ln(\alpha_{\text{stall}}/\alpha_{\text{stall},0})$ vs $\ln(1+m)$. Determine the camber exponent $b$ from the slope of $\alpha_{\text{stall}} \propto (1+m)^b$ and contrast against the significant gain in $C_{L,\max}$.
  - **Coupled Validation Benchmark:** Sweep **NACA 4418** ($m=0.04, t/c=0.18, Re=1000$) to provide an independent blind-test case evaluating how a generous nose radius mitigates aggressive camber stall.

---

### 🔹 Team 3: Reynolds Number ($\Pi_3 = Re$) Team
* **Objective:** Quantify how Reynolds number energizes the boundary layer, extract the power-law exponent $c$ in $\alpha_{\text{stall}} \propto Re^c$, and characterize dynamic vortex shedding and inverted stall asymmetry.
* **Fixed Controls:** Standard NACA 2412 profile ($m=2\%, p=0.4c, t/c=12\%$), $U_\infty = 0.08$.
* **Primary Reynolds Number Sweep Matrix:**
  1. **$Re = 300$:** Viscous-dominated flow (thick laminar boundary layer, micro-air vehicle scale).
  2. **$Re = 600$:** Low Reynolds transitional regime.
  3. **$Re = 1200$:** Standard wind tunnel baseline scale.
  4. **$Re = 2500$:** Moderate Reynolds number with elevated momentum transport.
  5. **$Re = 5000$:** High Reynolds number testing (energized boundary layer).
* **Angle Sweep Range:** $\alpha \in [-4.0^\circ,\, +22.0^\circ]$ for each $Re$ ($0.5^\circ$ resolution in the $[8^\circ, 18^\circ]$ stall zone).
* **Required Deliverables:**
  - **Plot 3.1:** Family of $C_L(\alpha)$ curves showing the progression of stall softening and delay with increasing $Re$.
  - **Plot 3.2 (Power-Law Evaluation):** Log-log scaling plot of $\ln(\alpha_{\text{stall}})$ vs $\ln(Re)$ across all five test points. Determine the Reynolds power-law exponent $c$ from the slope of $\alpha_{\text{stall}} \propto Re^c$.
  - **Dynamic Shedding & Inverted Benchmark:** Execute a continuous bidirectional sweep on **NACA 2412** from $\alpha = -16.0^\circ$ to $+20.0^\circ$. Locate positive stall ($\alpha_{\text{stall}}^+, C_{L,\max}^+$) and inverted negative stall ($\alpha_{\text{stall}}^-, C_{L,\min}^-$), and plot shedding amplitude $\Delta C_L = C_{L,\max} - C_{L,\min}$ (error whiskers) past stall.

---

## 📊 Consortium Master Data Table

Following individual team sweeps, each team uploads their data into the master class repository for power-law synthesis and model validation:

| Team | Airfoil / Case | Camber $m$ | Thickness $t/c$ | Reynolds No. $Re$ | Meas. $\alpha_{\text{stall}}$ ($^\circ$) | Meas. $C_{L,\max}$ | Post-Stall $\Delta C_L$ |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **1** | NACA 0006 | 0.00 | 0.06 | 1000 | | | |
| **1** | NACA 0009 | 0.00 | 0.09 | 1000 | | | |
| **1** | NACA 0012 (Symmetric Ref.) | 0.00 | 0.12 | 1000 | | | |
| **1** | NACA 0018 | 0.00 | 0.18 | 1000 | | | |
| **1** | NACA 0024 | 0.00 | 0.24 | 1000 | | | |
| **2** | NACA 1412 | 0.01 | 0.12 | 1000 | | | |
| **2** | NACA 2412 (GA Benchmark) | 0.02 | 0.12 | 1000 | | | |
| **2** | NACA 4412 | 0.04 | 0.12 | 1000 | | | |
| **2** | NACA 6412 | 0.06 | 0.12 | 1000 | | | |
| **3** | NACA 2412 ($Re=300$) | 0.02 | 0.12 | 300 | | | |
| **3** | NACA 2412 ($Re=600$) | 0.02 | 0.12 | 600 | | | |
| **3** | NACA 2412 ($Re=1200$) | 0.02 | 0.12 | 1200 | | | |
| **3** | NACA 2412 ($Re=2500$) | 0.02 | 0.12 | 2500 | | | |
| **3** | NACA 2412 ($Re=5000$) | 0.02 | 0.12 | 5000 | | | |
| **1** | NACA 4406 (Team 1 Coupled Validation) | 0.04 | 0.06 | 1000 | | | |
| **2** | NACA 4418 (Team 2 Coupled Validation) | 0.04 | 0.18 | 1000 | | | |
| **3** | NACA 2412 (Team 3 Inverted Benchmark) | 0.02 | 0.12 | 1000 | | | |

---

## 📝 Synthesis & Analysis Questions

Address each prompt in your team's engineering report:

1. **Team 1 Analysis: Thickness Power-Law ($\Pi_1 = t/c$) & Aerodynamic Limits:**
   - Present your log-log plot of $\ln(\alpha_{\text{stall}})$ vs $\ln(t/c)$ for $t/c \in [0.06, 0.18]$.
   - Determine the empirical thickness power-law exponent $a$ in $\alpha_{\text{stall}} \propto (t/c)^a$.
   - Explain the fluid mechanical difference between "thin-airfoil stall" (leading-edge bubble burst) and "trailing-edge stall" (progressive boundary layer thickening).
   - Why does increasing thickness beyond $t/c \approx 0.18$ lead to a departure from this power-law relationship?

2. **Team 2 Analysis: Camber Power-Law ($\Pi_2 = m$) & Lift Capability:**
   - Present your plot of normalized stall angle $\ln(\alpha_{\text{stall}}/\alpha_{\text{stall},0})$ vs $\ln(1+m)$.
   - Determine the empirical camber power-law exponent $b$ in $\alpha_{\text{stall}} \propto (1+m)^b$.
   - Contrast the effect of camber on $C_{L,\max}$ (significant boost) versus its effect on $\alpha_{\text{stall}}$ (mild shift). Why does NACA 6412 achieve higher $C_{L,\max}$ than NACA 0012 despite an intensified suction peak?
   - Compare your experimental linear slope $dC_L/d\alpha$ in the attached regime with theoretical $2\pi$ and zero-lift angle $\alpha_0$ with $-1.1 m$.

3. **Team 3 Analysis: Reynolds Number Power-Law ($\Pi_3 = Re$) & Viscous Momentum:**
   - Present your log-log scaling plot of $\ln(\alpha_{\text{stall}})$ vs $\ln(Re)$ across all five test points.
   - Determine the empirical Reynolds power-law exponent $c$ in $\alpha_{\text{stall}} \propto Re^c$.
   - Relate your exponent $c$ to the laminar boundary layer thickness scaling $\delta/c \propto Re^{-1/2}$. Why does an energized, thinner boundary layer delay flow separation to higher angles?

4. **Post-Stall Dynamics, Inverted Asymmetry & Force Vector Behavior:**
   - How does the orientation of the resultant force vector $\vec{R}$ change as the airfoil transitions into deep stall?
   - Describe the relationship between the shedding envelope $[C_{L,\min}, C_{L,\max}]$ and the formation of von Kármán vortex street structures in the smoke visualization.
   - Using Team 3's bidirectional sweep, contrast positive stall ($\alpha_{\text{stall}}^+, C_{L,\max}^+$) against inverted stall ($\alpha_{\text{stall}}^-, C_{L,\min}^-$) on NACA 2412.

5. **Consortium Synthesis: Proposing the Unified General Stall Law:**
   Combine the individual power-law dependencies determined separately by Teams 1, 2, and 3 to propose a general multiplicative formula for the stall angle:
   $$\alpha_{\text{stall}}\left(m,\, \frac{t}{c},\, Re\right) = K \cdot \left(\frac{t}{c}\right)^a \cdot (1 + m)^b \cdot Re^c$$

   - **Exponent Assembly:** Substitute the numerical values of exponents $a$, $b$, and $c$ obtained by each $\Pi$-group team.
   - **Calibration Constant:** Using the baseline benchmark airfoil (e.g., NACA 0012 or NACA 2412 at $Re = 1000$), calculate the leading constant $K$:
     $$K = \frac{\alpha_{\text{stall, base}}}{\left(\frac{t}{c}\right)_{\text{base}}^a \cdot (1 + m_{\text{base}})^b \cdot Re_{\text{base}}^c}$$
   - **Model Validation against Coupled Benchmarks:** Use your general formula to predict the stall angle for the coupled validation test cases acquired by Teams 1 and 2:
     1. **NACA 4406:** ($m = 0.04$, $t/c = 0.06$, $Re = 1000$)
     2. **NACA 4418:** ($m = 0.04$, $t/c = 0.18$, $Re = 1000$)
   - Calculate the percentage error between your model's prediction and the experimentally measured stall angle:
     $$\text{Percent Error} = \left| \frac{\alpha_{\text{pred}} - \alpha_{\text{meas}}}{\alpha_{\text{meas}}} \right| \times 100\%$$
   - **Physical Limitations:** Discuss how well the combined product form predicts coupled geometry cases. Under what aerodynamic conditions does the assumption of independent power-law scaling begin to break down?

---

## 💯 Grading Rubric (100 Points Total)

| Criterion | Performance Expectations | Points |
| :--- | :--- | :---: |
| **Experimental Protocol & DAQ Rigor** | Correct execution of 5s burst integration protocol; flow settled state verified; appropriate angle density ($0.5^\circ$ near stall); complete CSV exports. | **20** |
| **Data Visualization & Polar Curves** | Publication-grade polar plots ($C_L$ vs $\alpha$, $C_D$ vs $\alpha$, $L/D$ vs $\alpha$) with error whiskers, stall points clearly identified, and theoretical reference slopes. | **20** |
| **Physical Mechanisms & Aerodynamics** | Sound physical reasoning explaining adverse pressure gradients, suction peaks, boundary layer momentum, vortex shedding, and thin vs trailing-edge stall. | **25** |
| **Consortium Synthesis & Power-Law Model** | Accurate exponent extraction from log-log power-law plots across all three $\Pi$-groups; successful synthesis of general formula $\alpha_{\text{stall}} = K (t/c)^a (1+m)^b Re^c$; validation and error analysis against coupled test cases. | **20** |
| **Technical Communication & Report Format** | Professional engineering report organization; proper unit annotations; clear executive summary, tables, and discussions. | **15** |
| **Total** | | **100** |
