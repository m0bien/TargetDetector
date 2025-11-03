# Interactive Radar Detector

![Application Screenshot](https://storage.googleapis.com/aistudio-project-files/33221a8c-904b-48d6-9467-54876b548b26/app_screenshot.png)

An interactive web application designed to visualize and explore the fundamental principles of radar target detection. This tool provides a hands-on experience for understanding the trade-offs between key radar parameters and their impact on detection performance.

## ✨ Features

- **Interactive Controls:** Dynamically adjust the Detection Threshold, Base Signal-to-Noise Ratio (SNR), and the Number of Integrated Pulses.
- **Live PDF Plots:** See the real-time impact of parameter changes on the Probability Density Functions (PDFs) for noise (Rayleigh) and signal+noise (Rician/Swerling).
- **Swerling Target Models:** Switch between different Swerling models (I, II, III, IV) to simulate various target radar cross-section (RCS) fluctuation scenarios.
- **Calculated Probabilities:** Instantly view the computed Probability of Detection (Pd) and Probability of False Alarm (Pfa).
- **Pulse Integration:** Observe how increasing the number of integrated pulses improves the effective SNR and boosts detection performance.
- **Dual-View Comparison:** Compare a non-fluctuating target (Swerling 0) against a selected fluctuating target side-by-side.
- **Responsive Design:** A clean, modern UI that works on various screen sizes.

## 📡 Core Concepts Demonstrated

This application provides a visual sandbox for understanding key radar engineering concepts:

### 1. The Detection Threshold Trade-Off
The vertical yellow line on the plots represents the **detection threshold**.
- **Probability of False Alarm (Pfa):** The area under the red "Noise" curve to the right of the threshold. It's the probability of declaring a target when only noise is present.
- **Probability of Detection (Pd):** The area under the green "Signal + Noise" curve to the right of the threshold. It's the probability of correctly declaring a target when one is present.

By moving the threshold, you can see the fundamental trade-off: lowering the threshold increases Pd but also unacceptably increases Pfa.

### 2. Signal-to-Noise Ratio (SNR) & Pulse Integration
SNR is the ratio of signal power to noise power. A higher SNR makes a target easier to detect. This app demonstrates the powerful technique of **pulse integration**, where a radar transmits multiple pulses at a target and integrates the returns.

The effective SNR is calculated as:
`Effective SNR (dB) = Base SNR (dB) + 10 * log10(Number of Pulses)`

Use the sliders to see how even a small number of integrated pulses can dramatically improve the effective SNR, separating the signal and noise PDFs and leading to a much higher Pd for a given Pfa.

### 3. Swerling Models for Target Fluctuation
Real-world targets are not static; their radar cross-section (RCS) fluctuates. The Swerling models are statistical representations of this fluctuation:
- **Swerling 0 (Non-Fluctuating):** A constant RCS, modeled by the Rician PDF.
- **Swerling I & II:** Model targets whose RCS fluctuates slowly. The PDF is an exponential function.
- **Swerling III & IV:** Model targets with a dominant scatterer plus smaller scatterers, leading to a different fluctuation pattern and PDF.

Switching between models shows how target fluctuation generally makes detection harder (requires higher SNR for the same Pd) compared to a steady target.

## 🛠️ Technology Stack

- **Frontend:** [React](https://reactjs.org/) (with Hooks)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Plotting:** [Recharts](https://recharts.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)

## 🏗️ How It Works

The application's logic is self-contained and organized for clarity:
- **`App.tsx`**: The main component that manages the application's state (threshold, SNR, etc.) using `useState` and `useEffect` hooks.
- **`components/`**: Contains all reusable React components.
  - `ControlPanel.tsx`: The interactive sliders and selectors.
  - `DetectionPlot.tsx`: The Recharts-based plotting component.
  - `InfoCard.tsx`: Displays the calculated Pd and Pfa values.
- **`services/radarCalculations.ts`**: The core of the simulation. This module contains the mathematical functions for the various PDFs and performs the numerical integration to calculate Pd and Pfa based on the user's input.
