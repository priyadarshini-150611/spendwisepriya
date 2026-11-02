/* =========================================================
   SPENDWISE LOGOUT
   ========================================================= */

const cancelLogoutBtn = document.getElementById("cancelLogoutBtn");

const confirmLogoutBtn = document.getElementById("confirmLogoutBtn");

/* =========================================================
   CANCEL LOGOUT
   ========================================================= */

if (cancelLogoutBtn) {
  cancelLogoutBtn.addEventListener("click", function () {
    window.location.href = "dashboard.html";
  });
}

/* =========================================================
   CONFIRM LOGOUT
   ========================================================= */

if (confirmLogoutBtn) {
  confirmLogoutBtn.addEventListener("click", function () {
    /*
     * Frontend session cleanup.
     *
     * Later, Spring Boot will handle the actual
     * authentication session/token logout.
     */

    localStorage.removeItem("spendwiseUser");

    localStorage.removeItem("spendwiseSession");

    window.location.href = "index.html";
  });
}
