/**
 * API utilities for the Certificate Analytics Dashboard
 */

/**
 * Fetch data from the API
 * @param {string} endpoint - API endpoint path
 * @param {string} [containerId] - Optional container ID for section loader
 * @returns {Promise<Object>} Response data
 */
async function fetchFromAPI(endpoint, containerId) {
  try {
    if (containerId) {
      showSectionLoader(containerId);
    }

    const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (containerId) {
      removeSectionLoader(containerId);
    }

    return data;
  } catch (error) {
    console.error("API Error:", error);
    if (containerId) {
      removeSectionLoader(containerId);
    }
    throw error;
  }
}

/**
 * Dashboard API methods
 */
const API = {
  /**
   * Get dashboard overview data
   * @param {string} [containerId] - Optional container ID for section loader
   * @returns {Promise<Object>} Overview data
   */
  getOverview: async function (containerId) {
    return await fetchFromAPI(CONFIG.API_ENDPOINTS.OVERVIEW, containerId);
  },

  /**
   * Get all certificates
   * @param {string} [containerId] - Optional container ID for section loader
   * @returns {Promise<Object>} List of certificates
   */
  getAllCertificates: async function (containerId) {
    return await fetchFromAPI(CONFIG.API_ENDPOINTS.CERTIFICATES, containerId);
  },

  /**
   * Get active certificates
   * @param {string} [containerId] - Optional container ID for section loader
   * @returns {Promise<Object>} List of active certificates
   */
  getActiveCertificates: async function (containerId) {
    return await fetchFromAPI(
      CONFIG.API_ENDPOINTS.ACTIVE_CERTIFICATES,
      containerId
    );
  },

  /**
   * Get expired certificates
   * @param {string} [containerId] - Optional container ID for section loader
   * @returns {Promise<Object>} List of expired certificates
   */
  getExpiredCertificates: async function (containerId) {
    return await fetchFromAPI(
      CONFIG.API_ENDPOINTS.EXPIRED_CERTIFICATES,
      containerId
    );
  },

  /**
   * Get certificate type distribution
   * @param {string} [containerId] - Optional container ID for section loader
   * @returns {Promise<Object>} Certificate type data
   */
  getCertificateTypes: async function (containerId) {
    return await fetchFromAPI(CONFIG.API_ENDPOINTS.TYPES, containerId);
  },

  /**
   * Get certificate issuance timeline data
   * @param {string} [containerId] - Optional container ID for section loader
   * @returns {Promise<Object>} Timeline data
   */
  getIssuanceTimeline: async function (containerId) {
    return await fetchFromAPI(CONFIG.API_ENDPOINTS.TIMELINE, containerId);
  },

  /**
   * Get top issuers data
   * @param {string} [containerId] - Optional container ID for section loader
   * @returns {Promise<Object>} Issuers data
   */
  getTopIssuers: async function (containerId) {
    return await fetchFromAPI(CONFIG.API_ENDPOINTS.ISSUERS, containerId);
  },

  /**
   * Get certificates expiring soon
   * @param {string} [containerId] - Optional container ID for section loader
   * @returns {Promise<Object>} Expiring certificates
   */
  getExpiringCertificates: async function (containerId) {
    return await fetchFromAPI(CONFIG.API_ENDPOINTS.EXPIRING, containerId);
  },

  /**
   * Get region breakdown data
   * @param {string} [containerId] - Optional container ID for section loader
   * @returns {Promise<Object>} Region data
   */
  getRegionBreakdown: async function (containerId) {
    return await fetchFromAPI(CONFIG.API_ENDPOINTS.REGIONS, containerId);
  },

  /**
   * Get department distribution data
   * @param {string} [containerId] - Optional container ID for section loader
   * @returns {Promise<Object>} Department data
   */
  getDepartmentDistribution: async function (containerId) {
    return await fetchFromAPI(CONFIG.API_ENDPOINTS.DEPARTMENTS, containerId);
  },

  /**
   * Get ML predictions for certificate expiry risk
   * @param {string} [containerId] - Optional container ID for section loader
   * @returns {Promise<Object>} Prediction data
   */
  getMlPredictions: async function (containerId) {
    return await fetchFromAPI(CONFIG.API_ENDPOINTS.ML_PREDICTIONS, containerId);
  },

  /**
   * Get ML anomaly detection results
   * @param {string} [containerId] - Optional container ID for section loader
   * @returns {Promise<Object>} Anomaly data
   */
  getAnomalies: async function (containerId) {
    return await fetchFromAPI(CONFIG.API_ENDPOINTS.ANOMALIES, containerId);
  },
};
