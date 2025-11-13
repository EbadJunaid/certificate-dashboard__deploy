/**
 * View handlers for the Certificate Analytics Dashboard
 */

// Dashboard chart and data instances
let dashboardCharts = {};
let dashboardData = {};

// Current view tracker
let CURRENT_VIEW = null;

/**
 * Overview view handler
 */
const overviewView = {
  id: "overview",

  async render() {
    const contentEl = document.getElementById("dashboard-content");
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

    // Set up event listeners first
    const viewAllBtn = document.getElementById("view-all-certs");
    if (viewAllBtn) {
      viewAllBtn.addEventListener("click", () => {
        navigateTo("active-expired");
      });
    }

    // Load overview data
    await this.loadData();
  },

  async loadData() {
    try {
      // Fetch overview data
      const data = await API.getOverview();
      dashboardData.overview = data;

      // Update stats with null checks
      const totalEl = document.getElementById("total-certificates");
      const activeEl = document.getElementById("active-certificates");
      const expiredEl = document.getElementById("expired-certificates");
      const expiringEl = document.getElementById("expiring-certificates");

      if (totalEl) totalEl.textContent = formatNumber(data.total);
      if (activeEl) activeEl.textContent = formatNumber(data.active);
      if (expiredEl) expiredEl.textContent = formatNumber(data.expired);
      if (expiringEl) expiringEl.textContent = formatNumber(data.expiring_soon);

      // Create status chart
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

      // Create types chart
      const typesLabels = data.types.map((item) => item._id);
      const typesData = data.types.map((item) => item.count);
      dashboardCharts.typesChart = createDoughnutChart(
        "types-chart",
        typesLabels,
        typesData
      );

      // Fetch certificates for the table
      const certificates = await API.getAllCertificates();

      // Sort by issue date (newest first) and take the first 5
      const recentCertificates = certificates
        .sort((a, b) => new Date(b.issue_date) - new Date(a.issue_date))
        .slice(0, 5);

      // Update table
      const tableBody = document.getElementById("recent-certificates-table");

      if (recentCertificates.length === 0) {
        tableBody.innerHTML =
          '<tr><td colspan="6" class="text-center">No certificates found</td></tr>';
        return;
      }

      tableBody.innerHTML = recentCertificates
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
    } catch (error) {
      console.error("Error loading overview data:", error);
      showError(
        "dashboard-content",
        "Failed to load overview data. Please try again later."
      );
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

  async render() {
    const contentEl = document.getElementById("dashboard-content");
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
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

    // Load active/expired data
    await this.loadData();

    // Set up event listeners with null checks
    const showChartBtn = document.getElementById("show-chart-btn");
    if (showChartBtn) {
      showChartBtn.addEventListener("click", () => {
        const statusChartContainer = document.getElementById("status-chart-container");
        const statusTableContainer = document.getElementById("status-table-container");
        if (statusChartContainer && statusTableContainer) {
          showChartBtn.classList.add("active");
          document.getElementById("show-table-btn")?.classList.remove("active");
          statusChartContainer.classList.remove("d-none");
          statusTableContainer.classList.add("d-none");
        }
      });
    }

    const showTableBtn = document.getElementById("show-table-btn");
    if (showTableBtn) {
      showTableBtn.addEventListener("click", () => {
        const statusChartContainer = document.getElementById("status-chart-container");
        const statusTableContainer = document.getElementById("status-table-container");
        if (statusChartContainer && statusTableContainer) {
          document.getElementById("show-chart-btn")?.classList.remove("active");
          showTableBtn.classList.add("active");
          statusChartContainer.classList.add("d-none");
          statusTableContainer.classList.remove("d-none");
        }
      });
    }
  },

  async loadData() {
    try {
      // Fetch data
      const overviewData = dashboardData.overview || (await API.getOverview());
      const activeCertificates = await API.getActiveCertificates();
      const expiredCertificates = await API.getExpiredCertificates();
      const departmentsData = await API.getDepartmentDistribution();

      // Create status chart
      const statusLabels = ["Active", "Expired"];
      const statusData = [overviewData.active, overviewData.expired];
      dashboardCharts.activeExpiredChart = createDoughnutChart(
        "active-expired-chart",
        statusLabels,
        statusData,
        {
          cutout: "60%",
          plugins: {
            tooltip: {
              callbacks: {
                label: function (context) {
                  const value = context.raw;
                  const total = overviewData.total;
                  const percentage = Math.round((value / total) * 100);
                  return `${context.label}: ${value} (${percentage}%)`;
                },
              },
            },
          },
        }
      );

      // Update status stats table
      const statusStatsTable = document.getElementById("status-stats-table");
      const total = overviewData.total;

      statusStatsTable.innerHTML = `
                <tr>
                    <td><span class="badge badge-active">Active</span></td>
                    <td>${formatNumber(overviewData.active)}</td>
                    <td>${Math.round((overviewData.active / total) * 100)}%</td>
                </tr>
                <tr>
                    <td><span class="badge badge-expired">Expired</span></td>
                    <td>${formatNumber(overviewData.expired)}</td>
                    <td>${Math.round(
                      (overviewData.expired / total) * 100
                    )}%</td>
                </tr>
                <tr class="table-light">
                    <td><strong>Total</strong></td>
                    <td><strong>${formatNumber(total)}</strong></td>
                    <td><strong>100%</strong></td>
                </tr>
            `;

      // Group certificates by department and count active/expired
      const departmentData = {};

      departmentsData.departments.forEach((dept) => {
        departmentData[dept._id] = {
          name: dept._id,
          active: 0,
          expired: 0,
        };
      });

      activeCertificates.forEach((cert) => {
        if (departmentData[cert.department]) {
          departmentData[cert.department].active++;
        }
      });

      expiredCertificates.forEach((cert) => {
        if (departmentData[cert.department]) {
          departmentData[cert.department].expired++;
        }
      });

      // Create department status chart
      const departmentNames = Object.values(departmentData).map(
        (dept) => dept.name
      );
      const activeByDept = Object.values(departmentData).map(
        (dept) => dept.active
      );
      const expiredByDept = Object.values(departmentData).map(
        (dept) => dept.expired
      );

      dashboardCharts.departmentStatusChart = createMultiChart(
        "department-status-chart",
        departmentNames,
        [
          {
            label: "Active",
            data: activeByDept,
            backgroundColor: CONFIG.CHART_COLORS.SUCCESS,
            borderWidth: 0,
            borderRadius: 4,
          },
          {
            label: "Expired",
            data: expiredByDept,
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

      // Update active certificates table
      const activeCertsTable = document.getElementById(
        "active-certificates-table"
      );

      if (activeCertificates.length === 0) {
        activeCertsTable.innerHTML =
          '<tr><td colspan="7" class="text-center">No active certificates found</td></tr>';
      } else {
        activeCertsTable.innerHTML = activeCertificates
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

      // Update expired certificates table
      const expiredCertsTable = document.getElementById(
        "expired-certificates-table"
      );

      if (expiredCertificates.length === 0) {
        expiredCertsTable.innerHTML =
          '<tr><td colspan="7" class="text-center">No expired certificates found</td></tr>';
      } else {
        expiredCertsTable.innerHTML = expiredCertificates
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
      document.querySelectorAll(".view-cert-details").forEach((button) => {
        button.addEventListener("click", async (e) => {
          const certId = e.currentTarget.getAttribute("data-cert-id");
          const cert = [...activeCertificates, ...expiredCertificates].find(
            (c) => c.certificate_id === certId
          );
          showCertificateDetails(cert);
        });
      });
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
 * Show certificate details in modal
 * @param {Object} certificate - Certificate object
 */
function showCertificateDetails(certificate) {
  if (!certificate) return;

  const modalContent = document.getElementById("certificateDetailsContent");
  const modal = new bootstrap.Modal(
    document.getElementById("certificateDetailsModal")
  );

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
                    <div>${daysRemain > 0 ? daysRemain + " days" : "Expired"}</div>
                </div>
                
                <div class="mb-3">
                    <label class="fw-bold mb-1">Auto Renewal</label>
                    <div>${certificate.auto_renewal ? "Enabled" : "Disabled"}</div>
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

  modal.show();
}

/**
 * Issuance Timeline view handler
 */
const issuanceTimelineView = {
  id: "issuance-timeline",
  
  async render() {
    const contentEl = document.getElementById("dashboard-content");
    contentEl.innerHTML = `
      <div class="dashboard-section">
        <h2 class="dashboard-title mb-4">Certificate Issuance Timeline</h2>
        <div class="card">
          <div class="card-header">
            <h5 class="card-title mb-0">Issuance Over Time</h5>
          </div>
          <div class="card-body">
            <div class="chart-container" style="height: 400px;">
              <canvas id="timeline-chart"></canvas>
            </div>
          </div>
        </div>
      </div>
    `;
    await this.loadData();
  },
  
  async loadData() {
    try {
      const data = await API.getIssuanceTimeline();
      const labels = data.timeline.map(item => item._id);
      const counts = data.timeline.map(item => item.count);
      
      dashboardCharts.timelineChart = createLineChart(
        "timeline-chart",
        labels,
        counts,
        "Certificates Issued"
      );
    } catch (error) {
      console.error("Error loading timeline data:", error);
      showError("dashboard-content", "Failed to load timeline data.");
    }
  },
  
  destroy() {
    if (dashboardCharts.timelineChart) {
      destroyChart(dashboardCharts.timelineChart);
      dashboardCharts.timelineChart = null;
    }
  }
};

/**
 * Top Issuers view handler
 */
const topIssuersView = {
  id: "top-issuers",
  
  async render() {
    const contentEl = document.getElementById("dashboard-content");
    contentEl.innerHTML = `
      <div class="dashboard-section">
        <h2 class="dashboard-title mb-4">Top Certificate Issuers</h2>
        <div class="row">
          <div class="col-md-6 mb-4">
            <div class="card">
              <div class="card-header">
                <h5 class="card-title mb-0">Top Issuers</h5>
              </div>
              <div class="card-body">
                <div class="chart-container">
                  <canvas id="issuers-chart"></canvas>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-6 mb-4">
            <div class="card">
              <div class="card-header">
                <h5 class="card-title mb-0">Issuer Statistics</h5>
              </div>
              <div class="card-body">
                <div class="table-responsive">
                  <table class="table table-hover">
                    <thead>
                      <tr>
                        <th>Issuer</th>
                        <th>Count</th>
                      </tr>
                    </thead>
                    <tbody id="issuers-table">
                      <tr><td colspan="2" class="text-center">Loading...</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    await this.loadData();
  },
  
  async loadData() {
    try {
      const data = await API.getTopIssuers();
      const labels = data.issuers.map(item => item._id);
      const counts = data.issuers.map(item => item.count);
      
      dashboardCharts.issuersChart = createBarChart(
        "issuers-chart",
        labels,
        counts,
        "Certificates"
      );
      
      const tableBody = document.getElementById("issuers-table");
      tableBody.innerHTML = data.issuers.map(issuer => `
        <tr>
          <td>${issuer._id}</td>
          <td>${issuer.count}</td>
        </tr>
      `).join("");
    } catch (error) {
      console.error("Error loading issuers data:", error);
      showError("dashboard-content", "Failed to load issuers data.");
    }
  },
  
  destroy() {
    if (dashboardCharts.issuersChart) {
      destroyChart(dashboardCharts.issuersChart);
      dashboardCharts.issuersChart = null;
    }
  }
};

/**
 * Expiring Soon view handler
 */
const expiringSoonView = {
  id: "expiring-soon",
  
  async render() {
    const contentEl = document.getElementById("dashboard-content");
    contentEl.innerHTML = `
      <div class="dashboard-section">
        <h2 class="dashboard-title mb-4">Certificates Expiring Soon</h2>
        <div class="card">
          <div class="card-header">
            <h5 class="card-title mb-0">Expiring Certificates</h5>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Issuer</th>
                    <th>Expiry Date</th>
                    <th>Days Remaining</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody id="expiring-table">
                  <tr><td colspan="6" class="text-center">Loading...</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;
    await this.loadData();
  },
  
  async loadData() {
    try {
      const data = await API.getExpiringCertificates();
      const tableBody = document.getElementById("expiring-table");
      
      if (data.expiring.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No certificates expiring soon</td></tr>';
        return;
      }
      
      tableBody.innerHTML = data.expiring.map(cert => {
        const days = daysRemaining(cert.expiry_date);
        return `
          <tr>
            <td>${cert.name}</td>
            <td>${cert.type}</td>
            <td>${cert.issuer}</td>
            <td>${formatDate(cert.expiry_date, CONFIG.DATE_FORMAT_OPTIONS.short)}</td>
            <td>${createExpiryBadge(days)}</td>
            <td>
              <button class="btn btn-sm btn-outline-primary view-cert-details" data-cert-id="${cert.certificate_id}">
                <i class="bi bi-info-circle"></i>
              </button>
            </td>
          </tr>
        `;
      }).join("");
      
      document.querySelectorAll(".view-cert-details").forEach(button => {
        button.addEventListener("click", async (e) => {
          const certId = e.currentTarget.getAttribute("data-cert-id");
          const cert = data.expiring.find(c => c.certificate_id === certId);
          showCertificateDetails(cert);
        });
      });
    } catch (error) {
      console.error("Error loading expiring certificates:", error);
      showError("dashboard-content", "Failed to load expiring certificates.");
    }
  },
  
  destroy() {}
};

/**
 * Region Breakdown view handler
 */
const regionBreakdownView = {
  id: "region-breakdown",
  
  async render() {
    const contentEl = document.getElementById("dashboard-content");
    contentEl.innerHTML = `
      <div class="dashboard-section">
        <h2 class="dashboard-title mb-4">Regional Certificate Breakdown</h2>
        <div class="row">
          <div class="col-md-6 mb-4">
            <div class="card">
              <div class="card-header">
                <h5 class="card-title mb-0">Certificates by Region</h5>
              </div>
              <div class="card-body">
                <div class="chart-container">
                  <canvas id="region-chart"></canvas>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-6 mb-4">
            <div class="card">
              <div class="card-header">
                <h5 class="card-title mb-0">Regional Statistics</h5>
              </div>
              <div class="card-body">
                <div class="table-responsive">
                  <table class="table table-hover">
                    <thead>
                      <tr>
                        <th>Region</th>
                        <th>Count</th>
                        <th>Percentage</th>
                      </tr>
                    </thead>
                    <tbody id="region-table">
                      <tr><td colspan="3" class="text-center">Loading...</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    await this.loadData();
  },
  
  async loadData() {
    try {
      const data = await API.getRegionBreakdown();
      const labels = data.regions.map(item => item._id);
      const counts = data.regions.map(item => item.count);
      const total = counts.reduce((a, b) => a + b, 0);
      
      dashboardCharts.regionChart = createDoughnutChart("region-chart", labels, counts);
      
      const tableBody = document.getElementById("region-table");
      tableBody.innerHTML = data.regions.map(region => {
        const percentage = Math.round((region.count / total) * 100);
        return `
          <tr>
            <td>${region._id}</td>
            <td>${region.count}</td>
            <td>${percentage}%</td>
          </tr>
        `;
      }).join("");
    } catch (error) {
      console.error("Error loading region data:", error);
      showError("dashboard-content", "Failed to load region data.");
    }
  },
  
  destroy() {
    if (dashboardCharts.regionChart) {
      destroyChart(dashboardCharts.regionChart);
      dashboardCharts.regionChart = null;
    }
  }
};

/**
 * Department Distribution view handler
 */
const departmentDistributionView = {
  id: "department-distribution",
  
  async render() {
    const contentEl = document.getElementById("dashboard-content");
    contentEl.innerHTML = `
      <div class="dashboard-section">
        <h2 class="dashboard-title mb-4">Department Certificate Distribution</h2>
        <div class="row">
          <div class="col-md-6 mb-4">
            <div class="card">
              <div class="card-header">
                <h5 class="card-title mb-0">Certificates by Department</h5>
              </div>
              <div class="card-body">
                <div class="chart-container">
                  <canvas id="department-chart"></canvas>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-6 mb-4">
            <div class="card">
              <div class="card-header">
                <h5 class="card-title mb-0">Department Statistics</h5>
              </div>
              <div class="card-body">
                <div class="table-responsive">
                  <table class="table table-hover">
                    <thead>
                      <tr>
                        <th>Department</th>
                        <th>Count</th>
                        <th>Percentage</th>
                      </tr>
                    </thead>
                    <tbody id="department-table">
                      <tr><td colspan="3" class="text-center">Loading...</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    await this.loadData();
  },
  
  async loadData() {
    try {
      const data = await API.getDepartmentDistribution();
      const labels = data.departments.map(item => item._id);
      const counts = data.departments.map(item => item.count);
      const total = counts.reduce((a, b) => a + b, 0);
      
      dashboardCharts.departmentChart = createBarChart("department-chart", labels, counts, "Certificates");
      
      const tableBody = document.getElementById("department-table");
      tableBody.innerHTML = data.departments.map(dept => {
        const percentage = Math.round((dept.count / total) * 100);
        return `
          <tr>
            <td>${dept._id}</td>
            <td>${dept.count}</td>
            <td>${percentage}%</td>
          </tr>
        `;
      }).join("");
    } catch (error) {
      console.error("Error loading department data:", error);
      showError("dashboard-content", "Failed to load department data.");
    }
  },
  
  destroy() {
    if (dashboardCharts.departmentChart) {
      destroyChart(dashboardCharts.departmentChart);
      dashboardCharts.departmentChart = null;
    }
  }
};

/**
 * ML Predictions view handler
 */
const mlPredictionsView = {
  id: "ml-predictions",
  
  async render() {
    const contentEl = document.getElementById("dashboard-content");
    contentEl.innerHTML = `
      <div class="dashboard-section">
        <h2 class="dashboard-title mb-4">ML-Based Certificate Expiry Predictions</h2>
        <div class="card mb-4">
          <div class="card-body text-center">
            <button id="run-ml-prediction-btn" class="btn btn-primary btn-lg">
              <i class="bi bi-lightning-fill me-2"></i>
              Run ML Prediction Analysis
            </button>
          </div>
        </div>
        <div id="ml-results"></div>
      </div>
    `;
  },
  
  destroy() {}
};

/**
 * Anomaly Detection view handler
 */
const anomalyDetectionView = {
  id: "anomaly-detection",
  
  async render() {
    const contentEl = document.getElementById("dashboard-content");
    contentEl.innerHTML = `
      <div class="dashboard-section">
        <h2 class="dashboard-title mb-4">Certificate Anomaly Detection</h2>
        <div class="card mb-4">
          <div class="card-body text-center">
            <button id="run-anomaly-detection-btn" class="btn btn-warning btn-lg">
              <i class="bi bi-bug-fill me-2"></i>
              Run Anomaly Detection
            </button>
          </div>
        </div>
        <div id="anomaly-results"></div>
      </div>
    `;
  },
  
  destroy() {}
};

// All dashboard views
const VIEWS = [
  overviewView,
  activeExpiredView,
  typeDistributionView,
  issuanceTimelineView,
  topIssuersView,
  expiringSoonView,
  regionBreakdownView,
  departmentDistributionView,
  mlPredictionsView,
  anomalyDetectionView
];

/**
 * Navigate to the specified view
 * @param {string} viewId - ID of the view to navigate to
 */
function navigateTo(viewId) {
  try {
    // Check if view exists
    const view = VIEWS.find((v) => v.id === viewId);
    if (!view) {
      throw new Error(`View ${viewId} not found`);
    }

    // Update active navigation
    document.querySelectorAll("#dashboard-nav .nav-link").forEach((el) => {
      el.classList.remove("active");
    });
    const navLink = document.querySelector(`#dashboard-nav .nav-link[data-view="${viewId}"]`);
    if (navLink) {
      navLink.classList.add("active");
    }

    // Destroy current view if it exists (cleanup charts and event listeners)
    if (CURRENT_VIEW && CURRENT_VIEW.destroy) {
      CURRENT_VIEW.destroy();
    }

    // Clear the dashboard content before rendering new view
    const contentEl = document.getElementById("dashboard-content");
    if (contentEl) {
      contentEl.innerHTML = '';
    }

    // Set current view
    CURRENT_VIEW = view;

    // Render view
    view.render();
  } catch (error) {
    console.error("Navigation error:", error);
    const contentEl = document.getElementById("dashboard-content");
    if (contentEl) {
      contentEl.innerHTML = `
        <div class="alert alert-danger">
          <i class="bi bi-exclamation-triangle-fill me-2"></i>
          Error loading view: ${error.message}
        </div>
      `;
    }
  }
}