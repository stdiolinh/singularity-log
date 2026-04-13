(function (w) {
  "use strict";
  /**
   * Base URL for the Node API (no trailing slash). Empty string = same origin (npm start).
   * On GitHub Pages, set this to your deployed server, e.g. https://your-app.onrender.com
   */
  w.__API_BASE__ = "";
})(typeof window !== "undefined" ? window : self);
