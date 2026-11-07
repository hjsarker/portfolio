(() => {
  "use strict";
  const trigger = document.getElementById("brand-photo-toggle");
  const dialog = document.getElementById("portrait-dialog");
  const closeButton = document.getElementById("portrait-dialog-close");
  if (!trigger || !dialog || !closeButton || typeof dialog.showModal !== "function") return;
  trigger.addEventListener("click", () => {
    if (!dialog.open) dialog.showModal();
  });
  closeButton.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", event => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener("close", () => trigger.focus({ preventScroll: true }));
})();
