# ✈️ AeroPulse AI — Enterprise Flight Price Prediction & Market Intelligence

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-2.2.3-green.svg)](https://flask.palletsprojects.com/)
[![XGBoost](https://img.shields.io/badge/XGBoost-1.7.5-orange.svg)](https://xgboost.readthedocs.io/)
[![SHAP](https://img.shields.io/badge/SHAP-Explainable%20AI-red.svg)](https://shap.readthedocs.io/)
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

An enterprise-grade **AI/ML Flight Price Prediction & Market Intelligence Platform** powered by Multi-Model Stacking Ensembles, Game-Theoretic Explainable AI (SHAP), Uncertainty Quantification, Multi-Criteria Decision Making (TOPSIS), 2D Pareto Optimal Trade-Off Frontier, Real-Time "What-If" Sensitivity Simulator, and an ultra-modern Cyber-Aviation Glassmorphism UI.

---

## 🚀 Key Features & Innovations

- **🧠 Multi-Model AI Suite & 5-Fold Stratified Cross-Validation**:
  - Compares and benchmarks 6 distinct algorithms: **Stacking Meta-Ensemble**, **XGBoost** ($R^2 = 0.8594$), **Random Forest**, **Extra Trees**, **Hist Gradient Boosting**, and **Ridge Baseline**.
  - Engineered 50 domain features: cyclical time transformations ($\sin/\cos$), geodesic airport distances across Indian domestic routes (DEL, BOM, BLR, CCU, MAA, COK, HYD), flight speed proxies, and interaction terms.

- **🔍 Explainable AI (XAI) via SHAP TreeExplainer**:
  - Decomposes every individual fare prediction into exact rupee contributions ($+\text{₹}$ increases vs. $-\text{₹}$ discounts) on an interactive **Plotly Waterfall Chart**.

- **📊 Uncertainty Quantification & Monte Carlo Volatility Simulation**:
  - Real-time empirical **80% and 95% Confidence / Prediction Intervals** and Gaussian PDF curves.
  - **1,000-sample Monte Carlo pricing paths** simulating market volatility and demand shocks.

- **💡 Smart AI Travel Advisor & "What-If" Sensitivity Simulator**:
  - "Buy Now vs. Wait" decision engine with anomaly & deal classification (*Rare Bargain 🔥*, *Great Deal ✨*, *Fair Price ⚖️*, *Surge ⚠️*).
  - 14-day forward dynamic fare trajectory.
  - Instant scenario matrix comparing all airlines, stopover counts, and departure time windows.

- **🌟 Multi-Criteria TOPSIS Recommender & 2D Pareto Frontier**:
  - TOPSIS multi-attribute decision scoring with customizable user preference sliders (Cost, Travel Time, Reliability, Stops, Convenience).
  - 2D Pareto Optimal Frontier visualizing non-dominated flights in $(Price, Duration)$ trade-off space.

- **🗺️ Geospatial Airport Network & Market Intelligence**:
  - Interactive **Leaflet.js Great-Circle Flight Map of India** with route statistics, airline pricing power index, and temporal seasonality trends.

- **⚡ Production REST API & Interactive Sandbox**:
  - Fully functional JSON API endpoints with an in-browser sandbox console for developers.

---

## 🏆 Multi-Model Benchmark Leaderboard

| Model Architecture | $R^2$ Score | Adjusted $R^2$ | RMSE (₹) | MAE (₹) | MAPE (%) | 5-Fold CV $R^2$ (±Std) | Latency |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **XGBoost Regressor** | **0.8594** | **0.8560** | **₹1,651.18** | **₹1,151.71** | **13.13%** | **0.8316 (±0.024)** | **0.001 ms** |
| **Stacking Meta-Ensemble (Ridge)** | **0.8499** | **0.8463** | **₹1,705.85** | **₹1,170.51** | **13.26%** | **0.8280 (±0.025)** | **0.123 ms** |
| **Random Forest Regressor (Tuned)** | **0.8498** | **0.8462** | **₹1,706.64** | **₹1,128.40** | **12.74%** | **0.8111 (±0.028)** | **0.006 ms** |
| **Hist Gradient Boosting** | **0.8366** | **0.8327** | **₹1,779.94** | **₹1,205.12** | **13.80%** | **0.8033 (±0.024)** | **0.004 ms** |
| **Extra Trees Regressor** | **0.8353** | **0.8314** | **₹1,787.05** | **₹1,136.80** | **12.65%** | **0.8254 (±0.018)** | **0.007 ms** |
| **Ridge Linear Baseline** | **0.6432** | **0.6346** | **₹2,630.50** | **₹1,909.07** | **23.64%** | **0.6043 (±0.014)** | **0.001 ms** |

---

## 🛠️ Installation & Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/shivrajpawar514-commits/Flight-prediction-.git
cd Flight-prediction-
```

### 2. Set Up Virtual Environment
```bash
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. (Optional) Retrain All Models & Generate Benchmarks
```bash
python -m engine.trainer
```

### 5. Launch the Web Application
```bash
python app.py
```

Access the interactive dashboard at **`http://127.0.0.1:4000`**.

---

## 📡 REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/predict` | Predicts fare, 80%/95% confidence intervals, SHAP waterfall attributions, and Buy/Wait advice |
| `POST` | `/api/whatif` | Computes sensitivity analysis across airlines, stop counts, and departure times |
| `POST` | `/api/simulate` | Executes 1,000-sample Monte Carlo price distribution simulation |
| `POST` | `/api/recommend` | Runs TOPSIS MCDM ranking and 2D Pareto Optimal Frontier calculation |
| `GET` | `/api/benchmark` | Returns 6-model cross-validated benchmark metrics & global feature importances |
| `GET` | `/api/analytics/routes`| Returns route network distances, coordinates, and market intelligence |
| `GET` | `/api/features/importance` | Returns top global feature importance rankings |

---

## 📂 Project Architecture

```
├── app.py                     # Flask Server with Web Routes & REST API Endpoints
├── engine/                    # AI/ML Core Engines
│   ├── preprocessor.py        # Cyclical Time & Geodesic Feature Engineering
│   ├── trainer.py             # 6-Model Benchmark & 5-Fold Cross-Validation
│   ├── explainer.py           # SHAP TreeExplainer Local & Global XAI
│   ├── uncertainty.py         # Confidence Intervals & Monte Carlo Simulator
│   ├── advisor.py             # Buy/Wait Advice & 14-Day Trajectory Projection
│   ├── recommender.py         # TOPSIS MCDM & 2D Pareto Optimal Frontier
│   └── analytics.py           # Geospatial Route Network & Airline Market Share
├── model/
│   ├── flight_ensemble_models.pkl # Compressed Serialized Model Artifacts
│   ├── model_benchmark.json       # JSON Metrics Registry
│   └── flight_data.csv            # 10,683 Flight Dataset Records
├── templates/                 # Jinja2 HTML5 Templates
│   ├── base.html              # Cyber-Aviation Glassmorphism Layout
│   ├── home.html              # Forecaster, SHAP Waterfall & What-If Matrix
│   ├── recommend.html         # TOPSIS Sliders & Pareto Frontier Chart
│   ├── dashboard.html         # Leaflet India Flight Map & Market Analytics
│   ├── benchmark.html         # Leaderboard, Radar Chart & ML Principles
│   └── docs.html              # Interactive API Sandbox & Documentation
├── static/
│   ├── style.css              # Glassmorphism Design System & Animations
│   └── main.js                # AJAX Client Engine & Plotly Visualizers
└── requirements.txt           # Python Dependencies
```

---

## 📜 License
This project is open source and available under the [MIT License](LICENSE).
