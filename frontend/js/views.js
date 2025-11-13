/**
 * View handlers for the Certificate Analytics Dashboard
 */

// Dashboard chart and data instances
let dashboardCharts = {};
let dashboardData = {};

/**
 * Overview view handler
 */
const overviewView = {
  id: "overview",

  async render() {
    const contentEl = safeGetElement("dashboard-content");
    if (!contentEl) return;

    contentEl.innerHTML = `
            <div class="dashboard-section">
                <h2 class="dashboard-title mb-4">Certificates Overview</h2>
                
                <div class="row mb-4">
                    <div class="col-md-6 col-lg-3 mb-3">
                        <div class="card stat-card">
                            <div class="d-flex justify-content-between">
                                <div>
                                    <div class="stat-label">Total Certificates</div>
                                    <div class="stat-value" id="total-certificates">-</div>
                                </div>
                                <div class="stat-icon">
                                    <i class="bi bi-shield-check"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-6 col-lg-3 mb-3">
                        <div class="card stat-card">
                            <div class="d-flex justify-content-between">
                                <div>
                                    <div class="stat-label">Active Certificates</div>
                                    <div class="stat-value" id="active-certificates">-</div>
                                </div>
                                <div class="stat-icon">
                                    <i class="bi bi-check-circle"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-6 col-lg-3 mb-3">
                        <div class="card stat-card">
                            <div class="d-flex justify-content-between">
                                <div>
                                    <div class="stat-label">Expired Certificates</div>
                                    <div class="stat-value" id="expired-certificates">-</div>
                                </div>
                                <div class="stat-icon">
                                    <i class="bi bi-x-circle"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-6 col-lg-3 mb-3">
                        <div class="card stat-card">
                            <div class="d-flex justify-content-between">
                                <div>
                                    <div class="stat-label">Expiring Soon</div>
                                    <div class="stat-value" id="expiring-certificates">-</div>
                                </div>
                                <div class="stat-icon">
                                    <i class="bi bi-exclamation-triangle"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-md-6 mb-4">
                        <div class="card h-100">
                            <div class="card-header">
                                <h5 class="card-title mb-0">Certificate Status</h5>
                            </div>
                            <div class="card-body">
                                <div class="chart-container">
                                    <canvas id="status-chart"></canvas>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-6 mb-4">
                        <div class="card h-100">
                            <div class="card-header">
                                <h5 class="card-title mb-0">Certificate Types</h5>
                            </div>
                            <div class="card-body">
                                <div class="chart-container">
                                    <canvas id="types-chart"></canvas>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-12 mb-4">
                        <div class="card">
                            <div class="card-header d-flex justify-content-between align-items-center">
                                <h5 class="card-title mb-0">Recent Certificates</h5>
                                <button class="btn btn-sm btn-outline-primary" id="view-all-certs">View All</button>
                            </div>
                            <div class="card-body">
                                <div class="table-responsive">
                                    <table class="table table-hover">
                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>Type</th>
                                                <th>Issuer</th>
                                                <th>Status</th>
                                                <th>Expiry Date</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody id="recent-certificates-table">
                                            <tr>
                                                <td colspan="6" class="text-center">Loading...</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

    // Load overview data
    await this.loadData();

    // Set up event listeners
    safeAddEventListener("view-all-certs", "click", () => {
      navigateTo("active-expired");
    });
  },

  async loadData() {
    try {
      const recentCertsTable = safeGetElement("recent-certificates-table");
      if (recentCertsTable) {
        showLoading("recent-certificates-table");
      }

      // Fetch overview data
      const data = await API.getOverview();
      dashboardData.overview = data;

      // Update stats
      const totalCertsEl = safeGetElement("total-certificates");
      if (totalCertsEl) {
        totalCertsEl.textContent = formatNumber(data.total);
      }

      const activeCertsEl = safeGetElement("active-certificates");
      if (activeCertsEl) {
        activeCertsEl.textContent = formatNumber(data.active);
      }

      const expiredCertsEl = safeGetElement("expired-certificates");
      if (expiredCertsEl) {
        expiredCertsEl.textContent = formatNumber(data.expired);
      }

      const expiringSoonEl = safeGetElement("expiring-certificates");
      if (expiringSoonEl) {
        expiringSoonEl.textContent = formatNumber(data.expiring_soon);
      }

      // Create status chart
      const statusChartEl = document.getElementById("status-chart");
      if (statusChartEl) {
        const statusLabels = ["Active", "Expired"];
        const statusData = [data.active, data.expired];
        dashboardCharts.statusChart = createDoughnutChart(
          "status-chart",
          statusLabels,
          statusData,
          {
            cutout: "70%",
            plugins: {
              tooltip: {
                callbacks: {
                  label: function (context) {
                    const value = context.raw;
                    const total = data.total;
                    const percentage = Math.round((value / total) * 100);
                    return `${context.label}: ${value} (${percentage}%)`;
                  },
                },
              },
            },
          }
        );
      }

      // Create types chart
      const typesChartEl = document.getElementById("types-chart");
      if (typesChartEl) {
        const typesLabels = data.types.map((item) => item._id);
        const typesData = data.types.map((item) => item.count);
        dashboardCharts.typesChart = createDoughnutChart(
          "types-chart",
          typesLabels,
          typesData
        );
      }

      // Fetch certificates for the table
      if (recentCertsTable) {
        const certificates = await API.getAllCertificates();

        // Sort by issue date (newest first) and take the first 5
        const recentCertificates = certificates
          .sort((a, b) => new Date(b.issue_date) - new Date(a.issue_date))
          .slice(0, 5);

        // Update table
        if (recentCertificates.length === 0) {
          recentCertsTable.innerHTML =
            '<tr><td colspan="6" class="text-center">No certificates found</td></tr>';
          return;
        }

        recentCertsTable.innerHTML = recentCertificates
          .map(
            (cert) => `
                  <tr>
                      <td>${cert.name}</td>
                      <td>${cert.type}</td>
                      <td>${cert.issuer}</td>
                      <td>${createStatusBadge(cert.status)}</td>
                      <td>${formatDate(
                        cert.expiry_date,
                        CONFIG.DATE_FORMAT_OPTIONS.short
                      )}</td>
                      <td>
                          <button class="btn btn-sm btn-outline-primary view-cert-details" 
                              data-cert-id="${cert.certificate_id}">
                              <i class="bi bi-info-circle"></i>
                          </button>
                      </td>
                  </tr>
              `
          )
          .join("");

        // Add event listeners for certificate details
        document.querySelectorAll(".view-cert-details").forEach((button) => {
          button.addEventListener("click", async (e) => {
            const certId = e.currentTarget.getAttribute("data-cert-id");
            const cert = certificates.find((c) => c.certificate_id === certId);
            showCertificateDetails(cert);
          });
        });
      }
    } catch (error) {
      console.error("Error loading overview data:", error);
      const contentEl = safeGetElement("dashboard-content");
      if (contentEl) {
        showError(
          "dashboard-content",
          "Failed to load overview data. Please try again later."
        );
      }
    }
  },

  destroy() {
    // Clean up charts to prevent memory leaks
    if (dashboardCharts.statusChart) {
      destroyChart(dashboardCharts.statusChart);
      dashboardCharts.statusChart = null;
    }

    if (dashboardCharts.typesChart) {
      destroyChart(dashboardCharts.typesChart);
      dashboardCharts.typesChart = null;
    }
  },
};

/**
 * Active vs Expired Certificates view handler
 */
const activeExpiredView = {
  id: "active-expired",
  currentActivePage: 1,
  currentExpiredPage: 1,
  activeCertificatesData: [],
  expiredCertificatesData: [],

  async render() {
    const contentEl = safeGetElement("dashboard-content");
    if (!contentEl) return;

    contentEl.innerHTML = `
            <div class="dashboard-section">
                <h2 class="dashboard-title mb-4">Active vs Expired Certificates</h2>
                
                <div class="row mb-4">
                    <div class="col-md-6 mb-3">
                        <div class="card">
                            <div class="card-header d-flex justify-content-between align-items-center">
                                <h5 class="card-title mb-0">Distribution</h5>
                                <div class="btn-group" role="group">
                                    <button type="button" class="btn btn-sm btn-outline-primary active" id="show-chart-btn">Chart</button>
                                    <button type="button" class="btn btn-sm btn-outline-primary" id="show-table-btn">Table</button>
                                </div>
                            </div>
                            <div class="card-body">
                                <div id="status-chart-container">
                                    <div class="chart-container">
                                        <canvas id="active-expired-chart"></canvas>
                                    </div>
                                </div>
                                <div id="status-table-container" class="d-none">
                                    <div class="table-responsive">
                                        <table class="table table-bordered">
                                            <thead>
                                                <tr>
                                                    <th>Status</th>
                                                    <th>Count</th>
                                                    <th>Percentage</th>
                                                </tr>
                                            </thead>
                                            <tbody id="status-stats-table">
                                                <tr>
                                                    <td colspan="3" class="text-center">Loading...</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-6 mb-3">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="card-title mb-0">Status by Department</h5>
                            </div>
                            <div class="card-body">
                                <div class="chart-container">
                                    <canvas id="department-status-chart"></canvas>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="row mb-4">
                    <div class="col-12">
                        <div class="card">
                            <div class="card-header">
                                <ul class="nav nav-tabs card-header-tabs" id="certificate-tabs" role="tablist">
                                    <li class="nav-item" role="presentation">
                                        <button class="nav-link active" id="active-tab" data-bs-toggle="tab" data-bs-target="#active-certificates-tab" type="button" role="tab" aria-controls="active-certificates-tab" aria-selected="true">
                                            Active Certificates
                                        </button>
                                    </li>
                                    <li class="nav-item" role="presentation">
                                        <button class="nav-link" id="expired-tab" data-bs-toggle="tab" data-bs-target="#expired-certificates-tab" type="button" role="tab" aria-controls="expired-certificates-tab" aria-selected="false">
                                            Expired Certificates
                                        </button>
                                    </li>
                                </ul>
                            </div>
                            <div class="card-body">
                                <div class="tab-content" id="certificate-tabs-content">
                                    <div class="tab-pane fade show active" id="active-certificates-tab" role="tabpanel" aria-labelledby="active-tab">
                                        <div class="table-responsive">
                                            <table class="table table-hover">
                                                <thead>
                                                    <tr>
                                                        <th>Name</th>
                                                        <th>Type</th>
                                                        <th>Issuer</th>
                                                        <th>Department</th>
                                                        <th>Issue Date</th>
                                                        <th>Expiry Date</th>
                                                        <th>Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody id="active-certificates-table">
                                                    <tr>
                                                        <td colspan="7" class="text-center">Loading...</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                            <div id="active-certificates-pagination" class="pagination-container"></div>
                                        </div>
                                    </div>
                                    <div class="tab-pane fade" id="expired-certificates-tab" role="tabpanel" aria-labelledby="expired-tab">
                                        <div class="table-responsive">
                                            <table class="table table-hover">
                                                <thead>
                                                    <tr>
                                                        <th>Name</th>
                                                        <th>Type</th>
                                                        <th>Issuer</th>
                                                        <th>Department</th>
                                                        <th>Issue Date</th>
                                                        <th>Expiry Date</th>
                                                        <th>Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody id="expired-certificates-table">
                                                    <tr>
                                                        <td colspan="7" class="text-center">Loading...</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                            <div id="expired-certificates-pagination" class="pagination-container"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

    // Toggle between chart and table
    safeAddEventListener("show-chart-btn", "click", () => {
      const chartBtn = safeGetElement("show-chart-btn");
      const tableBtn = safeGetElement("show-table-btn");
      const chartContainer = safeGetElement("status-chart-container");
      const tableContainer = safeGetElement("status-table-container");

      if (chartBtn) chartBtn.classList.add("active");
      if (tableBtn) tableBtn.classList.remove("active");
      if (chartContainer) chartContainer.classList.remove("d-none");
      if (tableContainer) tableContainer.classList.add("d-none");
    });

    safeAddEventListener("show-table-btn", "click", () => {
      const chartBtn = safeGetElement("show-chart-btn");
      const tableBtn = safeGetElement("show-table-btn");
      const chartContainer = safeGetElement("status-chart-container");
      const tableContainer = safeGetElement("status-table-container");

      if (chartBtn) chartBtn.classList.remove("active");
      if (tableBtn) tableBtn.classList.add("active");
      if (chartContainer) chartContainer.classList.add("d-none");
      if (tableContainer) tableContainer.classList.remove("d-none");
    });

    await this.loadData();
  },

  /**
   * Update active certificates table with pagination
   */
  renderActiveCertificatesTable() {
    const activeCertsTable = safeGetElement("active-certificates-table");
    if (!activeCertsTable) return;

    // Get paginated data
    const { currentPageItems } = createPagination(this.activeCertificatesData, {
      currentPage: this.currentActivePage,
      itemsPerPage: 10,
      containerSelector: "#active-certificates-pagination",
      onPageChange: (page) => {
        this.currentActivePage = page;
        this.renderActiveCertificatesTable();
      },
    });

    if (currentPageItems.length === 0) {
      activeCertsTable.innerHTML =
        '<tr><td colspan="7" class="text-center">No active certificates found</td></tr>';
    } else {
      activeCertsTable.innerHTML = currentPageItems
        .map(
          (cert) => `
                <tr>
                    <td>${cert.name}</td>
                    <td>${cert.type}</td>
                    <td>${cert.issuer}</td>
                    <td>${cert.department}</td>
                    <td>${formatDate(
                      cert.issue_date,
                      CONFIG.DATE_FORMAT_OPTIONS.short
                    )}</td>
                    <td>${formatDate(
                      cert.expiry_date,
                      CONFIG.DATE_FORMAT_OPTIONS.short
                    )}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary view-cert-details" 
                            data-cert-id="${cert.certificate_id}">
                            <i class="bi bi-info-circle"></i>
                        </button>
                    </td>
                </tr>
            `
        )
        .join("");
    }

    // Add event listeners for certificate details
    document
      .querySelectorAll("#active-certificates-table .view-cert-details")
      .forEach((button) => {
        button.addEventListener("click", (e) => {
          const certId = e.currentTarget.getAttribute("data-cert-id");
          const cert = this.activeCertificatesData.find(
            (c) => c.certificate_id === certId
          );
          showCertificateDetails(cert);
        });
      });
  },

  /**
   * Update expired certificates table with pagination
   */
  renderExpiredCertificatesTable() {
    const expiredCertsTable = safeGetElement("expired-certificates-table");
    if (!expiredCertsTable) return;

    // Get paginated data
    const { currentPageItems } = createPagination(
      this.expiredCertificatesData,
      {
        currentPage: this.currentExpiredPage,
        itemsPerPage: 10,
        containerSelector: "#expired-certificates-pagination",
        onPageChange: (page) => {
          this.currentExpiredPage = page;
          this.renderExpiredCertificatesTable();
        },
      }
    );

    if (currentPageItems.length === 0) {
      expiredCertsTable.innerHTML =
        '<tr><td colspan="7" class="text-center">No expired certificates found</td></tr>';
    } else {
      expiredCertsTable.innerHTML = currentPageItems
        .map(
          (cert) => `
                <tr>
                    <td>${cert.name}</td>
                    <td>${cert.type}</td>
                    <td>${cert.issuer}</td>
                    <td>${cert.department}</td>
                    <td>${formatDate(
                      cert.issue_date,
                      CONFIG.DATE_FORMAT_OPTIONS.short
                    )}</td>
                    <td>${formatDate(
                      cert.expiry_date,
                      CONFIG.DATE_FORMAT_OPTIONS.short
                    )}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary view-cert-details" 
                            data-cert-id="${cert.certificate_id}">
                            <i class="bi bi-info-circle"></i>
                        </button>
                    </td>
                </tr>
            `
        )
        .join("");
    }

    // Add event listeners for certificate details
    document
      .querySelectorAll("#expired-certificates-table .view-cert-details")
      .forEach((button) => {
        button.addEventListener("click", (e) => {
          const certId = e.currentTarget.getAttribute("data-cert-id");
          const cert = this.expiredCertificatesData.find(
            (c) => c.certificate_id === certId
          );
          showCertificateDetails(cert);
        });
      });
  },

  async loadData() {
    try {
      // Fetch data (using container IDs for API loaders)
      const response = await API.getOverview("dashboard-content");
      const activeCertificates = await API.getActiveCertificates(
        "active-certificates-table"
      );
      const expiredCertificates = await API.getExpiredCertificates(
        "expired-certificates-table"
      );

      const statusData = response.status_distribution;
      const departmentStatusData = response.department_status;

      // Create active vs expired chart
      if (statusData) {
        const labels = statusData.map((item) => item._id);
        const data = statusData.map((item) => item.count);
        const backgroundColors = [
          "rgba(76, 175, 80, 0.8)",
          "rgba(244, 67, 54, 0.8)",
        ];

        const chartEl = document.getElementById("active-expired-chart");
        if (chartEl) {
          createDoughnutChart("active-expired-chart", labels, data, {
            backgroundColor: backgroundColors,
          });
        }

        // Update status stats table
        const statusStatsTable = document.getElementById("status-stats-table");
        if (statusStatsTable) {
          const totalCerts = data.reduce((sum, count) => sum + count, 0);

          statusStatsTable.innerHTML = `
                <tr>
                    <td><span class="badge badge-active">Active</span></td>
                    <td>${formatNumber(
                      statusData.find((item) => item._id === "Active")?.count ||
                        0
                    )}</td>
                    <td>${(
                      ((statusData.find((item) => item._id === "Active")
                        ?.count || 0) /
                        totalCerts) *
                      100
                    ).toFixed(1)}%</td>
                </tr>
                <tr>
                    <td><span class="badge badge-expired">Expired</span></td>
                    <td>${formatNumber(
                      statusData.find((item) => item._id === "Expired")
                        ?.count || 0
                    )}</td>
                    <td>${(
                      ((statusData.find((item) => item._id === "Expired")
                        ?.count || 0) /
                        totalCerts) *
                      100
                    ).toFixed(1)}%</td>
                </tr>
                <tr class="table-light">
                    <td><strong>Total</strong></td>
                    <td><strong>${formatNumber(totalCerts)}</strong></td>
                    <td>100%</td>
                </tr>
            `;
        }
      }

      // Create department status chart
      if (departmentStatusData) {
        const departments = [
          ...new Set(departmentStatusData.map((item) => item.department)),
        ];
        const statusTypes = [
          ...new Set(departmentStatusData.map((item) => item.status)),
        ];

        const datasets = statusTypes.map((status) => {
          const color =
            status === "Active"
              ? "rgba(76, 175, 80, 0.7)"
              : "rgba(244, 67, 54, 0.7)";
          const borderColor =
            status === "Active"
              ? "rgba(76, 175, 80, 1)"
              : "rgba(244, 67, 54, 1)";

          return {
            label: status,
            data: departments.map((dept) => {
              const item = departmentStatusData.find(
                (d) => d.department === dept && d.status === status
              );
              return item ? item.count : 0;
            }),
            backgroundColor: color,
            borderColor: borderColor,
            borderWidth: 1,
          };
        });

        const chartEl = document.getElementById("department-status-chart");
        if (chartEl) {
          createBarChart("department-status-chart", departments, datasets, {
            stacked: true,
            aspectRatio: 1.5,
          });
        }
      }

      // Store certificates data and render tables with pagination
      this.activeCertificatesData = activeCertificates || [];
      this.expiredCertificatesData = expiredCertificates || [];

      // Render tables with pagination
      this.renderActiveCertificatesTable();
      this.renderExpiredCertificatesTable();
    } catch (error) {
      console.error("Error loading active/expired data:", error);
      showError(
        "dashboard-content",
        "Failed to load certificate data. Please try again later."
      );
    }
  },

  destroy() {
    // Clean up charts to prevent memory leaks
    if (dashboardCharts.activeExpiredChart) {
      destroyChart(dashboardCharts.activeExpiredChart);
      dashboardCharts.activeExpiredChart = null;
    }
    if (dashboardCharts.departmentStatusChart) {
      destroyChart(dashboardCharts.departmentStatusChart);
      dashboardCharts.departmentStatusChart = null;
    }
  },
};

/**
 * Type Distribution view handler
 */
const typeDistributionView = {
  id: "type-distribution",

  async render() {
    const contentEl = document.getElementById("dashboard-content");
    contentEl.innerHTML = `
            <div class="dashboard-section">
                <h2 class="dashboard-title mb-4">Certificate Type Distribution</h2>
                
                <div class="row mb-4">
                    <div class="col-lg-5 mb-3">
                        <div class="card h-100">
                            <div class="card-header">
                                <h5 class="card-title mb-0">Type Distribution</h5>
                            </div>
                            <div class="card-body">
                                <div class="chart-container">
                                    <canvas id="type-distribution-chart"></canvas>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-lg-7 mb-3">
                        <div class="card h-100">
                            <div class="card-header">
                                <h5 class="card-title mb-0">Certificate Types by Status</h5>
                            </div>
                            <div class="card-body">
                                <div class="chart-container">
                                    <canvas id="type-status-chart"></canvas>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-12 mb-4">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="card-title mb-0">Certificate Types Breakdown</h5>
                            </div>
                            <div class="card-body">
                                <div class="table-responsive">
                                    <table class="table table-hover">
                                        <thead>
                                            <tr>
                                                <th>Type</th>
                                                <th>Count</th>
                                                <th>Active</th>
                                                <th>Expired</th>
                                                <th>Percentage</th>
                                            </tr>
                                        </thead>
                                        <tbody id="type-stats-table">
                                            <tr>
                                                <td colspan="5" class="text-center">Loading...</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

    // Load type distribution data
    await this.loadData();
  },

  async loadData() {
    try {
      // Fetch data
      const activeCertificates = await API.getActiveCertificates();
      const expiredCertificates = await API.getExpiredCertificates();
      const typesData = await API.getCertificateTypes();

      // All certificates
      const allCertificates = [...activeCertificates, ...expiredCertificates];

      // Create type distribution chart
      const typeLabels = typesData.types.map((type) => type._id);
      const typeCounts = typesData.types.map((type) => type.count);

      dashboardCharts.typeDistributionChart = createDoughnutChart(
        "type-distribution-chart",
        typeLabels,
        typeCounts
      );

      // Group certificates by type and status
      const typeData = {};
      typeLabels.forEach((type) => {
        typeData[type] = {
          type: type,
          total: 0,
          active: 0,
          expired: 0,
        };
      });

      allCertificates.forEach((cert) => {
        if (typeData[cert.type]) {
          typeData[cert.type].total++;
          if (cert.status === "Active") {
            typeData[cert.type].active++;
          } else {
            typeData[cert.type].expired++;
          }
        }
      });

      // Create type by status chart
      const activeByType = typeLabels.map((type) => typeData[type].active);
      const expiredByType = typeLabels.map((type) => typeData[type].expired);

      dashboardCharts.typeStatusChart = createMultiChart(
        "type-status-chart",
        typeLabels,
        [
          {
            label: "Active",
            data: activeByType,
            backgroundColor: CONFIG.CHART_COLORS.SUCCESS,
            borderWidth: 0,
            borderRadius: 4,
          },
          {
            label: "Expired",
            data: expiredByType,
            backgroundColor: CONFIG.CHART_COLORS.DANGER,
            borderWidth: 0,
            borderRadius: 4,
          },
        ],
        "bar",
        {
          scales: {
            x: {
              stacked: true,
              grid: {
                display: false,
              },
            },
            y: {
              stacked: true,
              beginAtZero: true,
              grid: {
                color: "rgba(0, 0, 0, 0.05)",
              },
            },
          },
        }
      );

      // Update type stats table
      const typeStatsTable = document.getElementById("type-stats-table");
      const total = allCertificates.length;

      typeStatsTable.innerHTML = typeLabels
        .map((type) => {
          const data = typeData[type];
          const percentage = Math.round((data.total / total) * 100);

          return `
                    <tr>
                        <td>${type}</td>
                        <td>${data.total}</td>
                        <td>${data.active}</td>
                        <td>${data.expired}</td>
                        <td>${percentage}%</td>
                    </tr>
                `;
        })
        .join("");
    } catch (error) {
      console.error("Error loading type distribution data:", error);
      showError(
        "dashboard-content",
        "Failed to load certificate type data. Please try again later."
      );
    }
  },

  destroy() {
    // Clean up charts to prevent memory leaks
    if (dashboardCharts.typeDistributionChart) {
      destroyChart(dashboardCharts.typeDistributionChart);
      dashboardCharts.typeDistributionChart = null;
    }

    if (dashboardCharts.typeStatusChart) {
      destroyChart(dashboardCharts.typeStatusChart);
      dashboardCharts.typeStatusChart = null;
    }
  },
};

/**
 * Validity Analytics view handler
 */
const validityAnalyticsView = {
  id: "validity-analytics",

  async render() {
    const contentEl = document.getElementById("dashboard-content");
    contentEl.innerHTML = `
      <div class="dashboard-section">
        <h2 class="dashboard-title mb-4">Certificate Validity Analytics</h2>

        <div class="row mb-4">
          <div class="col-lg-6 mb-4">
            <div class="card h-100">
              <div class="card-header">
                <h5 class="card-title mb-0">Validity Period Distribution</h5>
              </div>
              <div class="card-body">
                <div class="chart-container">
                  <canvas id="validity-distribution-chart"></canvas>
                </div>
              </div>
            </div>
          </div>

          <div class="col-lg-6 mb-4">
            <div class="card h-100">
              <div class="card-header">
                <h5 class="card-title mb-0">Validity Period Trends</h5>
              </div>
              <div class="card-body">
                <div class="chart-container">
                  <canvas id="validity-trends-chart"></canvas>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="row mb-4">
          <div class="col-lg-12 mb-4">
            <div class="card">
              <div class="card-header">
                <h5 class="card-title mb-0">Expiration Timeline</h5>
              </div>
              <div class="card-body">
                <div class="chart-container">
                  <canvas id="expiration-timeline-chart"></canvas>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Load data and create visualizations
    await this.loadData();
  },

  async loadData() {
    try {
      // Fetch validity distribution data
      const validityDistData = await API.getValidityDistribution();
      const validityLabels = validityDistData.validity_periods.map(
        (item) => item.range
      );
      const validityData = validityDistData.validity_periods.map(
        (item) => item.count
      );

      // Create validity distribution chart
      dashboardCharts.validityDistributionChart = createBarChart(
        "validity-distribution-chart",
        validityLabels,
        validityData,
        "Certificates",
        {
          indexAxis: "y",
          plugins: {
            title: {
              display: true,
              text: "Certificate Validity Period Distribution",
            },
          },
        }
      );

      // Fetch validity trends data
      const validityTrendsData = await API.getValidityTrends();
      const trendLabels = validityTrendsData.validity_trends.map(
        (item) => item._id
      );
      const trendData = validityTrendsData.validity_trends.map((item) =>
        Math.round(item.avg_validity)
      );
      const trendCountData = validityTrendsData.validity_trends.map(
        (item) => item.count
      );

      // Create validity trends chart
      dashboardCharts.validityTrendsChart = createMultiChart(
        "validity-trends-chart",
        trendLabels,
        [
          {
            type: "line",
            label: "Avg. Validity (days)",
            data: trendData,
            borderColor: CONFIG.CHART_COLORS.PRIMARY,
            backgroundColor: "rgba(25, 118, 210, 0.1)",
            fill: true,
            yAxisID: "y",
          },
          {
            type: "bar",
            label: "Certificate Count",
            data: trendCountData,
            backgroundColor: CONFIG.CHART_COLORS.SECONDARY,
            borderRadius: 4,
            yAxisID: "y1",
          },
        ],
        "bar",
        {
          scales: {
            y: {
              type: "linear",
              display: true,
              position: "left",
              beginAtZero: true,
              title: {
                display: true,
                text: "Avg. Validity Period (days)",
              },
            },
            y1: {
              type: "linear",
              display: true,
              position: "right",
              beginAtZero: true,
              grid: {
                drawOnChartArea: false,
              },
              title: {
                display: true,
                text: "Certificate Count",
              },
            },
          },
        }
      );

      // Create expiration timeline
      // Get active certificates and organize by expiration year
      const activeCerts = await API.getActiveCertificates();
      const expirationData = {};

      activeCerts.forEach((cert) => {
        const expiryDate = new Date(cert.parsed.validity.end);
        const year = expiryDate.getFullYear();
        const month = expiryDate.getMonth();

        const yearMonth = `${year}-${String(month + 1).padStart(2, "0")}`;

        if (!expirationData[yearMonth]) {
          expirationData[yearMonth] = 0;
        }

        expirationData[yearMonth]++;
      });

      // Convert to sorted arrays for chart
      const sortedExpiryDates = Object.keys(expirationData).sort();
      const expiryLabels = sortedExpiryDates;
      const expiryData = sortedExpiryDates.map((date) => expirationData[date]);

      dashboardCharts.expirationTimelineChart = createLineChart(
        "expiration-timeline-chart",
        expiryLabels,
        expiryData,
        "Certificates Expiring",
        {
          plugins: {
            title: {
              display: true,
              text: "Certificate Expiration Timeline",
            },
          },
        }
      );
    } catch (error) {
      console.error("Failed to load validity analytics data:", error);
      showAlert("Failed to load validity analytics data.", "error");
    }
  },

  destroy() {
    // Destroy charts to prevent memory leaks
    if (dashboardCharts.validityDistributionChart) {
      destroyChart(dashboardCharts.validityDistributionChart);
    }
    if (dashboardCharts.validityTrendsChart) {
      destroyChart(dashboardCharts.validityTrendsChart);
    }
    if (dashboardCharts.expirationTimelineChart) {
      destroyChart(dashboardCharts.expirationTimelineChart);
    }
  },
};

/**
 * Signature and Hash Analytics view handler
 */
const signatureAnalyticsView = {
  id: "signature-analytics",

  async render() {
    const contentEl = document.getElementById("dashboard-content");
    contentEl.innerHTML = `
      <div class="dashboard-section">
        <h2 class="dashboard-title mb-4">Signature & Hash Algorithm Analytics</h2>

        <div class="row mb-4">
          <div class="col-lg-6 mb-4">
            <div class="card h-100">
              <div class="card-header">
                <h5 class="card-title mb-0">Signature Algorithm Distribution</h5>
              </div>
              <div class="card-body">
                <div class="chart-container">
                  <canvas id="signature-algorithm-chart"></canvas>
                </div>
              </div>
            </div>
          </div>

          <div class="col-lg-6 mb-4">
            <div class="card h-100">
              <div class="card-header">
                <h5 class="card-title mb-0">Hash Algorithm Distribution</h5>
              </div>
              <div class="card-body">
                <div class="chart-container">
                  <canvas id="hash-algorithm-chart"></canvas>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="row mb-4">
          <div class="col-12 mb-4">
            <div class="card">
              <div class="card-header">
                <h5 class="card-title mb-0">Algorithm Usage Trends Over Time</h5>
              </div>
              <div class="card-body">
                <div class="chart-container">
                  <canvas id="algorithm-trends-chart"></canvas>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Load data and create visualizations
    await this.loadData();
  },

  async loadData() {
    try {
      // Fetch signature algorithm data
      const sigAlgData = await API.getSignatureAlgorithms();
      const sigLabels = sigAlgData.signature_algorithms.map(
        (item) => item._id || "Unknown"
      );
      const sigData = sigAlgData.signature_algorithms.map((item) => item.count);

      // Create signature algorithm chart
      dashboardCharts.signatureAlgorithmChart = createDoughnutChart(
        "signature-algorithm-chart",
        sigLabels,
        sigData,
        {
          plugins: {
            title: {
              display: true,
              text: "Signature Algorithm Distribution",
            },
          },
        }
      );

      // Fetch hash algorithm data
      const hashAlgData = await API.getHashAlgorithms();
      const hashLabels = hashAlgData.hash_algorithms.map(
        (item) => item._id || "Unknown"
      );
      const hashData = hashAlgData.hash_algorithms.map((item) => item.count);

      // Create hash algorithm chart
      dashboardCharts.hashAlgorithmChart = createDoughnutChart(
        "hash-algorithm-chart",
        hashLabels,
        hashData,
        {
          plugins: {
            title: {
              display: true,
              text: "Hash Algorithm Distribution",
            },
          },
        }
      );

      // Fetch algorithm trends data
      const algoTrendsData = await API.getAlgorithmTrends();

      // Process algorithm trends data into datasets for stacked bar chart
      const years = algoTrendsData.algorithm_trends.map((item) => item.year);

      // Collect all unique algorithms
      const allAlgorithms = new Set();
      algoTrendsData.algorithm_trends.forEach((yearData) => {
        yearData.algorithms.forEach((algo) => {
          allAlgorithms.add(algo.algorithm);
        });
      });

      // Create dataset for each algorithm
      const datasets = Array.from(allAlgorithms).map((algorithm) => {
        const data = algoTrendsData.algorithm_trends.map((yearData) => {
          const algoData = yearData.algorithms.find(
            (a) => a.algorithm === algorithm
          );
          return algoData ? algoData.count : 0;
        });

        // Generate a consistent color based on algorithm name
        const colorIndex =
          Array.from(allAlgorithms).indexOf(algorithm) %
          CONFIG.CHART_COLOR_PALETTE.length;

        return {
          label: algorithm || "Unknown",
          data: data,
          backgroundColor: CONFIG.CHART_COLOR_PALETTE[colorIndex],
          borderRadius: 4,
        };
      });

      // Create algorithm trends chart
      dashboardCharts.algorithmTrendsChart = new Chart(
        document.getElementById("algorithm-trends-chart").getContext("2d"),
        {
          type: "bar",
          data: {
            labels: years,
            datasets: datasets,
          },
          options: {
            scales: {
              x: {
                stacked: true,
                title: {
                  display: true,
                  text: "Year",
                },
              },
              y: {
                stacked: true,
                beginAtZero: true,
                title: {
                  display: true,
                  text: "Number of Certificates",
                },
              },
            },
            plugins: {
              title: {
                display: true,
                text: "Algorithm Usage Trends by Year",
              },
              tooltip: {
                mode: "index",
                intersect: false,
              },
            },
          },
        }
      );
    } catch (error) {
      console.error("Failed to load signature analytics data:", error);
      showAlert("Failed to load signature analytics data.", "error");
    }
  },

  destroy() {
    // Destroy charts to prevent memory leaks
    if (dashboardCharts.signatureAlgorithmChart) {
      destroyChart(dashboardCharts.signatureAlgorithmChart);
    }
    if (dashboardCharts.hashAlgorithmChart) {
      destroyChart(dashboardCharts.hashAlgorithmChart);
    }
    if (dashboardCharts.algorithmTrendsChart) {
      destroyChart(dashboardCharts.algorithmTrendsChart);
    }
  },
};

/**
 * Certificate Authority Analytics view handler
 */
const caAnalyticsView = {
  id: "ca-analytics",

  async render() {
    const contentEl = document.getElementById("dashboard-content");
    contentEl.innerHTML = `
      <div class="dashboard-section">
        <h2 class="dashboard-title mb-4">Certificate Authority Analytics</h2>

        <div class="row mb-4">
          <div class="col-lg-6 mb-4">
            <div class="card h-100">
              <div class="card-header">
                <h5 class="card-title mb-0">Root Certificate Authorities</h5>
              </div>
              <div class="card-body">
                <div class="chart-container">
                  <canvas id="ca-distribution-chart"></canvas>
                </div>
              </div>
            </div>
          </div>

          <div class="col-lg-6 mb-4">
            <div class="card h-100">
              <div class="card-header">
                <h5 class="card-title mb-0">Intermediate Certificate Authorities</h5>
              </div>
              <div class="card-body">
                <div class="chart-container">
                  <canvas id="intermediate-ca-chart"></canvas>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="row mb-4">
          <div class="col-lg-12 mb-4">
            <div class="card">
              <div class="card-header">
                <h5 class="card-title mb-0">Certificate Authority Market Share</h5>
              </div>
              <div class="card-body">
                <div class="chart-container">
                  <canvas id="ca-market-share-chart"></canvas>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Load data and create visualizations
    await this.loadData();
  },

  async loadData() {
    try {
      // Fetch certificate authorities data
      const caData = await API.getCertificateAuthorities();

      // Limit to top 10 CAs, combine others into "Other"
      const topCAs = caData.certificate_authorities.slice(0, 10);
      const otherCAs = caData.certificate_authorities.slice(10);

      let caLabels = topCAs.map((item) => item._id || "Unknown");
      let caValues = topCAs.map((item) => item.count);

      // Add "Other" category if needed
      if (otherCAs.length > 0) {
        const otherCount = otherCAs.reduce((sum, item) => sum + item.count, 0);
        caLabels.push("Other CAs");
        caValues.push(otherCount);
      }

      // Create CA distribution chart
      dashboardCharts.caDistributionChart = createDoughnutChart(
        "ca-distribution-chart",
        caLabels,
        caValues,
        {
          plugins: {
            title: {
              display: true,
              text: "Root CA Distribution",
            },
          },
        }
      );

      // Fetch intermediate CA data
      const intermediateCAData = await API.getIntermediateCAs();

      // Limit to top 10 intermediate CAs, combine others into "Other"
      const topIntermediateCAs = intermediateCAData.intermediate_cas.slice(
        0,
        10
      );
      const otherIntermediateCAs =
        intermediateCAData.intermediate_cas.slice(10);

      let intermediateLabels = topIntermediateCAs.map(
        (item) => item._id || "Unknown"
      );
      let intermediateValues = topIntermediateCAs.map((item) => item.count);

      // Add "Other" category if needed
      if (otherIntermediateCAs.length > 0) {
        const otherCount = otherIntermediateCAs.reduce(
          (sum, item) => sum + item.count,
          0
        );
        intermediateLabels.push("Other Intermediates");
        intermediateValues.push(otherCount);
      }

      // Create intermediate CA chart
      dashboardCharts.intermediateCAChart = createDoughnutChart(
        "intermediate-ca-chart",
        intermediateLabels,
        intermediateValues,
        {
          plugins: {
            title: {
              display: true,
              text: "Intermediate CA Distribution",
            },
          },
        }
      );

      // Create CA market share chart (horizontal bar chart)
      const allCAs = [...topCAs]; // Get all CAs for market share

      // Sort by count for better visualization
      allCAs.sort((a, b) => b.count - a.count);

      const marketShareLabels = allCAs
        .slice(0, 15)
        .map((item) => item._id || "Unknown");
      const marketShareData = allCAs.slice(0, 15).map((item) => item.count);

      dashboardCharts.caMarketShareChart = createBarChart(
        "ca-market-share-chart",
        marketShareLabels,
        marketShareData,
        "Certificates Issued",
        {
          indexAxis: "y",
          plugins: {
            title: {
              display: true,
              text: "Certificate Authority Market Share",
            },
          },
        }
      );
    } catch (error) {
      console.error("Failed to load CA analytics data:", error);
      showAlert("Failed to load CA analytics data.", "error");
    }
  },

  destroy() {
    // Destroy charts to prevent memory leaks
    if (dashboardCharts.caDistributionChart) {
      destroyChart(dashboardCharts.caDistributionChart);
    }
    if (dashboardCharts.intermediateCAChart) {
      destroyChart(dashboardCharts.intermediateCAChart);
    }
    if (dashboardCharts.caMarketShareChart) {
      destroyChart(dashboardCharts.caMarketShareChart);
    }
  },
};

/**
 * Subject Alternative Name (SAN) Analytics view handler
 */
const sanAnalyticsView = {
  id: "san-analytics",

  async render() {
    const contentEl = document.getElementById("dashboard-content");
    contentEl.innerHTML = `
      <div class="dashboard-section">
        <h2 class="dashboard-title mb-4">Subject Alternative Name (SAN) Analytics</h2>

        <div class="row mb-4">
          <div class="col-lg-6 mb-4">
            <div class="card h-100">
              <div class="card-header">
                <h5 class="card-title mb-0">SAN Count Distribution</h5>
              </div>
              <div class="card-body">
                <div class="chart-container">
                  <canvas id="san-count-chart"></canvas>
                </div>
              </div>
            </div>
          </div>

          <div class="col-lg-6 mb-4">
            <div class="card h-100">
              <div class="card-header">
                <h5 class="card-title mb-0">Top SAN Domains</h5>
              </div>
              <div class="card-body">
                <div class="chart-container">
                  <canvas id="san-domains-chart"></canvas>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="row mb-4">
          <div class="col-lg-12 mb-4">
            <div class="card">
              <div class="card-header">
                <h5 class="card-title mb-0">SAN Type Distribution</h5>
              </div>
              <div class="card-body">
                <div class="row">
                  <div class="col-lg-6 mx-auto">
                    <div class="chart-container">
                      <canvas id="san-type-chart"></canvas>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Load data and create visualizations
    await this.loadData();
  },

  async loadData() {
    try {
      // Fetch SAN distribution data
      const sanDistData = await API.getSanDistribution();
      const sanRanges = sanDistData.san_distribution.map((item) => item.range);
      const sanCounts = sanDistData.san_distribution.map((item) => item.count);

      // Create SAN count distribution chart
      dashboardCharts.sanCountChart = createBarChart(
        "san-count-chart",
        sanRanges,
        sanCounts,
        "Number of Certificates",
        {
          plugins: {
            title: {
              display: true,
              text: "Number of SANs per Certificate",
            },
          },
        }
      );

      // Fetch top SAN domains data
      const sanDomainsData = await API.getSanDomains();

      // Get top 20 SAN domains
      const topDomains = sanDomainsData.san_domains.slice(0, 20);
      const domainLabels = topDomains.map((item) => item._id || "Unknown");
      const domainCounts = topDomains.map((item) => item.count);

      // Create SAN domains chart
      dashboardCharts.sanDomainsChart = createBarChart(
        "san-domains-chart",
        domainLabels,
        domainCounts,
        "Occurrences",
        {
          indexAxis: "y",
          plugins: {
            title: {
              display: true,
              text: "Most Common SAN Domains",
            },
          },
        }
      );

      // Create SAN type distribution chart (mock data as we only have DNS names in the API)
      const sanTypeLabels = [
        "DNS Names",
        "IP Addresses",
        "Email Addresses",
        "URLs",
        "Other Types",
      ];
      const sanTypeData = [85, 10, 3, 1, 1]; // Sample/mock data for visualization

      dashboardCharts.sanTypeChart = createDoughnutChart(
        "san-type-chart",
        sanTypeLabels,
        sanTypeData,
        {
          plugins: {
            title: {
              display: true,
              text: "SAN Type Distribution",
            },
          },
        }
      );
    } catch (error) {
      console.error("Failed to load SAN analytics data:", error);
      showAlert("Failed to load SAN analytics data.", "error");
    }
  },

  destroy() {
    // Destroy charts to prevent memory leaks
    if (dashboardCharts.sanCountChart) {
      destroyChart(dashboardCharts.sanCountChart);
    }
    if (dashboardCharts.sanDomainsChart) {
      destroyChart(dashboardCharts.sanDomainsChart);
    }
    if (dashboardCharts.sanTypeChart) {
      destroyChart(dashboardCharts.sanTypeChart);
    }
  },
};

/**
 * Trends & Analysis view handler
 */
const trendsAnalyticsView = {
  id: "trends-analytics",

  async render() {
    const contentEl = document.getElementById("dashboard-content");
    contentEl.innerHTML = `
      <div class="dashboard-section">
        <h2 class="dashboard-title mb-4">Certificate Trends & Analytics</h2>

        <div class="row mb-4">
          <div class="col-lg-6 mb-4">
            <div class="card h-100">
              <div class="card-header">
                <h5 class="card-title mb-0">Certificate Issuance Trends</h5>
              </div>
              <div class="card-body">
                <div class="chart-container">
                  <canvas id="issuance-trend-chart"></canvas>
                </div>
              </div>
            </div>
          </div>

          <div class="col-lg-6 mb-4">
            <div class="card h-100">
              <div class="card-header">
                <h5 class="card-title mb-0">Certificate Validity Trends</h5>
              </div>
              <div class="card-body">
                <div class="chart-container">
                  <canvas id="cert-length-trend-chart"></canvas>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="row mb-4">
          <div class="col-lg-12 mb-4">
            <div class="card">
              <div class="card-header">
                <h5 class="card-title mb-0">Security Algorithm Adoption</h5>
              </div>
              <div class="card-body">
                <div class="chart-container">
                  <canvas id="security-adoption-chart"></canvas>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Load data and create visualizations
    await this.loadData();
  },

  async loadData() {
    try {
      // Fetch certificate data for issuance trends
      const allCerts = await API.getAllCertificates();

      // Process issuance trends by month and year
      const issuanceCounts = {};

      allCerts.forEach((cert) => {
        const issueDate = new Date(cert.issue_date);
        const year = issueDate.getFullYear();
        const month = issueDate.getMonth();

        const yearMonth = `${year}-${String(month + 1).padStart(2, "0")}`;

        if (!issuanceCounts[yearMonth]) {
          issuanceCounts[yearMonth] = 0;
        }

        issuanceCounts[yearMonth]++;
      });

      // Convert to sorted arrays for chart
      const sortedIssueDates = Object.keys(issuanceCounts).sort();
      const issuanceLabels = sortedIssueDates;
      const issuanceData = sortedIssueDates.map((date) => issuanceCounts[date]);

      // Create issuance trend chart
      dashboardCharts.issuanceTrendChart = createLineChart(
        "issuance-trend-chart",
        issuanceLabels,
        issuanceData,
        "Certificates Issued",
        {
          plugins: {
            title: {
              display: true,
              text: "Certificate Issuance Trends",
            },
          },
        }
      );

      // Fetch validity trends data
      const validityTrendsData = await API.getValidityTrends();
      const validityYears = validityTrendsData.validity_trends.map(
        (item) => item._id
      );
      const validityAvg = validityTrendsData.validity_trends.map((item) =>
        Math.round(item.avg_validity)
      );

      // Create certificate validity trend chart
      dashboardCharts.certLengthTrendChart = createLineChart(
        "cert-length-trend-chart",
        validityYears,
        validityAvg,
        "Average Validity (days)",
        {
          plugins: {
            title: {
              display: true,
              text: "Certificate Validity Length Trends",
            },
          },
          scales: {
            y: {
              beginAtZero: false,
              title: {
                display: true,
                text: "Days",
              },
            },
          },
        }
      );

      // Fetch algorithm trends data for security adoption chart
      const algoTrendsData = await API.getAlgorithmTrends();

      // Process algorithm trends data
      // Categorize algorithms into security levels
      const securityCategorization = {
        sha1WithRSAEncryption: "Legacy",
        sha256WithRSAEncryption: "Standard",
        sha384WithRSAEncryption: "Enhanced",
        sha512WithRSAEncryption: "Enhanced",
        "ecdsa-with-SHA256": "Modern",
        "ecdsa-with-SHA384": "Modern",
        ed25519: "Future-Proof",
        ed448: "Future-Proof",
      };

      // Prepare datasets for each security level
      const securityLevels = [
        "Legacy",
        "Standard",
        "Enhanced",
        "Modern",
        "Future-Proof",
      ];
      const securityDatasets = {};

      securityLevels.forEach((level) => {
        securityDatasets[level] = [];
      });

      // Get all years
      const years = algoTrendsData.algorithm_trends.map((item) => item.year);

      // Initialize counts for all years and security levels
      const securityCounts = {};
      years.forEach((year) => {
        securityCounts[year] = {};
        securityLevels.forEach((level) => {
          securityCounts[year][level] = 0;
        });
      });

      // Fill in the actual counts
      algoTrendsData.algorithm_trends.forEach((yearData) => {
        const year = yearData.year;

        yearData.algorithms.forEach((algo) => {
          const algoName = algo.algorithm;
          const count = algo.count;

          // Determine security level
          let securityLevel = "Standard"; // Default
          if (securityCategorization[algoName]) {
            securityLevel = securityCategorization[algoName];
          }

          securityCounts[year][securityLevel] += count;
        });
      });

      // Prepare datasets
      const securityDatasetsList = securityLevels.map((level, index) => {
        return {
          label: level,
          data: years.map((year) => securityCounts[year][level]),
          backgroundColor:
            CONFIG.CHART_COLOR_PALETTE[
              index % CONFIG.CHART_COLOR_PALETTE.length
            ],
          borderColor:
            CONFIG.CHART_COLOR_PALETTE[
              index % CONFIG.CHART_COLOR_PALETTE.length
            ],
          borderWidth: 2,
          fill: false,
          tension: 0.4,
        };
      });

      // Create security adoption trend chart
      dashboardCharts.securityAdoptionChart = new Chart(
        document.getElementById("security-adoption-chart").getContext("2d"),
        {
          type: "line",
          data: {
            labels: years,
            datasets: securityDatasetsList,
          },
          options: {
            plugins: {
              title: {
                display: true,
                text: "Security Algorithm Adoption Trends",
              },
              tooltip: {
                mode: "index",
                intersect: false,
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: "Certificate Count",
                },
              },
              x: {
                title: {
                  display: true,
                  text: "Year",
                },
              },
            },
          },
        }
      );
    } catch (error) {
      console.error("Failed to load trends analytics data:", error);
      showAlert("Failed to load trends analytics data.", "error");
    }
  },

  destroy() {
    // Destroy charts to prevent memory leaks
    if (dashboardCharts.issuanceTrendChart) {
      destroyChart(dashboardCharts.issuanceTrendChart);
    }
    if (dashboardCharts.certLengthTrendChart) {
      destroyChart(dashboardCharts.certLengthTrendChart);
    }
    if (dashboardCharts.securityAdoptionChart) {
      destroyChart(dashboardCharts.securityAdoptionChart);
    }
  },
};

/**
 * Subject Common Names Analytics view handler
 */
const subjectNamesView = {
  id: "subject-names",

  async render() {
    const contentEl = document.getElementById("dashboard-content");
    contentEl.innerHTML = `
      <div class="dashboard-section">
        <h2 class="dashboard-title mb-4">Subject Names Analytics</h2>

        <div class="row mb-4">
          <div class="col-lg-12 mb-4">
            <div class="card h-100">
              <div class="card-header">
                <h5 class="card-title mb-0">Most Common Subject Names</h5>
              </div>
              <div class="card-body">
                <div class="chart-container">
                  <canvas id="subject-names-chart"></canvas>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="row mb-4">
          <div class="col-lg-6 mb-4">
            <div class="card h-100">
              <div class="card-header">
                <h5 class="card-title mb-0">Domain Category Distribution</h5>
              </div>
              <div class="card-body">
                <div class="chart-container">
                  <canvas id="domain-category-chart"></canvas>
                </div>
              </div>
            </div>
          </div>

          <div class="col-lg-6 mb-4">
            <div class="card h-100">
              <div class="card-header">
                <h5 class="card-title mb-0">Selected Domain Details</h5>
              </div>
              <div class="card-body">
                <div id="subject-name-details">
                  <p class="text-center text-muted">Click on a chart item to view details</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Load data and create visualizations
    await this.loadData();
  },

  async loadData() {
    try {
      // Fetch subject common names data
      const subjectNamesData = await API.getSubjectCommonNames();

      if (
        !subjectNamesData.subject_common_names ||
        subjectNamesData.subject_common_names.length === 0
      ) {
        document.getElementById("subject-names-chart").innerHTML =
          '<div class="alert alert-info">No subject common names data available</div>';
        return;
      }

      // Process data for charts
      const topNames = subjectNamesData.subject_common_names.slice(0, 20);
      const nameLabels = topNames.map(
        (item) => this.formatDomainName(item._id) || "Unknown"
      );
      const nameData = topNames.map((item) => item.count);

      // Create horizontal bar chart for subject names
      dashboardCharts.subjectNamesChart = createBarChart(
        "subject-names-chart",
        nameLabels,
        nameData,
        "Number of Certificates",
        {
          indexAxis: "y",
          plugins: {
            title: {
              display: true,
              text: "Top Subject Common Names",
            },
          },
          onClick: (event, elements) => {
            if (elements && elements.length > 0) {
              const index = elements[0].index;
              this.showDomainDetails(
                nameLabels[index],
                nameData[index],
                topNames[index]._id
              );
            }
          },
        }
      );

      // Process domain categories
      const domainCategories = this.processDomainCategories(
        subjectNamesData.subject_common_names
      );
      const categoryLabels = Object.keys(domainCategories);
      const categoryData = Object.values(domainCategories);

      // Create pie chart for domain categories
      dashboardCharts.domainCategoryChart = createDoughnutChart(
        "domain-category-chart",
        categoryLabels,
        categoryData,
        {
          plugins: {
            title: {
              display: true,
              text: "Domain Categories",
            },
          },
        }
      );
    } catch (error) {
      console.error("Failed to load subject names data:", error);
      showAlert("Failed to load subject names data.", "error");
    }
  },

  formatDomainName(domain) {
    if (!domain) return "Unknown";

    // Truncate very long domain names
    if (domain.length > 30) {
      return domain.substring(0, 27) + "...";
    }

    return domain;
  },

  processDomainCategories(domains) {
    const categories = {
      com: 0,
      org: 0,
      net: 0,
      edu: 0,
      gov: 0,
      io: 0,
      co: 0,
      me: 0,
      app: 0,
      Other: 0,
    };

    domains.forEach((item) => {
      if (!item._id) {
        categories["Unknown"] = (categories["Unknown"] || 0) + item.count;
        return;
      }

      const domain = item._id.toLowerCase();
      const tld = domain.split(".").pop();

      if (categories[tld] !== undefined) {
        categories[tld] += item.count;
      } else {
        categories["Other"] += item.count;
      }
    });

    // Remove categories with zero count
    Object.keys(categories).forEach((key) => {
      if (categories[key] === 0) {
        delete categories[key];
      }
    });

    return categories;
  },

  showDomainDetails(domainName, count, originalDomain) {
    const detailsEl = document.getElementById("subject-name-details");

    // Extract domain parts
    let tld = "Unknown";
    let domain = "Unknown";
    let subdomain = "";

    if (originalDomain) {
      const parts = originalDomain.split(".");
      tld = parts.length > 1 ? parts[parts.length - 1] : "Unknown";
      domain = parts.length > 1 ? parts[parts.length - 2] : parts[0];
      subdomain =
        parts.length > 2 ? parts.slice(0, parts.length - 2).join(".") : "";
    }

    detailsEl.innerHTML = `
      <div>
        <h5>${originalDomain || "Unknown"}</h5>
        <p class="text-muted mb-3">Subject Common Name</p>
        
        <div class="mb-3">
          <div class="d-flex justify-content-between mb-2">
            <span class="fw-bold">Certificate Count:</span>
            <span>${count}</span>
          </div>
          
          <div class="d-flex justify-content-between mb-2">
            <span class="fw-bold">Domain:</span>
            <span>${domain}</span>
          </div>
          
          <div class="d-flex justify-content-between mb-2">
            <span class="fw-bold">TLD:</span>
            <span>${tld}</span>
          </div>
          
          ${
            subdomain
              ? `
          <div class="d-flex justify-content-between mb-2">
            <span class="fw-bold">Subdomain:</span>
            <span>${subdomain}</span>
          </div>
          `
              : ""
          }
        </div>
        
        <div class="alert alert-info">
          <i class="bi bi-info-circle me-2"></i>
          The subject common name is a field in the certificate that identifies the entity or domain the certificate was issued to.
        </div>
      </div>
    `;
  },

  destroy() {
    // Destroy charts to prevent memory leaks
    if (dashboardCharts.subjectNamesChart) {
      destroyChart(dashboardCharts.subjectNamesChart);
    }
    if (dashboardCharts.domainCategoryChart) {
      destroyChart(dashboardCharts.domainCategoryChart);
    }
  },
};

/**
 * CAs vs Domains Analytics view handler
 */
const caDomainView = {
  id: "ca-domain",

  async render() {
    const contentEl = document.getElementById("dashboard-content");
    contentEl.innerHTML = `
      <div class="dashboard-section">
        <h2 class="dashboard-title mb-4">CAs vs Domains Analytics</h2>

        <div class="row mb-4">
          <div class="col-lg-12 mb-4">
            <div class="card h-100">
              <div class="card-header">
                <h5 class="card-title mb-0">CAs by Domain Coverage</h5>
              </div>
              <div class="card-body">
                <div class="chart-container">
                  <canvas id="ca-domain-chart"></canvas>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="row mb-4">
          <div class="col-lg-12 mb-4">
            <div class="card h-100">
              <div class="card-header">
                <h5 class="card-title mb-0">Selected CA Domain Details</h5>
              </div>
              <div class="card-body">
                <div id="ca-domain-details">
                  <p class="text-center text-muted">Click on a chart item to view domain details</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Load data and create visualizations
    await this.loadData();
  },

  async loadData() {
    try {
      // Fetch CA domain analysis data
      const caDomainData = await API.getCaDomainAnalysis();

      if (!caDomainData.ca_domains || caDomainData.ca_domains.length === 0) {
        document.getElementById("ca-domain-chart").innerHTML =
          '<div class="alert alert-info">No CA domain analysis data available</div>';
        return;
      }

      // Store the full data for later use
      this.fullCaDomainData = caDomainData.ca_domains;

      // Process data for charts - top 10 CAs by domain coverage
      const topCAs = caDomainData.ca_domains.slice(0, 10);
      const caLabels = topCAs.map((item) => item._id || "Unknown");
      const domainCounts = topCAs.map((item) => item.total);

      // Create bar chart
      dashboardCharts.caDomainChart = createBarChart(
        "ca-domain-chart",
        caLabels,
        domainCounts,
        "Number of Domains",
        {
          plugins: {
            title: {
              display: true,
              text: "Top CAs by Domain Coverage",
            },
          },
          onClick: (event, elements) => {
            if (elements && elements.length > 0) {
              const index = elements[0].index;
              this.showCaDomainDetails(caLabels[index], topCAs[index]);
            }
          },
        }
      );
    } catch (error) {
      console.error("Failed to load CA domain analysis data:", error);
      showAlert("Failed to load CA domain analysis data.", "error");
    }
  },

  showCaDomainDetails(caName, caData) {
    const detailsEl = document.getElementById("ca-domain-details");

    // Sort domains by count
    const sortedDomains = [...caData.domains].sort((a, b) => b.count - a.count);

    // Get top 10 domains
    const topDomains = sortedDomains.slice(0, 10);

    // Create domain distribution chart
    if (dashboardCharts.caDomainDetailsChart) {
      destroyChart(dashboardCharts.caDomainDetailsChart);
    }

    detailsEl.innerHTML = `
      <div class="row">
        <div class="col-md-5 mb-4">
          <h5>${caName || "Unknown"}</h5>
          <p class="text-muted mb-3">Certificate Authority</p>
          
          <div class="mb-3">
            <div class="d-flex justify-content-between mb-2">
              <span class="fw-bold">Total Domains:</span>
              <span>${caData.total}</span>
            </div>
            
            <div class="d-flex justify-content-between mb-2">
              <span class="fw-bold">Unique Domain Types:</span>
              <span>${caData.domains.length}</span>
            </div>
          </div>
          
          <div class="alert alert-info mt-3">
            <i class="bi bi-info-circle me-2"></i>
            This chart shows the distribution of domain types secured by certificates from ${
              caName || "this CA"
            }.
          </div>
        </div>
        
        <div class="col-md-7">
          <div class="chart-container" style="height: 250px;">
            <canvas id="ca-domain-details-chart"></canvas>
          </div>
        </div>
      </div>
      
      <div class="mt-4">
        <h6>Top Domains Secured by ${caName || "this CA"}</h6>
        <div class="table-responsive">
          <table class="table table-sm">
            <thead>
              <tr>
                <th>Domain Type</th>
                <th>Count</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              ${topDomains
                .map((domain) => {
                  const percentage = Math.round(
                    (domain.count / caData.total) * 100
                  );
                  return `
                  <tr>
                    <td>${domain.domain || "Unknown"}</td>
                    <td>${domain.count}</td>
                    <td>
                      <div class="progress" style="height: 6px;">
                        <div class="progress-bar" role="progressbar" style="width: ${percentage}%" aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100"></div>
                      </div>
                      ${percentage}%
                    </td>
                  </tr>
                `;
                })
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Create domain distribution chart
    const domainLabels = topDomains.map((domain) => domain.domain || "Unknown");
    const domainData = topDomains.map((domain) => domain.count);

    dashboardCharts.caDomainDetailsChart = createDoughnutChart(
      "ca-domain-details-chart",
      domainLabels,
      domainData,
      {
        plugins: {
          title: {
            display: true,
            text: "Domain Distribution",
          },
        },
      }
    );
  },

  destroy() {
    // Destroy charts to prevent memory leaks
    if (dashboardCharts.caDomainChart) {
      destroyChart(dashboardCharts.caDomainChart);
    }
    if (dashboardCharts.caDomainDetailsChart) {
      destroyChart(dashboardCharts.caDomainDetailsChart);
    }
  },
};

/**
 * Show certificate details in modal
 * @param {Object} certificate - Certificate object
 */
function showCertificateDetails(certificate) {
  if (!certificate) return;

  const modalContent = safeGetElement("certificateDetailsContent");
  if (!modalContent) {
    console.error("Certificate details modal content element not found");
    return;
  }

  // Try to get the modal element
  const modalEl = document.getElementById("certificateDetailsModal");
  if (!modalEl) {
    console.error("Certificate details modal element not found");
    return;
  }

  const daysRemain = daysRemaining(certificate.expiry_date);

  modalContent.innerHTML = `
        <div class="row">
            <div class="col-md-8">
                <h5>${certificate.name}</h5>
                <p class="text-muted mb-4">${certificate.certificate_id}</p>
            </div>
            <div class="col-md-4 text-md-end">
                ${createStatusBadge(certificate.status)}
            </div>
        </div>
        
        <div class="row mb-3">
            <div class="col-md-6">
                <div class="mb-3">
                    <label class="fw-bold mb-1">Type</label>
                    <div>${certificate.type}</div>
                </div>
                
                <div class="mb-3">
                    <label class="fw-bold mb-1">Issuer</label>
                    <div>${certificate.issuer}</div>
                </div>
                
                <div class="mb-3">
                    <label class="fw-bold mb-1">Department</label>
                    <div>${certificate.department}</div>
                </div>
                
                <div class="mb-3">
                    <label class="fw-bold mb-1">Region</label>
                    <div>${certificate.region}</div>
                </div>
            </div>
            
            <div class="col-md-6">
                <div class="mb-3">
                    <label class="fw-bold mb-1">Issue Date</label>
                    <div>${formatDate(certificate.issue_date)}</div>
                </div>
                
                <div class="mb-3">
                    <label class="fw-bold mb-1">Expiry Date</label>
                    <div>${formatDate(certificate.expiry_date)}</div>
                </div>
                
                <div class="mb-3">
                    <label class="fw-bold mb-1">Days Remaining</label>
                    <div>${
                      daysRemain > 0 ? daysRemain + " days" : "Expired"
                    }</div>
                </div>
                
                <div class="mb-3">
                    <label class="fw-bold mb-1">Auto Renewal</label>
                    <div>${
                      certificate.auto_renewal ? "Enabled" : "Disabled"
                    }</div>
                </div>
            </div>
        </div>
        
        <div class="row">
            <div class="col-12">
                <div class="mb-3">
                    <label class="fw-bold mb-1">Technical Details</label>
                    <div class="p-3 rounded bg-light border-light">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="mb-2">
                                    <small class="text-muted">Algorithm:</small>
                                    <div>${certificate.algorithm}</div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="mb-2">
                                    <small class="text-muted">Key Strength:</small>
                                    <div>${certificate.key_strength} bits</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

  try {
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  } catch (error) {
    console.error("Error showing certificate details modal:", error);
    showAlert("Error showing certificate details.", "error");
  }
}

/**
 * CAs vs URLs Analytics view handler
 */
const caUrlView = {
  id: "ca-url",

  async render() {
    const contentEl = document.getElementById("dashboard-content");
    contentEl.innerHTML = `
      <div class="dashboard-section">
        <h2 class="dashboard-title mb-4">CAs vs URL Analytics</h2>

        <div class="row mb-4">
          <div class="col-lg-12 mb-4">
            <div class="card h-100">
              <div class="card-header">
                <h5 class="card-title mb-0">CAs by URL Coverage</h5>
              </div>
              <div class="card-body">
                <div class="chart-container">
                  <canvas id="ca-url-chart"></canvas>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="row mb-4">
          <div class="col-lg-12 mb-4">
            <div class="card h-100">
              <div class="card-header">
                <h5 class="card-title mb-0">URL Type Distribution by CA</h5>
              </div>
              <div class="card-body">
                <div id="ca-url-details">
                  <p class="text-center text-muted">Click on a chart item to view URL details</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Load data and create visualizations
    await this.loadData();
  },

  async loadData() {
    try {
      // Fetch CA URL analysis data
      const caUrlData = await API.getCaUrlAnalysis();

      if (!caUrlData.ca_urls || caUrlData.ca_urls.length === 0) {
        document.getElementById("ca-url-chart").innerHTML =
          '<div class="alert alert-info">No CA URL analysis data available</div>';
        return;
      }

      // Store the full data for later use
      this.fullCaUrlData = caUrlData.ca_urls;

      // Process data for charts - top 10 CAs by URL coverage
      const topCAs = caUrlData.ca_urls.slice(0, 10);
      const caLabels = topCAs.map((item) => item._id || "Unknown");
      const urlCounts = topCAs.map((item) => item.total);

      // Create horizontal bar chart
      dashboardCharts.caUrlChart = createBarChart(
        "ca-url-chart",
        caLabels,
        urlCounts,
        "Number of URLs",
        {
          indexAxis: "y",
          plugins: {
            title: {
              display: true,
              text: "Top CAs by URL Coverage",
            },
          },
          onClick: (event, elements) => {
            if (elements && elements.length > 0) {
              const index = elements[0].index;
              this.showCaUrlDetails(caLabels[index], topCAs[index]);
            }
          },
        }
      );
    } catch (error) {
      console.error("Failed to load CA URL analysis data:", error);
      showAlert("Failed to load CA URL analysis data.", "error");
    }
  },

  showCaUrlDetails(caName, caData) {
    const detailsEl = document.getElementById("ca-url-details");

    // Sort URL types by count
    const sortedUrlTypes = [...caData.url_types].sort(
      (a, b) => b.count - a.count
    );

    // Create URL type distribution chart
    if (dashboardCharts.caUrlDetailsChart) {
      destroyChart(dashboardCharts.caUrlDetailsChart);
    }

    detailsEl.innerHTML = `
      <div class="row">
        <div class="col-md-5 mb-4">
          <h5>${caName || "Unknown"}</h5>
          <p class="text-muted mb-3">Certificate Authority</p>
          
          <div class="mb-3">
            <div class="d-flex justify-content-between mb-2">
              <span class="fw-bold">Total URLs:</span>
              <span>${caData.total}</span>
            </div>
            
            <div class="d-flex justify-content-between mb-2">
              <span class="fw-bold">Unique URL Types:</span>
              <span>${caData.url_types.length}</span>
            </div>
          </div>
          
          <div class="alert alert-info mt-3">
            <i class="bi bi-info-circle me-2"></i>
            This chart shows the distribution of URL types secured by certificates from ${
              caName || "this CA"
            }.
          </div>
        </div>
        
        <div class="col-md-7">
          <div class="chart-container" style="height: 250px;">
            <canvas id="ca-url-details-chart"></canvas>
          </div>
        </div>
      </div>
      
      <div class="mt-4">
        <h6>URL Type Distribution</h6>
        <div class="table-responsive">
          <table class="table table-sm">
            <thead>
              <tr>
                <th>URL Type</th>
                <th>Count</th>
                <th>Percentage</th>
                <th>Common Examples</th>
              </tr>
            </thead>
            <tbody>
              ${sortedUrlTypes
                .map((urlType) => {
                  const percentage = Math.round(
                    (urlType.count / caData.total) * 100
                  );
                  return `
                  <tr>
                    <td>${urlType.type || "Unknown"}</td>
                    <td>${urlType.count}</td>
                    <td>
                      <div class="progress" style="height: 6px;">
                        <div class="progress-bar" role="progressbar" style="width: ${percentage}%" aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100"></div>
                      </div>
                      ${percentage}%
                    </td>
                    <td>${
                      urlType.examples
                        ? urlType.examples.slice(0, 2).join(", ")
                        : "N/A"
                    }</td>
                  </tr>
                `;
                })
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Create URL type distribution chart
    const urlTypeLabels = sortedUrlTypes
      .slice(0, 8)
      .map((type) => type.type || "Unknown");
    const urlTypeData = sortedUrlTypes.slice(0, 8).map((type) => type.count);

    dashboardCharts.caUrlDetailsChart = createDoughnutChart(
      "ca-url-details-chart",
      urlTypeLabels,
      urlTypeData,
      {
        plugins: {
          title: {
            display: true,
            text: "URL Type Distribution",
          },
        },
      }
    );
  },

  destroy() {
    // Destroy charts to prevent memory leaks
    if (dashboardCharts.caUrlChart) {
      destroyChart(dashboardCharts.caUrlChart);
    }
    if (dashboardCharts.caUrlDetailsChart) {
      destroyChart(dashboardCharts.caUrlDetailsChart);
    }
  },
};

/**
 * CAs vs Public Keys Analytics view handler
 */
const caPubkeyView = {
  id: "ca-pubkey",

  async render() {
    const contentEl = document.getElementById("dashboard-content");
    contentEl.innerHTML = `
      <div class="dashboard-section">
        <h2 class="dashboard-title mb-4">CAs vs Public Keys Analytics</h2>

        <div class="row mb-4">
          <div class="col-lg-12 mb-4">
            <div class="card h-100">
              <div class="card-header">
                <h5 class="card-title mb-0">Public Key Reuse by CA</h5>
              </div>
              <div class="card-body">
                <div class="chart-container">
                  <canvas id="ca-pubkey-chart"></canvas>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="row mb-4">
          <div class="col-lg-6 mb-4">
            <div class="card h-100">
              <div class="card-header">
                <h5 class="card-title mb-0">Key Types Distribution</h5>
              </div>
              <div class="card-body">
                <div class="chart-container">
                  <canvas id="key-types-chart"></canvas>
                </div>
              </div>
            </div>
          </div>
          
          <div class="col-lg-6 mb-4">
            <div class="card h-100">
              <div class="card-header">
                <h5 class="card-title mb-0">Certificate Authority Details</h5>
              </div>
              <div class="card-body">
                <div id="ca-pubkey-details">
                  <p class="text-center text-muted">Click on a chart item to view details</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Load data and create visualizations
    await this.loadData();
  },

  async loadData() {
    try {
      // Fetch CA public key analysis data
      const caPubkeyData = await API.getCaPubkeyAnalysis();

      if (!caPubkeyData.ca_pubkeys || caPubkeyData.ca_pubkeys.length === 0) {
        document.getElementById("ca-pubkey-chart").innerHTML =
          '<div class="alert alert-info">No CA public key analysis data available</div>';
        return;
      }

      // Store the full data for later use
      this.fullCaPubkeyData = caPubkeyData.ca_pubkeys;

      // Process data for charts - top 10 CAs by key reuse
      const topCAs = caPubkeyData.ca_pubkeys.slice(0, 10);
      const caLabels = topCAs.map((item) => item._id || "Unknown");
      const reuseData = topCAs.map((item) => item.reuse_ratio * 100); // Convert to percentage

      // Create bar chart for key reuse
      dashboardCharts.caPubkeyChart = createBarChart(
        "ca-pubkey-chart",
        caLabels,
        reuseData,
        "Key Reuse Percentage (%)",
        {
          plugins: {
            title: {
              display: true,
              text: "Top CAs by Public Key Reuse",
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
            },
          },
          onClick: (event, elements) => {
            if (elements && elements.length > 0) {
              const index = elements[0].index;
              this.showCaPubkeyDetails(caLabels[index], topCAs[index]);
            }
          },
        }
      );

      // Create key types distribution chart
      const keyTypes = this.processKeyTypes(caPubkeyData.ca_pubkeys);
      const keyTypeLabels = Object.keys(keyTypes);
      const keyTypeData = Object.values(keyTypes);

      dashboardCharts.keyTypesChart = createDoughnutChart(
        "key-types-chart",
        keyTypeLabels,
        keyTypeData,
        {
          plugins: {
            title: {
              display: true,
              text: "Key Types Distribution",
            },
          },
        }
      );
    } catch (error) {
      console.error("Failed to load CA public key analysis data:", error);
      showAlert("Failed to load CA public key analysis data.", "error");
    }
  },

  processKeyTypes(caData) {
    const keyTypes = {
      RSA: 0,
      ECDSA: 0,
      DSA: 0,
      Ed25519: 0,
      Other: 0,
    };

    caData.forEach((ca) => {
      if (ca.key_types) {
        ca.key_types.forEach((keyType) => {
          if (keyTypes[keyType.type] !== undefined) {
            keyTypes[keyType.type] += keyType.count;
          } else {
            keyTypes["Other"] += keyType.count;
          }
        });
      }
    });

    // Remove types with zero count
    Object.keys(keyTypes).forEach((key) => {
      if (keyTypes[key] === 0) {
        delete keyTypes[key];
      }
    });

    return keyTypes;
  },

  showCaPubkeyDetails(caName, caData) {
    const detailsEl = document.getElementById("ca-pubkey-details");

    detailsEl.innerHTML = `
      <div class="mb-3">
        <h5>${caName || "Unknown"}</h5>
        <p class="text-muted mb-3">Certificate Authority</p>
        
        <div class="mb-3">
          <div class="d-flex justify-content-between mb-2">
            <span class="fw-bold">Total Certificates:</span>
            <span>${caData.total_certs}</span>
          </div>
          
          <div class="d-flex justify-content-between mb-2">
            <span class="fw-bold">Unique Public Keys:</span>
            <span>${caData.unique_keys}</span>
          </div>
          
          <div class="d-flex justify-content-between mb-2">
            <span class="fw-bold">Key Reuse Ratio:</span>
            <span>${(caData.reuse_ratio * 100).toFixed(2)}%</span>
          </div>
          
          <div class="d-flex justify-content-between mb-2">
            <span class="fw-bold">Average Key Strength:</span>
            <span>${caData.avg_key_strength || "N/A"}</span>
          </div>
        </div>
        
        <div class="mb-3">
          <h6>Key Types Used:</h6>
          <ul class="list-group">
            ${
              caData.key_types
                ? caData.key_types
                    .map(
                      (keyType) => `
              <li class="list-group-item d-flex justify-content-between align-items-center">
                ${keyType.type}
                <span class="badge bg-primary rounded-pill">${keyType.count}</span>
              </li>
            `
                    )
                    .join("")
                : '<li class="list-group-item">No key type data available</li>'
            }
          </ul>
        </div>
        
        <div class="alert alert-info mt-3">
          <i class="bi bi-info-circle me-2"></i>
          <strong>Key Reuse:</strong> A high key reuse ratio could indicate that many certificates are using the same public keys, which may be a security concern or a sign of certificate renewal practices.
        </div>
      </div>
    `;
  },

  destroy() {
    // Destroy charts to prevent memory leaks
    if (dashboardCharts.caPubkeyChart) {
      destroyChart(dashboardCharts.caPubkeyChart);
    }
    if (dashboardCharts.keyTypesChart) {
      destroyChart(dashboardCharts.keyTypesChart);
    }
  },
};

/**
 * Utility functions for analytics views
 */
const analyticsViewUtils = {
  /**
   * Shows a loading indicator for chart loading
   * @param {string} loadingElId - The ID of the loading element
   * @param {string} containerElId - The ID of the chart container element
   * @param {boolean} isLoading - Whether to show or hide the loading indicator
   */
  toggleChartLoading(loadingElId, containerElId, isLoading) {
    const loadingEl = document.getElementById(loadingElId);
    const containerEl = document.getElementById(containerElId);

    if (loadingEl) loadingEl.style.display = isLoading ? "block" : "none";
    if (containerEl) containerEl.style.opacity = isLoading ? "0.3" : "1";
  },

  /**
   * Prepare distribution data for pie/doughnut charts
   * @param {Array} data - The data to process
   * @param {Function} getLabel - Function to get the label from an item
   * @param {Function} getValue - Function to get the value from an item
   * @param {number} topCount - Number of top items to include individually
   * @returns {Object} Object with labels and data arrays
   */
  prepareDistributionData(data, getLabel, getValue, topCount = 5) {
    const totalValue = data.reduce((sum, item) => sum + getValue(item), 0);

    const topItems = data.slice(0, topCount);
    const otherItems = data.slice(topCount);
    const otherValue = otherItems.reduce(
      (sum, item) => sum + getValue(item),
      0
    );

    const labels = topItems.map((item) => getLabel(item));
    const values = topItems.map((item) => getValue(item));

    if (otherValue > 0) {
      labels.push("Others");
      values.push(otherValue);
    }

    return { labels, data: values };
  },

  /**
   * Create a standard bar chart
   * @param {string} chartId - The ID of the canvas element
   * @param {Array} labels - Chart labels
   * @param {Array} data - Chart data values
   * @param {string} label - Dataset label
   * @param {string} color - Chart color
   * @param {Function} onClick - Click handler for chart elements
   * @returns {Chart} The created chart object
   */
  createBarChart(chartId, labels, data, label, color, onClick) {
    const chartEl = document.getElementById(chartId);
    if (!chartEl) return null;

    return new Chart(chartEl, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: label,
            data: data,
            backgroundColor: color,
            borderColor: color,
            borderWidth: 1,
          },
        ],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            callbacks: {
              label: function (context) {
                let label = context.dataset.label || "";
                if (label) {
                  label += ": ";
                }
                label += context.raw;
                return label;
              },
            },
          },
          legend: {
            display: false,
          },
        },
        onClick: onClick,
      },
    });
  },

  /**
   * Create a standard doughnut chart
   * @param {string} chartId - The ID of the canvas element
   * @param {Array} labels - Chart labels
   * @param {Array} data - Chart data values
   * @returns {Chart} The created chart object
   */
  createDoughnutChart(chartId, labels, data) {
    const chartEl = document.getElementById(chartId);
    if (!chartEl) return null;

    return new Chart(chartEl, {
      type: "doughnut",
      data: {
        labels: labels,
        datasets: [
          {
            data: data,
            backgroundColor: getColorPalette(labels.length),
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "right",
            labels: {
              boxWidth: 12,
              font: {
                size: 10,
              },
            },
          },
        },
      },
    });
  },

  /**
   * Render a standard details section
   * @param {string} elementId - The ID of the element to render into
   * @param {string} html - The HTML content for the details
   */
  renderDetails(elementId, html) {
    const detailsEl = safeGetElement(elementId);
    if (detailsEl) {
      detailsEl.innerHTML = html;
    }
  },

  /**
   * Show no data alert in a container
   * @param {string} containerId - The ID of the container
   * @param {string} message - The message to display
   */
  showNoDataAlert(containerId, message) {
    safeSetInnerHTML(
      containerId,
      `
      <div class="alert alert-info">
        ${message}
      </div>
    `
    );
  },
};

/**
 * Issuer Organization Analytics View
 */
const issuerOrganizationView = {
  id: "issuer-organization",
  title: "Issuer Organization Analytics",
  fullOrgData: null,

  async render() {
    const contentEl = safeGetElement("dashboard-content");
    if (!contentEl) return;

    contentEl.innerHTML = `
      <div class="container-fluid px-4">
        <h1 class="mt-4">${this.title}</h1>
        <ol class="breadcrumb mb-4">
          <li class="breadcrumb-item"><a href="#overview">Dashboard</a></li>
          <li class="breadcrumb-item active">Issuer Organization Analytics</li>
        </ol>
        
        <div class="row">
          <div class="col-lg-8">
            <div class="card mb-4">
              <div class="card-header d-flex justify-content-between align-items-center">
                <span><i class="bi bi-bar-chart me-1"></i> Certificate Issuers by Organization</span>
                <div class="btn-group" role="group">
                  <button type="button" class="btn btn-sm btn-outline-primary active" id="count-view-btn">Count</button>
                  <button type="button" class="btn btn-sm btn-outline-primary" id="share-view-btn">Market Share</button>
                </div>
              </div>
              <div class="card-body">
                <div id="org-chart-container" style="height: 400px">
                  <canvas id="issuer-organization-chart"></canvas>
                </div>
                <div id="chart-loading" class="text-center py-5">
                  <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                  </div>
                  <p class="mt-2">Loading issuer organization analytics...</p>
                </div>
              </div>
            </div>
          </div>
          
          <div class="col-lg-4">
            <div class="card mb-4">
              <div class="card-header">
                <i class="bi bi-pie-chart me-1"></i> Market Share Distribution
              </div>
              <div class="card-body">
                <div style="height: 400px">
                  <canvas id="issuer-organization-pie-chart"></canvas>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="row">
          <div class="col-12">
            <div class="card mb-4">
              <div class="card-header">
                <i class="bi bi-info-circle me-1"></i> Organization Details
              </div>
              <div class="card-body" id="issuer-organization-details">
                <p class="text-muted">Select an organization from the chart above to view details.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add event listeners for switching between count and market share views
    safeAddEventListener("count-view-btn", "click", () => {
      document.getElementById("count-view-btn").classList.add("active");
      document.getElementById("share-view-btn").classList.remove("active");
      this.updateChartView("count");
    });

    safeAddEventListener("share-view-btn", "click", () => {
      document.getElementById("count-view-btn").classList.remove("active");
      document.getElementById("share-view-btn").classList.add("active");
      this.updateChartView("share");
    });

    // Load data after rendering the view
    this.loadData();
  },

  async loadData() {
    try {
      // Show loading indicator
      analyticsViewUtils.toggleChartLoading(
        "chart-loading",
        "org-chart-container",
        true
      );

      // Fetch data from API
      const orgData = await API.getIssuerOrganizationAnalysis();

      // Store full data for later use
      this.fullOrgData = orgData;

      // Hide loading indicator
      analyticsViewUtils.toggleChartLoading(
        "chart-loading",
        "org-chart-container",
        false
      );

      if (!orgData || orgData.length === 0) {
        analyticsViewUtils.showNoDataAlert(
          "org-chart-container",
          "No issuer organization data available. Please check your certificate database."
        );
        return;
      }

      // Prepare data for the bar chart - top 10 organizations by certificate count
      const top10 = orgData.slice(0, 10);
      const barLabels = top10.map((org) => org.name);
      const barData = top10.map((org) => org.certificateCount);

      // Create the bar chart
      dashboardCharts.issuerOrgChart = analyticsViewUtils.createBarChart(
        "issuer-organization-chart",
        barLabels,
        barData,
        "Certificate Count",
        CONFIG.CHART_COLORS.PRIMARY,
        (event, elements) => {
          if (elements && elements.length > 0) {
            const index = elements[0].index;
            const orgName = barLabels[index];
            const orgDetails = orgData.find((o) => o.name === orgName);
            if (orgDetails) {
              this.showOrgDetails(orgDetails);
            }
          }
        }
      );

      // Create the pie chart for market share
      const pieData = analyticsViewUtils.prepareDistributionData(
        orgData,
        (org) => org.name,
        (org) => org.certificateCount
      );

      dashboardCharts.issuerOrgPieChart =
        analyticsViewUtils.createDoughnutChart(
          "issuer-organization-pie-chart",
          pieData.labels,
          pieData.data
        );
    } catch (error) {
      console.error("Error loading issuer organization data:", error);
      showAlert("Failed to load issuer organization analytics data", "error");
    }
  },

  updateChartView(type) {
    if (!this.fullOrgData || !dashboardCharts.issuerOrgChart) return;

    const top10 = this.fullOrgData.slice(0, 10);
    const labels = top10.map((org) => org.name);

    if (type === "count") {
      const data = top10.map((org) => org.certificateCount);
      dashboardCharts.issuerOrgChart.data.datasets[0].label =
        "Certificate Count";
      dashboardCharts.issuerOrgChart.data.datasets[0].data = data;
    } else {
      const totalCerts = this.fullOrgData.reduce(
        (sum, org) => sum + org.certificateCount,
        0
      );
      const data = top10.map((org) =>
        Math.round((org.certificateCount / totalCerts) * 100)
      );
      dashboardCharts.issuerOrgChart.data.datasets[0].label =
        "Market Share (%)";
      dashboardCharts.issuerOrgChart.data.datasets[0].data = data;
    }

    dashboardCharts.issuerOrgChart.update();
  },

  showOrgDetails(org) {
    const validPercentage = Math.round(
      (org.validCount / org.certificateCount) * 100
    );
    const expiredPercentage = Math.round(
      (org.expiredCount / org.certificateCount) * 100
    );
    const revokedPercentage = Math.round(
      (org.revokedCount / org.certificateCount) * 100
    );

    const html = `
      <div class="row">
        <div class="col-md-6 mb-4">
          <h5>${org.name}</h5>
          <p class="text-muted mb-3">Certificate Authority Organization</p>
          
          <div class="d-flex justify-content-between mb-2">
            <span class="fw-bold">Total Certificates:</span>
            <span>${org.certificateCount}</span>
          </div>
          
          <div class="d-flex justify-content-between mb-2">
            <span class="fw-bold">Valid Certificates:</span>
            <span>${org.validCount} (${validPercentage}%)</span>
          </div>
          
          <div class="d-flex justify-content-between mb-2">
            <span class="fw-bold">Expired Certificates:</span>
            <span>${org.expiredCount} (${expiredPercentage}%)</span>
          </div>
          
          <div class="d-flex justify-content-between mb-2">
            <span class="fw-bold">Revoked Certificates:</span>
            <span>${org.revokedCount || 0} (${revokedPercentage || 0}%)</span>
          </div>
        </div>
        
        <div class="col-md-6">
          <div class="card bg-light">
            <div class="card-body">
              <h6 class="card-title">Organization Information</h6>
              <p class="card-text">This overview shows certificate issuance statistics for ${
                org.name
              }. Certificate authorities issue digital certificates that verify the identity of entities and secure online communications.</p>
            </div>
          </div>
        </div>
      </div>
    `;

    analyticsViewUtils.renderDetails("issuer-organization-details", html);
  },

  destroy() {
    // Destroy charts to prevent memory leaks
    if (dashboardCharts.issuerOrgChart) {
      destroyChart(dashboardCharts.issuerOrgChart);
      dashboardCharts.issuerOrgChart = null;
    }
    if (dashboardCharts.issuerOrgPieChart) {
      destroyChart(dashboardCharts.issuerOrgPieChart);
      dashboardCharts.issuerOrgPieChart = null;
    }
  },
};

/**
 * Issuer Country Analytics View
 */
const issuerCountryView = {
  id: "issuer-country",
  title: "Issuer Country Analytics",
  fullCountryData: null,

  async render() {
    const contentEl = safeGetElement("dashboard-content");
    if (!contentEl) return;

    contentEl.innerHTML = `
      <div class="container-fluid px-4">
        <h1 class="mt-4">${this.title}</h1>
        <ol class="breadcrumb mb-4">
          <li class="breadcrumb-item"><a href="#overview">Dashboard</a></li>
          <li class="breadcrumb-item active">Issuer Country Analytics</li>
        </ol>
        
        <div class="row">
          <div class="col-lg-8">
            <div class="card mb-4">
              <div class="card-header">
                <i class="bi bi-globe me-1"></i> Certificate Issuers by Country
              </div>
              <div class="card-body">
                <div id="country-chart-container" style="height: 400px">
                  <canvas id="issuer-country-chart"></canvas>
                </div>
                <div id="chart-loading" class="text-center py-5">
                  <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                  </div>
                  <p class="mt-2">Loading country analytics...</p>
                </div>
              </div>
            </div>
          </div>
          
          <div class="col-lg-4">
            <div class="card mb-4">
              <div class="card-header">
                <i class="bi bi-pie-chart me-1"></i> Country Distribution
              </div>
              <div class="card-body">
                <div style="height: 400px">
                  <canvas id="issuer-country-pie-chart"></canvas>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="row">
          <div class="col-12">
            <div class="card mb-4">
              <div class="card-header">
                <i class="bi bi-info-circle me-1"></i> Country Details
              </div>
              <div class="card-body" id="issuer-country-details">
                <p class="text-muted">Select a country from the chart above to view details.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Load data after rendering the view
    this.loadData();
  },

  async loadData() {
    try {
      // Show loading indicator
      analyticsViewUtils.toggleChartLoading(
        "chart-loading",
        "country-chart-container",
        true
      );

      // Fetch data from API
      const countryData = await API.getIssuerCountryAnalysis();

      // Store full data for later use
      this.fullCountryData = countryData;

      // Hide loading indicator
      analyticsViewUtils.toggleChartLoading(
        "chart-loading",
        "country-chart-container",
        false
      );

      if (!countryData || countryData.length === 0) {
        analyticsViewUtils.showNoDataAlert(
          "country-chart-container",
          "No issuer country data available. Please check your certificate database."
        );
        return;
      }

      // Prepare data for the bar chart - top 10 countries by certificate count
      const top10 = countryData.slice(0, 10);
      const barLabels = top10.map((country) => country.name);
      const barData = top10.map((country) => country.certificateCount);

      // Create the bar chart
      dashboardCharts.issuerCountryChart = analyticsViewUtils.createBarChart(
        "issuer-country-chart",
        barLabels,
        barData,
        "Certificate Count",
        CONFIG.CHART_COLORS.SECONDARY,
        (event, elements) => {
          if (elements && elements.length > 0) {
            const index = elements[0].index;
            const countryName = barLabels[index];
            const countryDetails = countryData.find(
              (c) => c.name === countryName
            );
            if (countryDetails) {
              this.showCountryDetails(countryDetails);
            }
          }
        }
      );

      // Create the pie chart for distribution
      const pieData = analyticsViewUtils.prepareDistributionData(
        countryData,
        (country) => country.name,
        (country) => country.certificateCount
      );

      dashboardCharts.issuerCountryPieChart =
        analyticsViewUtils.createDoughnutChart(
          "issuer-country-pie-chart",
          pieData.labels,
          pieData.data
        );
    } catch (error) {
      console.error("Error loading country data:", error);
      showAlert("Failed to load issuer country analytics data", "error");
    }
  },

  showCountryDetails(country) {
    // Calculate some statistics for this country
    const validPercentage = Math.round(
      (country.validCount / country.certificateCount) * 100
    );
    const expiredPercentage = Math.round(
      (country.expiredCount / country.certificateCount) * 100
    );

    // Calculate global percentage
    const totalCerts = this.fullCountryData.reduce(
      (sum, c) => sum + c.certificateCount,
      0
    );
    const globalPercentage = Math.round(
      (country.certificateCount / totalCerts) * 100
    );

    const html = `
      <div class="row">
        <div class="col-md-6 mb-4">
          <h5>${country.name}</h5>
          <p class="text-muted mb-3">Certificate Issuer Country</p>
          
          <div class="d-flex justify-content-between mb-2">
            <span class="fw-bold">Total Certificates:</span>
            <span>${country.certificateCount}</span>
          </div>
          
          <div class="d-flex justify-content-between mb-2">
            <span class="fw-bold">Global Share:</span>
            <span>${globalPercentage}%</span>
          </div>
          
          <div class="d-flex justify-content-between mb-2">
            <span class="fw-bold">Valid Certificates:</span>
            <span>${country.validCount} (${validPercentage}%)</span>
          </div>
          
          <div class="d-flex justify-content-between mb-2">
            <span class="fw-bold">Expired Certificates:</span>
            <span>${country.expiredCount} (${expiredPercentage}%)</span>
          </div>
          
          <div class="d-flex justify-content-between mb-2">
            <span class="fw-bold">Organizations:</span>
            <span>${country.organizationCount || "N/A"}</span>
          </div>
        </div>
        
        <div class="col-md-6">
          <div class="card bg-light">
            <div class="card-body">
              <h6 class="card-title">Country Information</h6>
              <p class="card-text">This overview shows certificate issuance statistics for ${
                country.name
              }. The distribution of certificate authorities across countries can provide insights into the global trust infrastructure.</p>
            </div>
          </div>
        </div>
      </div>
    `;

    analyticsViewUtils.renderDetails("issuer-country-details", html);
  },

  destroy() {
    // Destroy charts to prevent memory leaks
    if (dashboardCharts.issuerCountryChart) {
      destroyChart(dashboardCharts.issuerCountryChart);
      dashboardCharts.issuerCountryChart = null;
    }
    if (dashboardCharts.issuerCountryPieChart) {
      destroyChart(dashboardCharts.issuerCountryPieChart);
      dashboardCharts.issuerCountryPieChart = null;
    }
  },
};

/**
 * Shared Public Keys view handler
 */
const sharedPubkeysView = {
  id: "shared-pubkeys",

  async render() {
    const contentEl = safeGetElement("dashboard-content");
    if (!contentEl) return;

    contentEl.innerHTML = `
      <div class="dashboard-section">
        <h2 class="dashboard-title mb-4">Shared Public Keys Analysis</h2>
        
        <div class="row mb-4">
          <div class="col-12">
            <div class="card">
              <div class="card-header">
                <h5 class="card-title mb-0">Certificates Sharing Public Keys</h5>
              </div>
              <div class="card-body">
                <div id="shared-pubkeys-container">
                  <div class="text-center my-5" id="shared-pubkeys-loading">
                    <div class="spinner-border text-primary" role="status">
                      <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="mt-2">Loading shared public keys analysis...</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Load data
    await this.loadData();
  },

  async loadData() {
    try {
      const container = safeGetElement("shared-pubkeys-container");
      const loadingEl = safeGetElement("shared-pubkeys-loading");

      if (!container) return;

      // Fetch data
      const response = await API.getSharedPubkeys();
      const data = response.shared_pubkeys || [];

      // Hide loading
      if (loadingEl) {
        loadingEl.style.display = "none";
      }

      // Check if there's no data
      if (!data || !data.length) {
        container.innerHTML = `
          <div class="alert alert-info">
            <i class="bi bi-info-circle me-2"></i>
            No certificates found sharing the same public key.
          </div>
        `;
        return;
      }

      // Render the data
      let html = `
        <div class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th>Public Key Hash</th>
                <th>Number of Certificates</th>
                <th>Issuers</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
      `;

      // Add table rows
      data.forEach((item) => {
        html += `
          <tr>
            <td><code>${
              item._id ? item._id.substring(0, 16) + "..." : "N/A"
            }</code></td>
            <td>${item.count || 0}</td>
            <td>${
              Array.isArray(item.issuers)
                ? item.issuers.slice(0, 2).join(", ") +
                  (item.issuers.length > 2 ? "..." : "")
                : "Unknown"
            }</td>
            <td>
              <button class="btn btn-sm btn-outline-primary shared-key-details" 
                data-pubkey-index="${data.indexOf(item)}">
                View Certificates
              </button>
            </td>
          </tr>
        `;
      });

      html += `
            </tbody>
          </table>
        </div>
        
        <div id="shared-key-details-container" class="mt-4" style="display: none;">
          <h5 class="mb-3">Certificates Using Same Public Key</h5>
          <div id="shared-key-details-content"></div>
        </div>
      `;

      container.innerHTML = html;

      // Store data for reference
      this.sharedKeysData = data;

      // Add event listeners for details buttons
      document.querySelectorAll(".shared-key-details").forEach((button) => {
        button.addEventListener("click", () => {
          const index = parseInt(button.getAttribute("data-pubkey-index"));
          if (
            !isNaN(index) &&
            this.sharedKeysData &&
            this.sharedKeysData[index]
          ) {
            this.showSharedKeyDetails(this.sharedKeysData[index]);
          }
        });
      });
    } catch (error) {
      console.error("Error loading shared public keys data:", error);
      const container = safeGetElement("shared-pubkeys-container");
      if (container) {
        container.innerHTML = `
          <div class="alert alert-danger">
            <i class="bi bi-exclamation-triangle me-2"></i>
            Failed to load shared public keys data. ${error.message}
          </div>
        `;
      }
    }
  },

  showSharedKeyDetails(keyData) {
    const container = safeGetElement("shared-key-details-container");
    const content = safeGetElement("shared-key-details-content");

    if (!container || !content) return;

    // Show the container
    container.style.display = "block";

    // Get certificate data
    const certificates = keyData.certificates || [];

    // Display public key info
    let html = `
      <div class="mb-3">
        <div class="alert alert-info">
          <i class="bi bi-key me-2"></i>
          <strong>Public Key Hash:</strong> ${keyData._id || "Unknown"}
        </div>
        <div class="d-flex mb-3">
          <div class="badge bg-primary me-2">Used by ${
            keyData.count || 0
          } certificates</div>
          <div class="badge bg-secondary me-2">Across ${
            keyData.issuers?.length || 0
          } issuers</div>
          <div class="badge bg-info">For ${
            keyData.domains?.length || 0
          } domains</div>
        </div>
      </div>
    `;

    // Create table of certificates using this key
    html += `
      <div class="table-responsive">
        <table class="table table-sm table-hover">
          <thead>
            <tr>
              <th>Serial Number</th>
              <th>Issuer</th>
              <th>Subject</th>
              <th>Validity</th>
            </tr>
          </thead>
          <tbody>
    `;

    if (certificates.length > 0) {
      certificates.forEach((cert) => {
        html += `
          <tr>
            <td><code>${cert.serial_number || "N/A"}</code></td>
            <td>${cert.issuer || "N/A"}</td>
            <td>${cert.subject || "N/A"}</td>
            <td>${formatDate(cert.validity_start)} to ${formatDate(
          cert.validity_end
        )}</td>
          </tr>
        `;
      });
    } else {
      html += `<tr><td colspan="4" class="text-center">No certificate details available</td></tr>`;
    }

    html += `
          </tbody>
        </table>
      </div>
      
      <div class="alert alert-warning mt-3">
        <i class="bi bi-exclamation-triangle me-2"></i>
        <strong>Security Note:</strong> Multiple certificates sharing the same public key may indicate 
        certificate cloning or improper key management practices.
      </div>
    `;

    content.innerHTML = html;
  },

  destroy() {
    // Clean up resources
    // Remove any event listeners or timers
  },
};

// All dashboard views
const dashboardViews = [
  overviewView,
  activeExpiredView,
  typeDistributionView,
  // Add new views
  validityAnalyticsView,
  signatureAnalyticsView,
  caAnalyticsView,
  sanAnalyticsView,
  trendsAnalyticsView,
  // Additional views
  subjectNamesView,
  caDomainView,
  caUrlView,
  caPubkeyView,
  issuerOrganizationView,
  issuerCountryView,
  sharedPubkeysView,
];

/**
 * Navigate to a specific view
 * @param {string} viewId - View identifier
 */
function navigateTo(viewId) {
  try {
    // Update URL hash without triggering a page reload
    if (history.pushState) {
      history.pushState(null, null, `#${viewId}`);
    } else {
      window.location.hash = viewId;
    }

    // Remove active class from all nav links
    document.querySelectorAll("#dashboard-nav .nav-link").forEach((link) => {
      link.classList.remove("active");
    });

    // Add active class to the target nav link
    const targetLink = document.querySelector(
      `#dashboard-nav .nav-link[data-view="${viewId}"]`
    );
    if (targetLink) {
      targetLink.classList.add("active");
    }

    // Get the current active view and destroy it if needed
    for (const view of dashboardViews) {
      if (view && view.destroy) {
        try {
          view.destroy();
        } catch (error) {
          console.error(`Error destroying view ${view.id}:`, error);
        }
      }
    }

    // Make sure dashboard content element exists
    const contentEl = safeGetElement("dashboard-content");
    if (!contentEl) {
      console.error("Dashboard content element not found. Cannot render view.");
      return;
    }

    // Find and render the requested view
    if (viewId in viewHandlers) {
      try {
        viewHandlers[viewId].render();
      } catch (error) {
        console.error(`Error rendering view "${viewId}":`, error);
        contentEl.innerHTML = `
          <div class="alert alert-danger">
            <h4 class="alert-heading">Error Loading View</h4>
            <p>There was an error loading the requested view. Please try refreshing the page.</p>
            <hr>
            <p class="mb-0">Error details: ${error.message}</p>
          </div>
        `;
      }
    } else {
      // If view not found, default to overview
      try {
        viewHandlers[CONFIG.DEFAULT_VIEW].render();
      } catch (error) {
        console.error(`Error rendering default view:`, error);
        contentEl.innerHTML = `
          <div class="alert alert-danger">
            <h4 class="alert-heading">Error Loading Default View</h4>
            <p>There was an error loading the default view. Please try refreshing the page.</p>
            <hr>
            <p class="mb-0">Error details: ${error.message}</p>
          </div>
        `;
      }
    }
  } catch (error) {
    console.error("Navigation error:", error);
    showAlert("Navigation error: " + error.message, "error");
  }
}

// Create a utility function to safely set inner HTML
function safeSetInnerHTML(elementId, html) {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = html;
  } else {
    console.error(`Element with ID "${elementId}" not found`);
  }
}

// Add safe event listener utility function
function safeAddEventListener(elementId, event, callback) {
  const element = document.getElementById(elementId);
  if (element) {
    element.addEventListener(event, callback);
  } else {
    console.error(
      `Element with ID "${elementId}" not found for event listener`
    );
  }
}

// Utility function to safely get a DOM element
function safeGetElement(elementId) {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with ID "${elementId}" not found`);
  }
  return element;
}
