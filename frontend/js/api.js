/**
 * API utilities for the Certificate Analytics Dashboard
 */

/**
 * Fetch data from the API
 * @param {string} endpoint - API endpoint path
 * @param {string|null} containerId - ID of the container to show loading indicator (if any)
 * @returns {Promise<Object>} Response data
 */
async function fetchFromAPI(endpoint, containerId = null) {
  try {
    // If a container ID is provided, add API loading indicator
    if (containerId) {
      addApiLoader(containerId);
    }

    const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Remove API loading indicator if container ID was provided
    if (containerId) {
      removeApiLoader(containerId);
    }

    return data;
  } catch (error) {
    // Remove API loading indicator if container ID was provided
    if (containerId) {
      removeApiLoader(containerId);
    }

    console.error("API Error:", error);
    throw error;
  }
}

/**
 * Dashboard API methods
 */
const API = {
  /**
   * Get dashboard overview data
   * @param {string|null} containerId - Container ID for loading indicator
   * @returns {Promise<Object>} Overview data
   */
  getOverview: async function (containerId = null) {
    return await fetchFromAPI(CONFIG.API_ENDPOINTS.OVERVIEW, containerId);
  },

  /**
   * Get all certificates
   * @param {string|null} containerId - Container ID for loading indicator
   * @returns {Promise<Object>} List of certificates
   */
  getAllCertificates: async function (containerId = null) {
    return await fetchFromAPI(CONFIG.API_ENDPOINTS.CERTIFICATES, containerId);
  },

  /**
   * Get active certificates
   * @param {string|null} containerId - Container ID for loading indicator
   * @returns {Promise<Object>} List of active certificates
   */
  getActiveCertificates: async function (containerId = null) {
    return await fetchFromAPI(
      CONFIG.API_ENDPOINTS.ACTIVE_CERTIFICATES,
      containerId
    );
  },

  /**
   * Get expired certificates
   * @param {string|null} containerId - Container ID for loading indicator
   * @returns {Promise<Object>} List of expired certificates
   */
  getExpiredCertificates: async function (containerId = null) {
    return await fetchFromAPI(
      CONFIG.API_ENDPOINTS.EXPIRED_CERTIFICATES,
      containerId
    );
  },

  /**
   * Get certificate type distribution
   * @param {string|null} containerId - Container ID for loading indicator
   * @returns {Promise<Object>} Certificate type data
   */
  getCertificateTypes: async function (containerId = null) {
    return await fetchFromAPI(CONFIG.API_ENDPOINTS.TYPES, containerId);
  },

  /**
   * Get certificate issuance timeline data
   * @param {string|null} containerId - Container ID for loading indicator
   * @returns {Promise<Object>} Timeline data
   */
  getIssuanceTimeline: async function (containerId = null) {
    return await fetchFromAPI(CONFIG.API_ENDPOINTS.TIMELINE, containerId);
  },

  /**
   * Get top issuers data
   * @param {string|null} containerId - Container ID for loading indicator
   * @returns {Promise<Object>} Issuers data
   */
  getTopIssuers: async function (containerId = null) {
    return await fetchFromAPI(CONFIG.API_ENDPOINTS.ISSUERS, containerId);
  },

  /**
   * Get certificates expiring soon
   * @param {string|null} containerId - Container ID for loading indicator
   * @returns {Promise<Object>} Expiring certificates
   */
  getExpiringCertificates: async function (containerId = null) {
    return await fetchFromAPI(CONFIG.API_ENDPOINTS.EXPIRING, containerId);
  },

  /**
   * Get region breakdown data
   * @param {string|null} containerId - Container ID for loading indicator
   * @returns {Promise<Object>} Region data
   */
  getRegionBreakdown: async function (containerId = null) {
    return await fetchFromAPI(CONFIG.API_ENDPOINTS.REGIONS, containerId);
  },

  /**
   * Get department distribution data
   * @param {string|null} containerId - Container ID for loading indicator
   * @returns {Promise<Object>} Department data
   */
  getDepartmentDistribution: async function (containerId = null) {
    return await fetchFromAPI(CONFIG.API_ENDPOINTS.DEPARTMENTS, containerId);
  },

  /**
   * Get ML predictions for certificate expiry risk
   * @param {string|null} containerId - Container ID for loading indicator
   * @returns {Promise<Object>} Prediction data
   */
  getMlPredictions: async function (containerId = null) {
    return await fetchFromAPI(CONFIG.API_ENDPOINTS.ML_PREDICTIONS, containerId);
  },

  /**
   * Get ML anomaly detection results
   * @param {string|null} containerId - Container ID for loading indicator
   * @returns {Promise<Object>} Anomaly data
   */
  getAnomalies: async function (containerId = null) {
    return await fetchFromAPI(CONFIG.API_ENDPOINTS.ANOMALIES, containerId);
  },

  /**
   * Fetches validity distribution data
   * @param {string|null} containerId - Container ID for loading indicator
   * @returns {Promise<Object>} - Validity period distribution data
   */
  getValidityDistribution: async function (containerId = null) {
    return await fetchFromAPI(
      CONFIG.API_ENDPOINTS.VALIDITY_DISTRIBUTION,
      containerId
    );
  },

  /**
   * Fetches hash algorithm distribution data
   * @param {string|null} containerId - Container ID for loading indicator
   * @returns {Promise<Object>} - Hash algorithm distribution data
   */
  getHashAlgorithms: async function (containerId = null) {
    return await fetchFromAPI(
      CONFIG.API_ENDPOINTS.HASH_ALGORITHMS,
      containerId
    );
  },

  /**
   * Fetches signature algorithm distribution data
   * @param {string|null} containerId - Container ID for loading indicator
   * @returns {Promise<Object>} - Signature algorithm distribution data
   */
  getSignatureAlgorithms: async function (containerId = null) {
    return await fetchFromAPI(
      CONFIG.API_ENDPOINTS.SIGNATURE_ALGORITHMS,
      containerId
    );
  },

  /**
   * Fetches certificate authorities data
   * @param {string|null} containerId - Container ID for loading indicator
   * @returns {Promise<Object>} - Certificate authorities distribution data
   */
  getCertificateAuthorities: async function (containerId = null) {
    return await fetchFromAPI(
      CONFIG.API_ENDPOINTS.CERTIFICATE_AUTHORITIES,
      containerId
    );
  },

  /**
   * Fetches intermediate certificate authorities data
   * @param {string|null} containerId - Container ID for loading indicator
   * @returns {Promise<Object>} - Intermediate certificate authorities distribution data
   */
  getIntermediateCAs: async function (containerId = null) {
    return await fetchFromAPI(
      CONFIG.API_ENDPOINTS.INTERMEDIATE_CAS,
      containerId
    );
  },

  /**
   * Fetches SAN distribution data
   * @param {string|null} containerId - Container ID for loading indicator
   * @returns {Promise<Object>} - SAN count distribution data
   */
  getSanDistribution: async function (containerId = null) {
    return await fetchFromAPI(
      CONFIG.API_ENDPOINTS.SAN_DISTRIBUTION,
      containerId
    );
  },

  /**
   * Fetches most common SAN domains
   * @param {string|null} containerId - Container ID for loading indicator
   * @returns {Promise<Object>} - Most common SAN domains data
   */
  getSanDomains: async function (containerId = null) {
    return await fetchFromAPI(CONFIG.API_ENDPOINTS.SAN_DOMAINS, containerId);
  },

  /**
   * Fetches validity period trends over time
   * @param {string|null} containerId - Container ID for loading indicator
   * @returns {Promise<Object>} - Validity period trends data
   */
  getValidityTrends: async function (containerId = null) {
    return await fetchFromAPI(
      CONFIG.API_ENDPOINTS.VALIDITY_TRENDS,
      containerId
    );
  },

  /**
   * Fetches algorithm usage trends over time
   * @param {string|null} containerId - Container ID for loading indicator
   * @returns {Promise<Object>} - Algorithm trends data
   */
  getAlgorithmTrends: async function (containerId = null) {
    return await fetchFromAPI(
      CONFIG.API_ENDPOINTS.ALGORITHM_TRENDS,
      containerId
    );
  },

  /**
   * Fetches issuer organization distribution data
   * @param {string|null} containerId - Container ID for loading indicator
   * @returns {Promise<Object>} - Issuer organization distribution data
   */
  getIssuerOrganizations: async function (containerId = null) {
    return await fetchFromAPI(
      CONFIG.API_ENDPOINTS.ISSUER_ORGANIZATION,
      containerId
    );
  },

  /**
   * Fetches issuer country distribution data
   * @param {string|null} containerId - Container ID for loading indicator
   * @returns {Promise<Object>} - Issuer country distribution data
   */
  getIssuerCountries: async function (containerId = null) {
    return await fetchFromAPI(CONFIG.API_ENDPOINTS.ISSUER_COUNTRY, containerId);
  },

  /**
   * Fetches subject common name distribution data
   * @param {string|null} containerId - Container ID for loading indicator
   * @returns {Promise<Object>} - Subject common name distribution data
   */
  getSubjectCommonNames: async function (containerId = null) {
    return await fetchFromAPI(
      CONFIG.API_ENDPOINTS.SUBJECT_COMMON_NAMES,
      containerId
    );
  },

  /**
   * Fetches CA vs Domain analysis data
   * @param {string|null} containerId - Container ID for loading indicator
   * @returns {Promise<Object>} - CA vs Domain analysis data
   */
  getCaDomainAnalysis: async function (containerId = null) {
    return await fetchFromAPI(
      CONFIG.API_ENDPOINTS.CA_DOMAIN_ANALYSIS,
      containerId
    );
  },

  /**
   * Fetches CA vs URL analysis data
   * @param {string|null} containerId - Container ID for loading indicator
   * @returns {Promise<Object>} - CA vs URL analysis data
   */
  getCaUrlAnalysis: async function (containerId = null) {
    return await fetchFromAPI(
      CONFIG.API_ENDPOINTS.CA_URL_ANALYSIS,
      containerId
    );
  },

  /**
   * Fetches CA vs Public Key analysis data
   * @param {string|null} containerId - Container ID for loading indicator
   * @returns {Promise<Object>} - CA vs Public Key analysis data
   */
  getCaPubkeyAnalysis: async function (containerId = null) {
    return await fetchFromAPI(
      CONFIG.API_ENDPOINTS.CA_PUBKEY_ANALYSIS,
      containerId
    );
  },

  /**
   * Fetches shared public keys analysis data
   * @param {string|null} containerId - Container ID for loading indicator
   * @returns {Promise<Object>} - Shared public keys analysis data
   */
  getSharedPubkeys: async function (containerId = null) {
    return await fetchFromAPI(CONFIG.API_ENDPOINTS.SHARED_PUBKEYS, containerId);
  },
};
