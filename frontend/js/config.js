/**
 * Configuration settings for the Certificate Analytics Dashboard
 */
const CONFIG = {
  // API Endpoints
  API_BASE_URL: "https://certificate-dashboard-deploy.onrender.com",
  API_ENDPOINTS: {
    OVERVIEW: "/api/overview",
    CERTIFICATES: "/api/certificates",
    ACTIVE_CERTIFICATES: "/api/certificates/active",
    EXPIRED_CERTIFICATES: "/api/certificates/expired",
    TYPES: "/api/types",
    TIMELINE: "/api/timeline",
    ISSUERS: "/api/issuers",
    EXPIRING: "/api/expiring",
    REGIONS: "/api/regions",
    DEPARTMENTS: "/api/departments",
    ML_PREDICTIONS: "/api/ml/predict-expiry",
    ANOMALIES: "/api/ml/anomalies",
    VALIDITY_DISTRIBUTION: "/api/validity-distribution",
    HASH_ALGORITHMS: "/api/hash-algorithms",
    SIGNATURE_ALGORITHMS: "/api/signature-algorithms",
    CERTIFICATE_AUTHORITIES: "/api/certificate-authorities",
    INTERMEDIATE_CAS: "/api/intermediate-cas",
    SAN_DISTRIBUTION: "/api/san-distribution",
    SAN_DOMAINS: "/api/san-domains",
    VALIDITY_TRENDS: "/api/validity-trends",
    ALGORITHM_TRENDS: "/api/algorithm-trends",
    ISSUER_ORGANIZATION: "/api/issuer-organization",
    ISSUER_COUNTRY: "/api/issuer-country",
    SUBJECT_COMMON_NAMES: "/api/subject-common-names",
    CA_DOMAIN_ANALYSIS: "/api/ca-domain-analysis",
    CA_URL_ANALYSIS: "/api/ca-url-analysis",
    CA_PUBKEY_ANALYSIS: "/api/ca-pubkey-analysis",
    SHARED_PUBKEYS: "/api/shared-pubkeys",
  },

  // Chart Colors
  CHART_COLORS: {
    PRIMARY: "#1976d2",
    SECONDARY: "#ff9800",
    SUCCESS: "#4caf50",
    DANGER: "#f44336",
    WARNING: "#ff9800",
    INFO: "#2196f3",
    BLUE: "#2196f3",
    GREEN: "#4caf50",
    RED: "#f44336",
    YELLOW: "#ffeb3b",
    PURPLE: "#9c27b0",
    CYAN: "#00bcd4",
    PINK: "#e91e63",
    ORANGE: "#ff9800",
    TEAL: "#009688",
    INDIGO: "#3f51b5",
  },

  // Color palettes for charts
  CHART_COLOR_PALETTE: [
    "#1976d2",
    "#f44336",
    "#4caf50",
    "#ff9800",
    "#9c27b0",
    "#00bcd4",
    "#e91e63",
    "#009688",
    "#3f51b5",
    "#cddc39",
  ],

  // Chart defaults
  CHART_OPTIONS: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: "circle",
        },
      },
      tooltip: {
        cornerRadius: 8,
        caretSize: 6,
        padding: 12,
      },
    },
  },

  // Data refresh interval in milliseconds (5 minutes)
  REFRESH_INTERVAL: 5 * 60 * 1000,

  // Default view
  DEFAULT_VIEW: "overview",

  // Date format options
  DATE_FORMAT_OPTIONS: {
    full: { year: "numeric", month: "long", day: "numeric" },
    short: { year: "numeric", month: "short", day: "numeric" },
    month: { year: "numeric", month: "short" },
  },

  // Expiry warning thresholds in days
  EXPIRY_WARNING: {
    CRITICAL: 7, // 1 week
    WARNING: 30, // 1 month
    NOTICE: 90, // 3 months
  },
};
