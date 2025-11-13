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
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(
      `Cannot show loading: Element with ID "${containerId}" not found`
    );
    return;
  }

  container.innerHTML = `
        <div class="d-flex justify-content-center align-items-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>
    `;
}

/**
 * Show error message in container
 * @param {string} containerId - Container element ID
 * @param {string} message - Error message
 */
function showError(containerId, message) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(
      `Cannot show error: Element with ID "${containerId}" not found`
    );
    return;
  }

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
 * Show an alert message to the user
 * @param {string} message - The message to display
 * @param {string} type - Alert type (success, info, warning, error)
 */
function showAlert(message, type = "info") {
  // Use the showToast function for alerts
  showToast(message, type);
}

/**
 * Show the blob loader
 */
function showBlobLoader() {
  const blobLoader = document.getElementById("blob-loader");
  if (blobLoader) {
    blobLoader.style.display = "flex";
  }
}

/**
 * Hide the blob loader
 */
function hideBlobLoader() {
  const blobLoader = document.getElementById("blob-loader");
  if (blobLoader) {
    blobLoader.style.display = "none";
  }
}

/**
 * Add API loading indicator to a container
 * @param {string} containerId - ID of the container element
 */
function addApiLoader(containerId) {
  const container = document.getElementById(containerId);
  if (container) {
    container.classList.add("api-loader");
  }
}

/**
 * Remove API loading indicator from a container
 * @param {string} containerId - ID of the container element
 */
function removeApiLoader(containerId) {
  const container = document.getElementById(containerId);
  if (container) {
    container.classList.remove("api-loader");
  }
}

/**
 * Create pagination for table data
 * @param {Array} data - Array of items to paginate
 * @param {Object} options - Pagination options
 * @param {number} options.currentPage - Current page number (1-indexed)
 * @param {number} options.itemsPerPage - Number of items per page
 * @param {string} options.containerSelector - CSS selector for the pagination container
 * @param {Function} options.onPageChange - Callback function when page changes
 * @returns {Object} Pagination data with current page items and total pages
 */
function createPagination(data, options = {}) {
  const {
    currentPage = 1,
    itemsPerPage = 10,
    containerSelector,
    onPageChange,
  } = options;

  // Calculate total pages
  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Get current page data
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentPageItems = data.slice(startIndex, endIndex);

  // Create pagination UI if container selector is provided
  if (containerSelector) {
    const container = document.querySelector(containerSelector);
    if (!container) return { currentPageItems, totalPages, currentPage };

    // Clear previous pagination
    container.innerHTML = "";

    // Don't show pagination if only one page
    if (totalPages <= 1) return { currentPageItems, totalPages, currentPage };

    // Create pagination element
    const pagination = document.createElement("nav");
    pagination.setAttribute("aria-label", "Table pagination");

    const ul = document.createElement("ul");
    ul.className = "pagination";

    // Previous button
    const prevLi = document.createElement("li");
    prevLi.className = `page-item ${currentPage === 1 ? "disabled" : ""}`;

    const prevLink = document.createElement("a");
    prevLink.className = "page-link";
    prevLink.href = "#";
    prevLink.setAttribute("aria-label", "Previous");
    prevLink.innerHTML = '<span aria-hidden="true">&laquo;</span>';

    if (currentPage > 1) {
      prevLink.addEventListener("click", (e) => {
        e.preventDefault();
        if (typeof onPageChange === "function") {
          onPageChange(currentPage - 1);
        }
      });
    }

    prevLi.appendChild(prevLink);
    ul.appendChild(prevLi);

    // Page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(startPage + maxVisiblePages - 1, totalPages);

    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      const li = document.createElement("li");
      li.className = `page-item ${i === currentPage ? "active" : ""}`;

      const link = document.createElement("a");
      link.className = "page-link";
      link.href = "#";
      link.textContent = i;

      if (i !== currentPage) {
        link.addEventListener("click", (e) => {
          e.preventDefault();
          if (typeof onPageChange === "function") {
            onPageChange(i);
          }
        });
      }

      li.appendChild(link);
      ul.appendChild(li);
    }

    // Next button
    const nextLi = document.createElement("li");
    nextLi.className = `page-item ${
      currentPage === totalPages ? "disabled" : ""
    }`;

    const nextLink = document.createElement("a");
    nextLink.className = "page-link";
    nextLink.href = "#";
    nextLink.setAttribute("aria-label", "Next");
    nextLink.innerHTML = '<span aria-hidden="true">&raquo;</span>';

    if (currentPage < totalPages) {
      nextLink.addEventListener("click", (e) => {
        e.preventDefault();
        if (typeof onPageChange === "function") {
          onPageChange(currentPage + 1);
        }
      });
    }

    nextLi.appendChild(nextLink);
    ul.appendChild(nextLi);

    pagination.appendChild(ul);
    container.appendChild(pagination);
  }

  return { currentPageItems, totalPages, currentPage };
}
