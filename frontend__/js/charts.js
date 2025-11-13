/**
 * Chart utilities for the Certificate Analytics Dashboard
 */

/**
 * Create a doughnut/pie chart
 * @param {string} canvasId - Canvas element ID
 * @param {Array} labels - Chart labels
 * @param {Array} data - Chart data values
 * @param {Object} options - Additional chart options
 * @returns {Chart} Chart instance
 */
function createDoughnutChart(canvasId, labels, data, options = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;

  const ctx = canvas.getContext("2d");

  // Default options for doughnut charts
  const defaultOptions = {
    cutout: "65%",
    plugins: {
      legend: {
        position: "right",
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: "circle",
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.label || "";
            const value = context.raw || 0;
            const total = context.chart.data.datasets[0].data.reduce(
              (a, b) => a + b,
              0
            );
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  // Merge options
  const chartOptions = {
    ...CONFIG.CHART_OPTIONS,
    ...defaultOptions,
    ...options,
  };

  return new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: CONFIG.CHART_COLOR_PALETTE.slice(0, data.length),
          borderWidth: 0,
        },
      ],
    },
    options: chartOptions,
  });
}

/**
 * Create a bar chart
 * @param {string} canvasId - Canvas element ID
 * @param {Array} labels - Chart labels
 * @param {Array} data - Chart data values
 * @param {string} label - Dataset label
 * @param {Object} options - Additional chart options
 * @returns {Chart} Chart instance
 */
function createBarChart(canvasId, labels, data, label = "", options = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;

  const ctx = canvas.getContext("2d");

  // Default options for bar charts
  const defaultOptions = {
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
    barPercentage: 0.6,
    categoryPercentage: 0.7,
  };

  // Merge options
  const chartOptions = {
    ...CONFIG.CHART_OPTIONS,
    ...defaultOptions,
    ...options,
  };

  return new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: label,
          data: data,
          backgroundColor: CONFIG.CHART_COLORS.PRIMARY,
          borderWidth: 0,
          borderRadius: 4,
        },
      ],
    },
    options: chartOptions,
  });
}

/**
 * Create a line chart
 * @param {string} canvasId - Canvas element ID
 * @param {Array} labels - Chart labels
 * @param {Array} data - Chart data values
 * @param {string} label - Dataset label
 * @param {Object} options - Additional chart options
 * @returns {Chart} Chart instance
 */
function createLineChart(canvasId, labels, data, label = "", options = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;

  const ctx = canvas.getContext("2d");

  // Default options for line charts
  const defaultOptions = {
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
    elements: {
      line: {
        tension: 0.4,
      },
      point: {
        radius: 4,
        hoverRadius: 6,
      },
    },
  };

  // Merge options
  const chartOptions = {
    ...CONFIG.CHART_OPTIONS,
    ...defaultOptions,
    ...options,
  };

  return new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: label,
          data: data,
          backgroundColor: "rgba(25, 118, 210, 0.1)",
          borderColor: CONFIG.CHART_COLORS.PRIMARY,
          borderWidth: 2,
          fill: true,
        },
      ],
    },
    options: chartOptions,
  });
}

/**
 * Create a multi-series chart (bar, line, etc.)
 * @param {string} canvasId - Canvas element ID
 * @param {Array} labels - Chart labels
 * @param {Array} datasets - Array of dataset objects
 * @param {string} type - Chart type ('bar', 'line', etc.)
 * @param {Object} options - Additional chart options
 * @returns {Chart} Chart instance
 */
function createMultiChart(
  canvasId,
  labels,
  datasets,
  type = "bar",
  options = {}
) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;

  const ctx = canvas.getContext("2d");

  // Default options based on chart type
  let defaultOptions = {};

  if (type === "bar") {
    defaultOptions = {
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: "rgba(0, 0, 0, 0.05)",
          },
        },
        x: {
          grid: {
            display: false,
          },
        },
      },
      barPercentage: 0.7,
      categoryPercentage: 0.8,
    };
  } else if (type === "line") {
    defaultOptions = {
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: "rgba(0, 0, 0, 0.05)",
          },
        },
        x: {
          grid: {
            display: false,
          },
        },
      },
      elements: {
        line: {
          tension: 0.4,
        },
        point: {
          radius: 3,
          hoverRadius: 5,
        },
      },
    };
  }

  // Merge options
  const chartOptions = {
    ...CONFIG.CHART_OPTIONS,
    ...defaultOptions,
    ...options,
  };

  return new Chart(ctx, {
    type: type,
    data: {
      labels: labels,
      datasets: datasets,
    },
    options: chartOptions,
  });
}

/**
 * Update chart data
 * @param {Chart} chart - Chart instance
 * @param {Array} labels - New labels
 * @param {Array} data - New data
 * @param {number} datasetIndex - Dataset index to update
 */
function updateChart(chart, labels, data, datasetIndex = 0) {
  if (!chart) return;

  chart.data.labels = labels;
  chart.data.datasets[datasetIndex].data = data;
  chart.update();
}

/**
 * Destroy chart to prevent memory leaks
 * @param {Chart} chart - Chart instance to destroy
 */
function destroyChart(chart) {
  if (chart) {
    chart.destroy();
  }
}
