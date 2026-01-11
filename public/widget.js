/*
  Minimal placeholder widget loader.
  This prevents 404 errors when app/page.tsx loads /widget.js.
  If you have a real embeddable widget bundle, replace this file.
*/
(function () {
  if (typeof window === 'undefined') return;
  if (window.__CHATBOT_WIDGET_LOADED__) return;
  window.__CHATBOT_WIDGET_LOADED__ = true;

  // No-op placeholder
  // eslint-disable-next-line no-console
  console.info('[chatbot] widget.js loaded (placeholder)');
})();
