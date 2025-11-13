// Toast container for notifications
let toastContainer = null;

// Define available views map
const viewHandlers = {
  overview: overviewView,
  "active-expired": activeExpiredView,
  "type-distribution": typeDistributionView,
  // Add new view handlers here
  "validity-analytics": validityAnalyticsView,
  "signature-analytics": signatureAnalyticsView,
  "ca-analytics": caAnalyticsView,
  "san-analytics": sanAnalyticsView,
  "trends-analytics": trendsAnalyticsView,
  // Add new certificate analytics views
  "issuer-organization": issuerOrganizationView,
  "issuer-country": issuerCountryView,
  "subject-names": subjectNamesView,
  "ca-domain": caDomainView,
  "ca-url": caUrlView,
  "ca-pubkey": caPubkeyView,
  "shared-pubkeys": sharedPubkeysView,
};

/**
 * Initialize the dashboard
 */
function initDashboard() {
  // Initialize toast container
  initToastContainer();

  // Register views
  registerViews([
    overviewView,
    activeExpiredView,
    typeDistributionView,
    // Register new views
    validityAnalyticsView,
    signatureAnalyticsView,
    caAnalyticsView,
    sanAnalyticsView,
    trendsAnalyticsView,
    // Add newly created views
    issuerOrganizationView,
    issuerCountryView,
    subjectNamesView,
    caDomainView,
    caUrlView,
    caPubkeyView,
    sharedPubkeysView,
  ]);

  // Setup navigation
  setupNavigation();

  // Load initial view
  navigateToView(getInitialView());
}

/**
 * Set up navigation event listeners
 */
function setupNavigation() {
  // Set up navigation event listeners
  document.querySelectorAll("#dashboard-nav .nav-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const viewId = link.getAttribute("data-view");
      if (viewId) {
        navigateTo(viewId);
      }
    });
  });

  // Handle back/forward browser navigation
  window.addEventListener("popstate", () => {
    const viewId = window.location.hash.substring(1) || CONFIG.DEFAULT_VIEW;
    navigateTo(viewId);
  });

  // Add event listeners for ML-related modals
  setupMLModalHandlers();
}

/**
 * Set up ML prediction and anomaly detection modal handlers
 */
function setupMLModalHandlers() {
  // Event delegation for ML prediction button clicks
  document.body.addEventListener("click", async (e) => {
    // ML Prediction button
    if (
      e.target.matches("#run-ml-prediction-btn") ||
      e.target.closest("#run-ml-prediction-btn")
    ) {
      try {
        const modalContent = document.getElementById("mlPredictionsContent");
        modalContent.innerHTML = `
                    <div class="d-flex justify-content-center my-4">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Running ML analysis...</span>
                        </div>
                    </div>
                    <p class="text-center">Analyzing certificate data using ML algorithms...</p>
                `;

        const modal = new bootstrap.Modal(
          document.getElementById("mlPredictionsModal")
        );
        modal.show();

        // Fetch ML predictions using the modal content as the loading container
        const predictions = await API.getMlPredictions("mlPredictionsContent");

        // Display results
        displayMLPredictions(predictions);
      } catch (error) {
        console.error("Error running ML predictions:", error);
        showToast("Failed to run ML predictions. Please try again.", "error");
      }
    }

    // Anomaly Detection button
    if (
      e.target.matches("#run-anomaly-detection-btn") ||
      e.target.closest("#run-anomaly-detection-btn")
    ) {
      try {
        const modalContent = document.getElementById("anomalyContent");
        modalContent.innerHTML = `
                    <div class="d-flex justify-content-center my-4">
                        <div class="spinner-border text-warning" role="status">
                            <span class="visually-hidden">Detecting anomalies...</span>
                        </div>
                    </div>
                    <p class="text-center">Scanning certificate data for anomalies...</p>
                `;

        const modal = new bootstrap.Modal(
          document.getElementById("anomalyModal")
        );
        modal.show();

        // Fetch anomaly detection results using the modal content as the loading container
        const anomalies = await API.getAnomalies("anomalyContent");

        // Display results
        displayAnomalyResults(anomalies);
      } catch (error) {
        console.error("Error detecting anomalies:", error);
        showToast("Failed to detect anomalies. Please try again.", "error");
      }
    }
  });
}

/**
 * Display ML prediction results in the modal
 * @param {Object} predictions - ML prediction data
 */
function displayMLPredictions(predictions) {
  const modalContent = document.getElementById("mlPredictionsContent");
  const predictionData = predictions.predictions;

  if (!predictionData || predictionData.length === 0) {
    modalContent.innerHTML = `
            <div class="alert alert-info">
                No predictions available. Try again later.
            </div>
        `;
    return;
  }

  // Group predictions by risk category
  const highRisk = predictionData.filter((p) => p.risk_category === "High");
  const mediumRisk = predictionData.filter((p) => p.risk_category === "Medium");
  const lowRisk = predictionData.filter((p) => p.risk_category === "Low");

  modalContent.innerHTML = `
        <div class="mb-4">
            <h6 class="fw-bold">ML Risk Analysis Summary</h6>
            <div class="row text-center g-3 mb-3">
                <div class="col-md-4">
                    <div class="p-3 rounded bg-danger bg-opacity-10 border border-danger border-opacity-25">
                        <h3 class="text-danger">${highRisk.length}</h3>
                        <div>High Risk</div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="p-3 rounded bg-warning bg-opacity-10 border border-warning border-opacity-25">
                        <h3 class="text-warning">${mediumRisk.length}</h3>
                        <div>Medium Risk</div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="p-3 rounded bg-success bg-opacity-10 border border-success border-opacity-25">
                        <h3 class="text-success">${lowRisk.length}</h3>
                        <div>Low Risk</div>
                    </div>
                </div>
            </div>
        </div>
        
        ${
          highRisk.length > 0
            ? `
            <h6 class="fw-bold mb-3 text-danger">High Risk Certificates</h6>
            <div class="table-responsive mb-4">
                <table class="table table-sm table-hover">
                    <thead>
                        <tr>
                            <th>Certificate</th>
                            <th>Days Left</th>
                            <th>Risk Score</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${highRisk
                          .map(
                            (cert) => `
                            <tr>
                                <td>${cert.name}</td>
                                <td>${cert.days_remaining}</td>
                                <td>
                                    <div class="risk-score risk-high">${cert.risk_score}</div>
                                </td>
                                <td>
                                    <button type="button" class="btn btn-sm btn-outline-danger">
                                        Renew Now
                                    </button>
                                </td>
                            </tr>
                        `
                          )
                          .join("")}
                    </tbody>
                </table>
            </div>
        `
            : ""
        }
        
        ${
          mediumRisk.length > 0
            ? `
            <h6 class="fw-bold mb-3 text-warning">Medium Risk Certificates</h6>
            <div class="table-responsive mb-4">
                <table class="table table-sm table-hover">
                    <thead>
                        <tr>
                            <th>Certificate</th>
                            <th>Days Left</th>
                            <th>Risk Score</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${mediumRisk
                          .slice(0, 5)
                          .map(
                            (cert) => `
                            <tr>
                                <td>${cert.name}</td>
                                <td>${cert.days_remaining}</td>
                                <td>
                                    <div class="risk-score risk-medium">${cert.risk_score}</div>
                                </td>
                                <td>
                                    <button type="button" class="btn btn-sm btn-outline-warning">
                                        Schedule Renewal
                                    </button>
                                </td>
                            </tr>
                        `
                          )
                          .join("")}
                    </tbody>
                </table>
                ${
                  mediumRisk.length > 5
                    ? `<p class="text-muted small text-end">Showing 5 of ${mediumRisk.length} medium risk certificates</p>`
                    : ""
                }
            </div>
        `
            : ""
        }
    `;
}

/**
 * Display anomaly detection results in the modal
 * @param {Object} anomalies - Anomaly detection data
 */
function displayAnomalyResults(anomalies) {
  const modalContent = document.getElementById("anomalyContent");
  const anomalyData = anomalies.anomalies;

  if (!anomalyData || anomalyData.length === 0) {
    modalContent.innerHTML = `
            <div class="alert alert-success">
                No anomalies detected. Your certificate infrastructure appears to be in good health.
            </div>
        `;
    return;
  }

  modalContent.innerHTML = `
        <div class="mb-4">
            <h6 class="fw-bold">Anomaly Detection Results</h6>
            <p class="text-muted">
                Found ${
                  anomalyData.length
                } potential anomalies in your certificate infrastructure.
            </p>
        </div>
        
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>Certificate</th>
                        <th>Type</th>
                        <th>Anomaly</th>
                        <th>Confidence</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${anomalyData
                      .map(
                        (anomaly) => `
                        <tr>
                            <td>${anomaly.name}</td>
                            <td>${anomaly.type}</td>
                            <td>${anomaly.anomaly_type}</td>
                            <td>${(anomaly.confidence * 100).toFixed(0)}%</td>
                            <td>
                                <button type="button" class="btn btn-sm btn-outline-primary" data-bs-toggle="tooltip" title="${
                                  anomaly.recommendation
                                }">
                                    View Details
                                </button>
                            </td>
                        </tr>
                    `
                      )
                      .join("")}
                </tbody>
            </table>
        </div>
        
        <div class="alert alert-warning mt-3">
            <i class="bi bi-info-circle-fill me-2"></i>
            Recommendation: Review these anomalies and take appropriate actions based on your organization's certificate policies.
        </div>
    `;

  // Initialize tooltips
  const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  tooltips.forEach((tooltip) => new bootstrap.Tooltip(tooltip));
}

/**
 * Initialize toast container for notifications
 */
function initToastContainer() {
  // Create toast container if it doesn't exist
  if (!document.getElementById("toast-container")) {
    toastContainer = document.createElement("div");
    toastContainer.id = "toast-container";
    toastContainer.className =
      "toast-container position-fixed bottom-0 end-0 p-3";
    document.body.appendChild(toastContainer);
  }
}

/**
 * Register views in the application
 * @param {Array} views - Array of view objects to register
 */
function registerViews(views) {
  // Register each view handler
  views.forEach((view) => {
    if (view && view.id) {
      viewHandlers[view.id] = view;
    }
  });
}

/**
 * Navigate to a specific view
 * @param {string} viewId - The ID of the view to navigate to
 */
function navigateToView(viewId) {
  // Default to overview if view not found
  const targetView = viewId in viewHandlers ? viewId : CONFIG.DEFAULT_VIEW;
  navigateTo(targetView);

  // Show welcome toast on initial load
  if (viewId === CONFIG.DEFAULT_VIEW) {
    showToast("Welcome to Certificate Analytics Dashboard", "info");
  }
}

/**
 * Get the initial view based on URL hash or default
 * @returns {string} - The initial view ID
 */
function getInitialView() {
  return window.location.hash.substring(1) || CONFIG.DEFAULT_VIEW;
}

/**
 * Load a view by ID and return a promise
 * @param {string} viewId - The ID of the view to load
 * @returns {Promise} - Promise that resolves when the view is loaded
 */
async function loadView(viewId) {
  try {
    // Update URL hash without triggering popstate
    const currentViewId = window.location.hash.substring(1);
    if (currentViewId !== viewId) {
      history.pushState(null, null, `#${viewId}`);
    }

    // Update navigation active state
    document.querySelectorAll("#dashboard-nav .nav-link").forEach((link) => {
      if (link.getAttribute("data-view") === viewId) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });

    // Get view handler for the requested view or default
    const viewHandler =
      viewHandlers[viewId] || viewHandlers[CONFIG.DEFAULT_VIEW];

    // Get content container
    const contentEl = document.getElementById("dashboard-content");
    if (!contentEl) {
      throw new Error("Dashboard content container not found");
    }

    // Destroy current view if exists
    for (const key in viewHandlers) {
      if (viewHandlers[key].destroy) {
        viewHandlers[key].destroy();
      }
    }

    // Destroy all charts to prevent chart reuse errors
    if (typeof destroyAllCharts === "function") {
      destroyAllCharts();
    }

    // Clear content container
    contentEl.innerHTML = "";

    // Render the view template first
    await viewHandler.render();

    // Now that we have rendered the view template, hide the page loader
    // as the page structure is ready, and only API data is loading
    hideBlobLoader();

    // Load data for the view (this will use API loaders for specific sections)
    if (viewHandler.loadData) {
      await viewHandler.loadData();
    }

    return true;
  } catch (error) {
    // Always hide the blob loader in case of error
    hideBlobLoader();

    console.error("Error loading view:", error);
    document.getElementById("dashboard-content").innerHTML = `
      <div class="alert alert-danger mt-4">
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        Error loading view: ${error.message}
      </div>
    `;
    return false;
  }
}

/**
 * Initialize application
 */
function initializeApp() {
  // Hide the blob loader on initial load
  hideBlobLoader();

  // Set up navigation
  const navLinks = document.querySelectorAll("#dashboard-nav .nav-link");

  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();

      // Show blob loader while changing views
      showBlobLoader();

      const viewId = link.getAttribute("data-view");
      loadView(viewId); // No need for .finally() as we now hide the loader in loadView
    });
  });

  // Load default view
  showBlobLoader();
  loadView(CONFIG.DEFAULT_VIEW); // No need for .finally() as we now hide the loader in loadView
}

// Make sure we wait for DOM to be fully loaded before initializing
document.addEventListener("DOMContentLoaded", function () {
  // Initialize toast container
  initToastContainer();

  // Register all views
  registerViews([
    overviewView,
    activeExpiredView,
    validityAnalyticsView,
    signatureAnalyticsView,
    caAnalyticsView,
    sanAnalyticsView,
    trendsAnalyticsView,
    typeDistributionView,
    issuerOrganizationView,
    issuerCountryView,
    subjectNamesView,
    caDomainView,
    caUrlView,
    caPubkeyView,
    sharedPubkeysView,
  ]);

  // Initialize the application
  initializeApp();
});
