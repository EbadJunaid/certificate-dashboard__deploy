/**
 * Utility functions for the Certificate Analytics Dashboard
 */

/**
 * Format a date string into a readable format
 * @param {string} dateString - ISO date string
 * @param {Object} options - Date formatting options
 * @returns {string} Formatted date string
 */
function formatDate(dateString, options = CONFIG.DATE_FORMAT_OPTIONS.full) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", options);
}

/**
 * Calculate days remaining until a date
 * @param {string} dateString - ISO date string
 * @returns {number} Days remaining (negative if date is in the past)
 */
function daysRemaining(dateString) {
  if (!dateString) return 0;
  const date = new Date(dateString);
  const today = new Date();
  const diffTime = date - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get badge class based on certificate status
 * @param {string} status - Certificate status
 * @returns {string} Badge class
 */
function getStatusBadgeClass(status) {
  switch (status) {
    case "Active":
      return "badge-active";
    case "Expired":
      return "badge-expired";
    default:
      return "bg-secondary";
  }
}

/**
 * Get badge class based on days remaining
 * @param {number} days - Days remaining
 * @returns {string} Badge class
 */
function getExpiryBadgeClass(days) {
  if (days <= CONFIG.EXPIRY_WARNING.CRITICAL) return "bg-danger";
  if (days <= CONFIG.EXPIRY_WARNING.WARNING) return "bg-warning";
  if (days <= CONFIG.EXPIRY_WARNING.NOTICE) return "bg-info";
  return "bg-success";
}

/**
 * Get risk level class based on risk score
 * @param {number} score - Risk score (0-10)
 * @returns {string} Risk class
 */
function getRiskClass(score) {
  if (score >= 7) return "risk-high";
  if (score >= 4) return "risk-medium";
  return "risk-low";
}

/**
 * Get risk level text based on risk score
 * @param {number} score - Risk score (0-10)
 * @returns {string} Risk level text
 */
function getRiskLevelText(score) {
  if (score >= 7) return "High";
  if (score >= 4) return "Medium";
  return "Low";
}

/**
 * Format large numbers with commas
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Show loading spinner in container
 * @param {string} containerId - Container element ID
 */
function showLoading(containerId) {
  showSectionLoader(containerId);
}

/**
 * Show error message in container
 * @param {string} containerId - Container element ID
 * @param {string} message - Error message
 */
function showError(containerId, message) {
  const container = document.getElementById(containerId);
  container.innerHTML = `
        <div class="alert alert-danger" role="alert">
            <i class="bi bi-exclamation-triangle-fill me-2"></i>
            ${message}
        </div>
    `;
}

/**
 * Create a certificate status badge
 * @param {string} status - Certificate status
 * @returns {string} HTML for badge
 */
function createStatusBadge(status) {
  return `<span class="badge ${getStatusBadgeClass(status)}">${status}</span>`;
}

/**
 * Create an expiry badge
 * @param {number} days - Days remaining
 * @returns {string} HTML for badge
 */
function createExpiryBadge(days) {
  let text = "Expired";
  if (days > 0) {
    text = `${days} day${days === 1 ? "" : "s"}`;
  }
  return `<span class="badge ${getExpiryBadgeClass(days)}">${text}</span>`;
}

/**
 * Create a risk score indicator
 * @param {number} score - Risk score (0-10)
 * @returns {string} HTML for risk indicator
 */
function createRiskIndicator(score) {
  return `
        <div class="risk-score ${getRiskClass(
          score
        )}" title="Risk Score: ${score}">
            ${score.toFixed(1)}
        </div>
    `;
}

/**
 * Show a toast notification
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, error, warning, info)
 */
function showToast(message, type = "info") {
  const toastContainer = document.getElementById("toast-container");
  if (!toastContainer) {
    // Create toast container if it doesn't exist
    const container = document.createElement("div");
    container.id = "toast-container";
    container.className = "toast-container position-fixed bottom-0 end-0 p-3";
    document.body.appendChild(container);
  }

  const toastId = "toast-" + Date.now();
  const bgClass =
    type === "success"
      ? "bg-success"
      : type === "error"
      ? "bg-danger"
      : type === "warning"
      ? "bg-warning"
      : "bg-info";

  const toastHtml = `
        <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header ${bgClass} text-white">
                <strong class="me-auto">Certificate Dashboard</strong>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        </div>
    `;

  document.getElementById("toast-container").innerHTML += toastHtml;
  const toastElement = document.getElementById(toastId);
  const toast = new bootstrap.Toast(toastElement);
  toast.show();

  // Remove toast after it's hidden
  toastElement.addEventListener("hidden.bs.toast", function () {
    toastElement.remove();
  });
}

/**
 * Truncate text to a specified length
 * @param {string} text - Text to truncate
 * @param {number} length - Maximum length
 * @returns {string} Truncated text
 */
function truncateText(text, length = 30) {
  if (!text) return "";
  return text.length > length ? text.substring(0, length) + "..." : text;
}

/**
 * Loader Utilities
 */
// Page loader
const pageLoader = {
  show: function () {
    document.getElementById("pageLoader").classList.remove("hidden");
  },
  hide: function () {
    document.getElementById("pageLoader").classList.add("hidden");
  },
};

// Section loader
const createSectionLoader = () => {
  const loaderDiv = document.createElement("div");
  loaderDiv.className = "section-loader";

  const spinner = document.createElement("div");
  spinner.className = "spinner";

  loaderDiv.appendChild(spinner);
  return loaderDiv;
};

// Show section loader in a container
const showSectionLoader = (containerId) => {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Clear existing content
  container.innerHTML = "";

  // Add loader
  container.appendChild(createSectionLoader());
};

// Remove section loader
const removeSectionLoader = (containerId) => {
  const container = document.getElementById(containerId);
  if (!container) return;

  const loader = container.querySelector(".section-loader");
  if (loader) {
    loader.remove();
  }
};

/**
 * Legacy loading utilities compatibility
 * (These are kept for backwards compatibility with existing code)
 */

// Show loading indicator in a container (legacy method)
function showLoading(containerId) {
  showSectionLoader(containerId);
}

// Hide loading indicator in a container (legacy method)
function hideLoading(containerId) {
  removeSectionLoader(containerId);
}
