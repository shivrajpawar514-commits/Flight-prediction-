/**
 * AeroPulse AI - Interactive Client-Side Engine.
 * Handles AJAX predictions, dynamic Plotly visualizers (SHAP waterfall,
 * confidence bell curve, 2D Pareto frontier, radar charts),
 * real-time TOPSIS weight recalculations, and REST API testing sandbox.
 */

// Plotly Dark Glass Theme Base Config
const PLOTLY_DARK_LAYOUT = {
  paper_bgcolor: 'rgba(0,0,0,0)',
  plot_bgcolor: 'rgba(0,0,0,0)',
  font: {
    family: 'Inter, sans-serif',
    color: '#94A3B8',
    size: 12
  },
  margin: { l: 50, r: 30, t: 40, b: 50 },
  xaxis: {
    gridcolor: 'rgba(255, 255, 255, 0.06)',
    zerolinecolor: 'rgba(255, 255, 255, 0.1)',
    tickfont: { color: '#94A3B8' }
  },
  yaxis: {
    gridcolor: 'rgba(255, 255, 255, 0.06)',
    zerolinecolor: 'rgba(255, 255, 255, 0.1)',
    tickfont: { color: '#94A3B8' }
  }
};

const PLOTLY_RESPONSIVE_CONFIG = {
  responsive: true,
  displayModeBar: false
};

document.addEventListener('DOMContentLoaded', () => {
  initForecasterForm();
  initTopsisSliders();
  initApiSandbox();
});

/* ==========================================================================
   1. Real-Time Forecaster, SHAP Waterfall & What-If Engine
   ========================================================================== */

function initForecasterForm() {
  const form = document.getElementById('forecaster-form');
  if (!form) return;

  // Set default datetime values if empty
  const depInput = document.getElementById('Dep_Time');
  const arrInput = document.getElementById('Arrival_Time');

  if (depInput && !depInput.value) {
    const now = new Date();
    now.setDate(now.getDate() + 7);
    now.setHours(9, 30, 0, 0);
    depInput.value = now.toISOString().slice(0, 16);

    const arr = new Date(now);
    arr.setHours(12, 45, 0, 0);
    arrInput.value = arr.toISOString().slice(0, 16);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await executePrediction();
  });

  // Auto-run first prediction on page load
  executePrediction();
}

async function executePrediction() {
  const submitBtn = document.getElementById('predict-btn');
  const resultContainer = document.getElementById('prediction-results-area');
  
  if (submitBtn) {
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Running AI Ensembles...';
    submitBtn.disabled = true;
  }

  const formData = {
    Dep_Time: document.getElementById('Dep_Time').value,
    Arrival_Time: document.getElementById('Arrival_Time').value,
    Source: document.getElementById('Source').value,
    Destination: document.getElementById('Destination').value,
    stops: parseInt(document.getElementById('stops').value),
    airline: document.getElementById('airline').value,
    model_name: document.getElementById('model_name').value
  };

  try {
    const res = await fetch('/api/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const data = await res.json();
    if (data.status === 'success') {
      renderPredictionOutputs(data);
      // Also fetch What-If sensitivity matrix in parallel
      fetchWhatIfMatrix(formData);
    }
  } catch (err) {
    console.error('Prediction failed:', err);
  } finally {
    if (submitBtn) {
      submitBtn.innerHTML = '<i class="fas fa-bolt"></i> Predict Flight Price';
      submitBtn.disabled = false;
    }
  }
}

function renderPredictionOutputs(data) {
  const priceDisplay = document.getElementById('predicted-price-text');
  const ci80Badge = document.getElementById('ci80-badge-text');
  const ci95Badge = document.getElementById('ci95-badge-text');
  const modelBadge = document.getElementById('model-used-badge');
  const advisorBanner = document.getElementById('advisor-banner');
  const advisorTitle = document.getElementById('advisor-title');
  const advisorDesc = document.getElementById('advisor-desc');
  const advisorPill = document.getElementById('advisor-pill');

  const pred = data.prediction;
  const adv = data.advisor;

  if (priceDisplay) priceDisplay.textContent = pred.formatted_price;
  if (ci80Badge) ci80Badge.textContent = `80% CI: ₹${pred.confidence_interval_80.lower.toLocaleString()} – ₹${pred.confidence_interval_80.upper.toLocaleString()} (±${pred.confidence_interval_80.margin_pct}%)`;
  if (ci95Badge) ci95Badge.textContent = `95% CI: ₹${pred.confidence_interval_95.lower.toLocaleString()} – ₹${pred.confidence_interval_95.upper.toLocaleString()}`;
  if (modelBadge) modelBadge.textContent = data.model_used;

  // Advisor Banner Styling
  if (advisorBanner && adv) {
    advisorTitle.textContent = `${adv.action} • ${adv.deal_rating}`;
    advisorDesc.textContent = adv.action_desc;
    advisorPill.textContent = adv.action;

    advisorBanner.className = 'advisor-banner';
    if (adv.deal_badge === 'bargain') {
      advisorBanner.classList.add('advisor-badge-buy');
      advisorPill.style.background = '#10B981';
      advisorPill.style.color = '#000';
    } else if (adv.deal_badge === 'good') {
      advisorBanner.classList.add('advisor-badge-buy');
      advisorPill.style.background = '#34D399';
      advisorPill.style.color = '#000';
    } else if (adv.deal_badge === 'fair') {
      advisorBanner.classList.add('advisor-badge-wait');
      advisorPill.style.background = '#F59E0B';
      advisorPill.style.color = '#000';
    } else {
      advisorBanner.classList.add('advisor-badge-surge');
      advisorPill.style.background = '#F43F5E';
      advisorPill.style.color = '#FFF';
    }
  }

  // Render SHAP Waterfall Plot
  renderShapWaterfall(data.explainability);

  // Render Uncertainty Bell Curve
  renderUncertaintyBellCurve(pred.price, pred.confidence_interval_80, pred.confidence_interval_95);

  // Render 14-day Dynamic Fare Trajectory
  if (adv && adv.trajectory) {
    renderTrajectoryChart(adv.trajectory, pred.price);
  }
}

function renderShapWaterfall(xai) {
  const chartDiv = document.getElementById('shap-waterfall-chart');
  if (!chartDiv || !window.Plotly) return;

  const attributions = xai.attributions;
  const basePrice = xai.base_price;
  const finalPrice = basePrice + xai.net_shift;

  const xLabels = ['Base Fare'];
  const yVals = [basePrice];
  const measures = ['absolute'];
  const textVals = [`₹${basePrice.toLocaleString()}`];
  const hoverText = [`Dataset Base Expected Price: ₹${basePrice.toLocaleString()}`];

  attributions.forEach(item => {
    xLabels.push(item.feature_name);
    yVals.push(item.shap_impact);
    measures.push('relative');
    const sign = item.shap_impact > 0 ? '+' : '';
    textVals.push(`${sign}₹${Math.round(item.shap_impact).toLocaleString()}`);
    hoverText.push(`${item.feature_name}: ${sign}₹${Math.round(item.shap_impact).toLocaleString()}`);
  });

  xLabels.push('Final Prediction');
  yVals.push(finalPrice);
  measures.push('total');
  textVals.push(`₹${Math.round(finalPrice).toLocaleString()}`);
  hoverText.push(`Final Predicted Price: ₹${Math.round(finalPrice).toLocaleString()}`);

  const trace = {
    type: 'waterfall',
    orientation: 'v',
    measure: measures,
    x: xLabels,
    y: yVals,
    text: textVals,
    textposition: 'outside',
    hoverinfo: 'text',
    hovertext: hoverText,
    connector: { line: { color: 'rgba(255, 255, 255, 0.2)', width: 1 } },
    increasing: { marker: { color: '#F43F5E' } }, // Red/Coral increases price
    decreasing: { marker: { color: '#10B981' } }, // Green decreases price
    totals: { marker: { color: '#00F0FF' } }      // Cyan for totals
  };

  const layout = {
    ...PLOTLY_DARK_LAYOUT,
    title: { text: 'SHAP Value Decomposition (₹ Attribution)', font: { color: '#F8FAFC', size: 15 } },
    waterfallgap: 0.3,
    xaxis: {
      ...PLOTLY_DARK_LAYOUT.xaxis,
      tickangle: -25
    },
    yaxis: {
      ...PLOTLY_DARK_LAYOUT.yaxis,
      title: 'Price (INR ₹)'
    }
  };

  Plotly.react('shap-waterfall-chart', [trace], layout, PLOTLY_RESPONSIVE_CONFIG);
}

function renderUncertaintyBellCurve(meanPrice, ci80, ci95) {
  const chartDiv = document.getElementById('uncertainty-bell-chart');
  if (!chartDiv || !window.Plotly) return;

  const std = (ci95.upper - ci95.lower) / 4.0;
  const xVals = [];
  const yVals = [];

  const minX = Math.max(0, meanPrice - 3.2 * std);
  const maxX = meanPrice + 3.2 * std;
  const step = (maxX - minX) / 100;

  for (let x = minX; x <= maxX; x += step) {
    xVals.push(x);
    // Gaussian PDF
    const exponent = -0.5 * Math.pow((x - meanPrice) / std, 2);
    const y = (1.0 / (std * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);
    yVals.push(y);
  }

  const mainCurveTrace = {
    x: xVals,
    y: yVals,
    type: 'scatter',
    mode: 'lines',
    line: { color: '#00F0FF', width: 3 },
    name: 'Probability Density'
  };

  const meanLineTrace = {
    x: [meanPrice, meanPrice],
    y: [0, Math.max(...yVals) * 1.05],
    type: 'scatter',
    mode: 'lines',
    line: { color: '#FFFFFF', width: 2, dash: 'dot' },
    name: `Predicted: ₹${Math.round(meanPrice).toLocaleString()}`
  };

  const layout = {
    ...PLOTLY_DARK_LAYOUT,
    title: { text: 'Prediction Uncertainty & Confidence Bounds', font: { color: '#F8FAFC', size: 15 } },
    showlegend: false,
    xaxis: {
      ...PLOTLY_DARK_LAYOUT.xaxis,
      title: 'Estimated Flight Fare (₹)'
    },
    yaxis: {
      ...PLOTLY_DARK_LAYOUT.yaxis,
      showticklabels: false,
      title: 'Probability Density'
    }
  };

  Plotly.react('uncertainty-bell-chart', [mainCurveTrace, meanLineTrace], layout, PLOTLY_RESPONSIVE_CONFIG);
}

function renderTrajectoryChart(trajectory, currentPrice) {
  const chartDiv = document.getElementById('trajectory-chart');
  if (!chartDiv || !window.Plotly) return;

  const days = trajectory.map(t => `${t.days_before_dep}d Before`);
  const prices = trajectory.map(t => t.projected_price);

  const trace = {
    x: days,
    y: prices,
    type: 'scatter',
    mode: 'lines+markers',
    line: { color: '#6366F1', width: 3, shape: 'spline' },
    marker: { size: 7, color: '#00F0FF' },
    name: 'Dynamic Pricing Curve'
  };

  const layout = {
    ...PLOTLY_DARK_LAYOUT,
    title: { text: '14-Day Forward Dynamic Fare Trajectory', font: { color: '#F8FAFC', size: 15 } },
    xaxis: { ...PLOTLY_DARK_LAYOUT.xaxis, title: 'Lead Time Before Departure' },
    yaxis: { ...PLOTLY_DARK_LAYOUT.yaxis, title: 'Projected Fare (₹)' }
  };

  Plotly.react('trajectory-chart', [trace], layout, PLOTLY_RESPONSIVE_CONFIG);
}

async function fetchWhatIfMatrix(formData) {
  try {
    const res = await fetch('/api/whatif', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const data = await res.json();
    if (data.status === 'success') {
      renderWhatIfTables(data);
    }
  } catch (err) {
    console.error('What-If fetch error:', err);
  }
}

function renderWhatIfTables(data) {
  const airlineTbody = document.getElementById('whatif-airline-tbody');
  const stopsTbody = document.getElementById('whatif-stops-tbody');
  const timesTbody = document.getElementById('whatif-time-tbody');

  if (airlineTbody && data.airline_matrix) {
    airlineTbody.innerHTML = data.airline_matrix.map(row => {
      const diffClass = row.difference < 0 ? 'badge-emerald' : row.difference > 0 ? 'badge-rose' : 'badge-indigo';
      const sign = row.difference > 0 ? '+' : '';
      const activeStyle = row.is_current ? 'style="background: rgba(0, 240, 255, 0.08); font-weight: 600;"' : '';

      return `
        <tr ${activeStyle}>
          <td>${row.airline} ${row.is_current ? '<span class="badge-pill badge-cyan">Selected</span>' : ''}</td>
          <td>₹${row.price.toLocaleString()}</td>
          <td><span class="badge-pill ${diffClass}">${sign}₹${row.difference.toLocaleString()}</span></td>
        </tr>
      `;
    }).join('');
  }

  if (stopsTbody && data.stops_matrix) {
    stopsTbody.innerHTML = data.stops_matrix.map(row => {
      const diffClass = row.difference < 0 ? 'badge-emerald' : row.difference > 0 ? 'badge-rose' : 'badge-indigo';
      const sign = row.difference > 0 ? '+' : '';
      const activeStyle = row.is_current ? 'style="background: rgba(0, 240, 255, 0.08); font-weight: 600;"' : '';

      return `
        <tr ${activeStyle}>
          <td>${row.label} ${row.is_current ? '<span class="badge-pill badge-cyan">Selected</span>' : ''}</td>
          <td>₹${row.price.toLocaleString()}</td>
          <td><span class="badge-pill ${diffClass}">${sign}₹${row.difference.toLocaleString()}</span></td>
        </tr>
      `;
    }).join('');
  }

  if (timesTbody && data.time_shift_matrix) {
    timesTbody.innerHTML = data.time_shift_matrix.map(row => {
      const diffClass = row.difference < 0 ? 'badge-emerald' : row.difference > 0 ? 'badge-rose' : 'badge-indigo';
      const sign = row.difference > 0 ? '+' : '';

      return `
        <tr>
          <td>${row.shift_label}</td>
          <td>₹${row.price.toLocaleString()}</td>
          <td><span class="badge-pill ${diffClass}">${sign}₹${row.difference.toLocaleString()}</span></td>
        </tr>
      `;
    }).join('');
  }
}


/* ==========================================================================
   2. TOPSIS Multi-Criteria Recommender & Pareto Frontier
   ========================================================================== */

function initTopsisSliders() {
  const sliderPrice = document.getElementById('slider-price');
  if (!sliderPrice) return;

  const sliders = ['price', 'duration', 'reliability', 'stops', 'time'];
  sliders.forEach(key => {
    const el = document.getElementById(`slider-${key}`);
    const valTag = document.getElementById(`val-${key}`);
    if (el && valTag) {
      el.addEventListener('input', (e) => {
        valTag.textContent = `${e.target.value}%`;
        debounce(fetchTopsisRankings, 250)();
      });
    }
  });

  const srcFilter = document.getElementById('filter-source');
  const dstFilter = document.getElementById('filter-dest');
  if (srcFilter) srcFilter.addEventListener('change', fetchTopsisRankings);
  if (dstFilter) dstFilter.addEventListener('change', fetchTopsisRankings);

  // Initial fetch
  fetchTopsisRankings();
}

async function fetchTopsisRankings() {
  const payload = {
    weight_price: parseFloat(document.getElementById('slider-price')?.value || 40) / 100,
    weight_duration: parseFloat(document.getElementById('slider-duration')?.value || 25) / 100,
    weight_reliability: parseFloat(document.getElementById('slider-reliability')?.value || 15) / 100,
    weight_stops: parseFloat(document.getElementById('slider-stops')?.value || 10) / 100,
    weight_time: parseFloat(document.getElementById('slider-time')?.value || 10) / 100,
    source: document.getElementById('filter-source')?.value || 'All',
    destination: document.getElementById('filter-dest')?.value || 'All'
  };

  try {
    const res = await fetch('/api/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const json = await res.json();
    if (json.status === 'success') {
      renderTopsisTable(json.data.flights);
      renderParetoFrontier(json.data.flights, json.data.pareto_frontier);
    }
  } catch (err) {
    console.error('TOPSIS ranking error:', err);
  }
}

function renderTopsisTable(flights) {
  const tbody = document.getElementById('recommendations-tbody');
  if (!tbody) return;

  tbody.innerHTML = flights.map((f, idx) => {
    let tagBadgeClass = 'badge-indigo';
    if (f.tag.includes('Top')) tagBadgeClass = 'badge-cyan';
    else if (f.tag.includes('Cheapest')) tagBadgeClass = 'badge-emerald';
    else if (f.tag.includes('Fastest')) tagBadgeClass = 'badge-amber';
    else if (f.tag.includes('Pareto')) tagBadgeClass = 'badge-rose';

    return `
      <tr>
        <td style="font-family: var(--font-heading); font-weight: 700; color: var(--cyan);">#${idx + 1}</td>
        <td>
          <div style="font-weight: 600;">${f.airline}</div>
          <span class="badge-pill ${tagBadgeClass}" style="margin-top: 4px;">${f.tag}</span>
        </td>
        <td>${f.source} → ${f.destination}</td>
        <td>
          <div>${f.dep_time} - ${f.arrival_time}</div>
          <div style="font-size: 12px; color: var(--text-muted);">${f.duration_formatted} • ${f.stops_label}</div>
        </td>
        <td style="font-family: var(--font-heading); font-weight: 700; font-size: 16px;">₹${f.price.toLocaleString()}</td>
        <td>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="flex: 1; background: rgba(255,255,255,0.1); height: 6px; border-radius: 3px; overflow: hidden;">
              <div style="width: ${f.score}%; background: linear-gradient(90deg, #6366F1, #00F0FF); height: 100%;"></div>
            </div>
            <span style="font-family: var(--font-mono); font-weight: 600; color: #00F0FF;">${f.score}</span>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function renderParetoFrontier(allFlights, paretoFlights) {
  const chartDiv = document.getElementById('pareto-scatter-chart');
  if (!chartDiv || !window.Plotly) return;

  const paretoIds = new Set(paretoFlights.map(f => f.id));
  const dominated = allFlights.filter(f => !paretoIds.has(f.id));

  const allTrace = {
    x: dominated.map(f => f.duration_mins),
    y: dominated.map(f => f.price),
    text: dominated.map(f => `${f.airline} (${f.source}→${f.destination})<br>Price: ₹${f.price}<br>Duration: ${f.duration_formatted}`),
    mode: 'markers',
    type: 'scatter',
    name: 'Available Flights',
    marker: { color: 'rgba(148, 163, 184, 0.4)', size: 8 }
  };

  const paretoSorted = [...paretoFlights].sort((a, b) => a.duration_mins - b.duration_mins);
  const paretoTrace = {
    x: paretoSorted.map(f => f.duration_mins),
    y: paretoSorted.map(f => f.price),
    text: paretoSorted.map(f => `🌟 Pareto Optimal: ${f.airline}<br>Price: ₹${f.price}<br>Duration: ${f.duration_formatted}`),
    mode: 'lines+markers',
    type: 'scatter',
    name: 'Pareto Optimal Frontier',
    line: { color: '#00F0FF', width: 2, dash: 'solid' },
    marker: { color: '#F43F5E', size: 11, symbol: 'star' }
  };

  const layout = {
    ...PLOTLY_DARK_LAYOUT,
    title: { text: '2D Pareto Optimal Trade-Off Frontier (Price vs. Duration)', font: { color: '#F8FAFC', size: 15 } },
    xaxis: { ...PLOTLY_DARK_LAYOUT.xaxis, title: 'Flight Duration (Minutes)' },
    yaxis: { ...PLOTLY_DARK_LAYOUT.yaxis, title: 'Flight Price (INR ₹)' }
  };

  Plotly.react('pareto-scatter-chart', [allTrace, paretoTrace], layout, PLOTLY_RESPONSIVE_CONFIG);
}


/* ==========================================================================
   3. Interactive REST API Sandbox & Documentation
   ========================================================================== */

function initApiSandbox() {
  const sendBtn = document.getElementById('api-send-btn');
  if (!sendBtn) return;

  sendBtn.addEventListener('click', async () => {
    const endpoint = document.getElementById('api-endpoint-select').value;
    const method = document.getElementById('api-method-tag').textContent.trim();
    const payloadText = document.getElementById('api-request-payload').value;
    const responseBox = document.getElementById('api-response-viewer');
    const statusTag = document.getElementById('api-status-tag');

    responseBox.textContent = 'Sending request...';

    try {
      const options = {
        method: method,
        headers: { 'Content-Type': 'application/json' }
      };

      if (method === 'POST') {
        options.body = payloadText;
      }

      const t0 = performance.now();
      const res = await fetch(endpoint, options);
      const json = await res.json();
      const t1 = performance.now();

      responseBox.textContent = JSON.stringify(json, null, 2);
      if (statusTag) {
        statusTag.textContent = `${res.status} OK (${Math.round(t1 - t0)}ms)`;
        statusTag.className = 'badge-pill badge-emerald';
      }
    } catch (err) {
      responseBox.textContent = `Error: ${err.message}`;
      if (statusTag) {
        statusTag.textContent = 'Error';
        statusTag.className = 'badge-pill badge-rose';
      }
    }
  });

  const endpointSelect = document.getElementById('api-endpoint-select');
  if (endpointSelect) {
    endpointSelect.addEventListener('change', (e) => {
      updateSandboxTemplates(e.target.value);
    });
  }
}

function updateSandboxTemplates(endpoint) {
  const methodTag = document.getElementById('api-method-tag');
  const payloadBox = document.getElementById('api-request-payload');

  const templates = {
    '/api/predict': {
      method: 'POST',
      body: JSON.stringify({
        Dep_Time: '2026-06-15T09:30',
        Arrival_Time: '2026-06-15T12:45',
        Source: 'Delhi',
        Destination: 'Cochin',
        stops: 0,
        airline: 'IndiGo',
        model_name: 'Stacking Ensemble'
      }, null, 2)
    },
    '/api/whatif': {
      method: 'POST',
      body: JSON.stringify({
        Dep_Time: '2026-06-15T09:30',
        Arrival_Time: '2026-06-15T12:45',
        Source: 'Delhi',
        Destination: 'Cochin',
        stops: 0,
        airline: 'IndiGo'
      }, null, 2)
    },
    '/api/recommend': {
      method: 'POST',
      body: JSON.stringify({
        weight_price: 0.40,
        weight_duration: 0.25,
        weight_reliability: 0.15,
        weight_stops: 0.10,
        weight_time: 0.10,
        source: 'All',
        destination: 'All'
      }, null, 2)
    },
    '/api/benchmark': {
      method: 'GET',
      body: ''
    },
    '/api/analytics/routes': {
      method: 'GET',
      body: ''
    }
  };

  const selected = templates[endpoint] || { method: 'GET', body: '' };
  if (methodTag) methodTag.textContent = selected.method;
  if (payloadBox) payloadBox.value = selected.body;
}

// Utility: Debounce function for performance
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
