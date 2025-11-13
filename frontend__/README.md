# Certificate Analytics Dashboard Frontend

This is the frontend for the Certificate Analytics Dashboard, built with Bootstrap 5 and vanilla JavaScript.

## Features

- Responsive dashboard with 10 different views
- Material 3 design principles applied using Bootstrap 5
- Interactive charts using Chart.js
- Pure JavaScript implementation (no frameworks)
- Mock machine learning insights and anomaly detection

## Structure

- `index.html` - Main HTML file
- `css/` - CSS stylesheets
  - `styles.css` - Custom styles with Material 3 inspiration
- `js/` - JavaScript files
  - `config.js` - Configuration settings
  - `utils.js` - Utility functions
  - `api.js` - API communication
  - `charts.js` - Chart creation and management
  - `views.js` - View handlers
  - `app.js` - Main application script

## Setup

1. Make sure the backend server is running (see backend README)

2. The frontend can be served using any static file server. For development, you can use:

   **Python:**

   ```
   cd frontend
   python -m http.server 8080
   ```

   **Node.js:**

   ```
   npx serve frontend -p 8080
   ```

3. Open the dashboard in a browser:
   ```
   http://localhost:8080
   ```

## Browser Support

The dashboard is compatible with modern browsers:

- Chrome (recommended)
- Firefox
- Edge
- Safari

## Notes

- The dashboard connects to the backend API at `http://localhost:8000` by default
- This can be changed in the `config.js` file
- For production use, consider using a proper web server like Nginx or Apache
