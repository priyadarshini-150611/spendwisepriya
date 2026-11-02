/* =========================================================
   SPENDWISE SAVINGS GOALS
   Functional JavaScript
   ========================================================= */

/* =========================================================
   SAVINGS DATA - SPRING BOOT BACKEND
   ========================================================= */

let savingsData = [];

/* =========================================================
   BACKEND API
   ========================================================= */

const API_BASE = `${window.location.protocol}//${window.location.hostname}:8080/api`;
const SAVINGS_API_BASE = `${API_BASE}/savings-goals`;
async function savingsApiRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

function normalizeSavingsGoal(goal) {
  return {
    id: goal.id,
    name: goal.name || "",
    target: Number(goal.target) || 0,
    saved: Number(goal.saved) || 0,
    deadline: goal.deadline || "",
    description: goal.description || "",
    createdAt: goal.createdAt || "",
  };
}

async function loadSavingsGoals(showError = true) {
  try {
    const goals = await savingsApiRequest(SAVINGS_API_BASE);
    savingsData = Array.isArray(goals) ? goals.map(normalizeSavingsGoal) : [];
    currentPage = 1;
    renderGoals();
  } catch (error) {
    console.error("Failed to load savings goals:", error);
    if (showError) {
      alert(
        "Could not load savings goals. Please make sure you are logged in and the backend server is running.",
      );
    }
  }
}

/* =========================================================
   SETTINGS
   ========================================================= */

const SAVINGS_PER_PAGE = 5;

let currentPage = 1;

let editingGoalId = null;

let addingSavingsGoalId = null;

/* =========================================================
   DOM ELEMENTS
   ========================================================= */

const goalList = document.getElementById("goalsList");

const emptyGoalState = document.getElementById("emptyGoalState");

const emptyGoalTitle = document.getElementById("emptyGoalTitle");

const emptyGoalText = document.getElementById("emptyGoalText");

const emptyAddGoalBtn = document.getElementById("emptyAddGoalBtn");

const searchInput = document.getElementById("goalSearch");

const statusFilter = document.getElementById("statusFilter");

const sortFilter = document.getElementById("sortFilter");

const pagination = document.getElementById("pagination");

const prevPageButton = document.getElementById("prevPage");

const nextPageButton = document.getElementById("nextPage");

const pageNumbers = document.getElementById("pageNumbers");

const addGoalButton = document.getElementById("addGoalBtn");

const exportButton = document.getElementById("exportSavingsBtn");

/* =========================================================
   MOBILE NAVIGATION ELEMENTS
   ========================================================= */

const hamburgerBtn = document.getElementById("hamburgerBtn");

const sidebar = document.querySelector(".sidebar");

const mobileNavOverlay = document.getElementById("mobileNavOverlay");

const navLinks = document.querySelectorAll(".sidebar .nav-link");

/* =========================================================
   MODAL ELEMENTS
   ========================================================= */

const goalModal = document.getElementById("goalModal");

const savingsModal = document.getElementById("addSavingsModal");

const goalForm = document.getElementById("goalForm");

const savingsForm = document.getElementById("addSavingsForm");

/* =========================================================
   FORM ELEMENTS
   ========================================================= */

const goalIdInput = document.getElementById("goalId");

const goalNameInput = document.getElementById("goalName");

const targetAmountInput = document.getElementById("targetAmount");

const currentAmountInput = document.getElementById("currentAmount");

const targetDateInput = document.getElementById("targetDate");

const goalDescriptionInput = document.getElementById("goalDescription");

const savingsGoalIdInput = document.getElementById("savingsGoalId");

const savingsAmountInput = document.getElementById("savingsAmount");

/* =========================================================
   SAVE DATA
   ========================================================= */

function saveData() {
  // Savings data is stored by the Spring Boot backend, not localStorage.
}

/* =========================================================
   FORMAT CURRENCY
   ========================================================= */

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);
}

/* =========================================================
   GET STATUS
   ========================================================= */

function getGoalStatus(goal) {
  if (Number(goal.saved) >= Number(goal.target)) {
    return "completed";
  }

  return "active";
}

/* =========================================================
   GET PROGRESS
   ========================================================= */

function getProgress(goal) {
  const target = Number(goal.target) || 0;

  const saved = Number(goal.saved) || 0;

  if (target <= 0) {
    return 0;
  }

  const percentage = (saved / target) * 100;

  return Math.min(Math.round(percentage), 100);
}

/* =========================================================
   GET REMAINING
   ========================================================= */

function getRemaining(goal) {
  const target = Number(goal.target) || 0;

  const saved = Number(goal.saved) || 0;

  return Math.max(target - saved, 0);
}

/* =========================================================
   FILTER DATA
   ========================================================= */

function getFilteredGoals() {
  let filtered = [...savingsData];

  /* ================= SEARCH ================= */

  const search = searchInput?.value.trim().toLowerCase() || "";

  if (search) {
    filtered = filtered.filter((goal) => {
      const name = String(goal.name || "").toLowerCase();

      const description = String(goal.description || "").toLowerCase();

      return name.includes(search) || description.includes(search);
    });
  }

  /* ================= STATUS ================= */

  const status = statusFilter?.value || "all";

  if (status !== "all") {
    filtered = filtered.filter((goal) => {
      return getGoalStatus(goal) === status;
    });
  }

  /* ================= SORT ================= */

  const sort = sortFilter?.value || "newest";

  if (sort === "newest") {
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else if (sort === "progress") {
    filtered.sort((a, b) => getProgress(b) - getProgress(a));
  } else if (sort === "target") {
    filtered.sort((a, b) => Number(b.target) - Number(a.target));
  } else if (sort === "name") {
    filtered.sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || "")),
    );
  }

  return filtered;
}

/* =========================================================
   RENDER GOALS
   ========================================================= */

function renderGoals() {
  const filtered = getFilteredGoals();

  /* ================= PAGINATION ================= */

  const totalPages = Math.max(Math.ceil(filtered.length / SAVINGS_PER_PAGE), 1);

  if (currentPage > totalPages) {
    currentPage = totalPages;
  }

  const start = (currentPage - 1) * SAVINGS_PER_PAGE;

  const pageGoals = filtered.slice(start, start + SAVINGS_PER_PAGE);

  /* ================= EMPTY ================= */

  if (pageGoals.length === 0) {
    if (goalList) {
      goalList.innerHTML = "";
    }

    if (emptyGoalState) {
      emptyGoalState.style.display = "block";
    }

    if (emptyGoalTitle) {
      emptyGoalTitle.textContent =
        savingsData.length === 0
          ? "No savings goals yet."
          : "No savings goals found.";
    }

    if (emptyGoalText) {
      emptyGoalText.textContent =
        savingsData.length === 0
          ? "Create your first savings goal and start working towards it."
          : "Try changing your search or filters.";
    }
  } else {
    if (emptyGoalState) {
      emptyGoalState.style.display = "none";
    }

    if (goalList) {
      goalList.innerHTML = pageGoals.map(createGoalHTML).join("");
    }
  }

  renderPagination(totalPages);

  updateSummary();

  updateInsight();
}

/* =========================================================
   CREATE GOAL HTML
   ========================================================= */

function createGoalHTML(goal) {
  const progress = getProgress(goal);

  const remaining = getRemaining(goal);

  const status = getGoalStatus(goal);

  const statusText = status === "completed" ? "COMPLETED" : "ACTIVE";

  return `

        <div
            class="goal-item"
            data-id="${goal.id}"
        >

            <div class="goal-icon">
                ☆
            </div>


            <div class="goal-info">

                <strong>
                    ${escapeHTML(goal.name)}
                </strong>


                <span>
                    ${escapeHTML(goal.description || "Savings goal")}
                </span>


                <span>
                    Deadline:
                    ${formatDate(goal.deadline)}
                </span>


                <span
                    class="goal-status ${status}"
                >
                    ${statusText}
                </span>

            </div>


            <div class="goal-progress">

                <div
                    class="goal-progress-top"
                >

                    <span>
                        ${formatCurrency(goal.saved)}
                        saved
                    </span>


                    <strong>
                        ${progress}%
                    </strong>

                </div>


                <div
                    class="goal-progress-bar"
                >

                    <span
                        style="width: ${progress}%"
                    ></span>

                </div>


                <div
                    class="goal-progress-details"
                >

                    <span>
                        Target:
                        ${formatCurrency(goal.target)}
                    </span>


                    <span>
                        ${
                          remaining > 0
                            ? `${formatCurrency(remaining)} remaining`
                            : "Goal completed"
                        }
                    </span>

                </div>

            </div>


            <div class="goal-actions">

                ${
                  status !== "completed"
                    ? `
                            <button
                                type="button"
                                class="goal-action-button primary"
                                onclick="openAddSavingsModal(${goal.id})"
                            >
                                + Save
                            </button>
                        `
                    : ""
                }


                <button
                    type="button"
                    class="goal-action-button"
                    onclick="openEditGoalModal(${goal.id})"
                >
                    Edit
                </button>


                <button
                    type="button"
                    class="goal-action-button delete"
                    onclick="deleteGoal(${goal.id})"
                >
                    Delete
                </button>

            </div>

        </div>

    `;
}

/* =========================================================
   PAGINATION
   ========================================================= */

function renderPagination(totalPages) {
  if (!pagination || !prevPageButton || !nextPageButton || !pageNumbers) {
    return;
  }

  if (totalPages <= 1) {
    pagination.style.display = "none";

    pageNumbers.innerHTML = "";

    return;
  }

  pagination.style.display = "flex";

  prevPageButton.disabled = currentPage === 1;

  nextPageButton.disabled = currentPage === totalPages;

  let html = "";

  for (let i = 1; i <= totalPages; i++) {
    html += `

            <button
                type="button"
                class="page-number ${i === currentPage ? "active" : ""}"
                data-page="${i}"
            >
                ${i}
            </button>

        `;
  }

  pageNumbers.innerHTML = html;

  pageNumbers.querySelectorAll(".page-number").forEach((button) => {
    button.addEventListener("click", () => {
      changePage(Number(button.dataset.page));
    });
  });
}

/* =========================================================
   CHANGE PAGE
   ========================================================= */

function changePage(page) {
  const filtered = getFilteredGoals();

  const totalPages = Math.max(Math.ceil(filtered.length / SAVINGS_PER_PAGE), 1);

  if (page < 1 || page > totalPages) {
    return;
  }

  currentPage = page;

  renderGoals();
}

/* =========================================================
   UPDATE SUMMARY
   ========================================================= */

function updateSummary() {
  const totalTarget = savingsData.reduce(
    (sum, goal) => sum + (Number(goal.target) || 0),
    0,
  );

  const totalSaved = savingsData.reduce(
    (sum, goal) => sum + (Number(goal.saved) || 0),
    0,
  );

  const totalRemaining = Math.max(totalTarget - totalSaved, 0);

  const activeGoals = savingsData.filter(
    (goal) => getGoalStatus(goal) === "active",
  ).length;

  setText("totalTarget", formatCurrency(totalTarget));

  setText("totalSaved", formatCurrency(totalSaved));

  setText("totalRemaining", formatCurrency(totalRemaining));

  setText("activeGoals", activeGoals);
}

/* =========================================================
   SMART SAVINGS INSIGHT
   ========================================================= */

function updateInsight() {
  const title = document.getElementById("savingsInsightTitle");

  const text = document.getElementById("savingsInsightText");

  if (!title || !text) {
    return;
  }

  if (savingsData.length === 0) {
    title.textContent = "Start your first savings goal";

    text.textContent =
      "Create a goal and start building your savings step by step.";

    return;
  }

  const completedGoals = savingsData.filter(
    (goal) => getGoalStatus(goal) === "completed",
  );

  if (completedGoals.length === savingsData.length) {
    title.textContent = "Amazing! All your savings goals are complete.";

    text.textContent =
      "You've reached every target. Consider creating a new financial goal.";

    return;
  }

  const highestProgressGoal = [...savingsData].sort(
    (a, b) => getProgress(b) - getProgress(a),
  )[0];

  if (!highestProgressGoal) {
    return;
  }

  const progress = getProgress(highestProgressGoal);

  const remaining = getRemaining(highestProgressGoal);

  title.textContent = `${highestProgressGoal.name} is ${progress}% complete`;

  if (progress >= 75) {
    text.textContent = `You're close to your goal. Only ${formatCurrency(
      remaining,
    )} remaining. Keep going!`;
  } else if (progress >= 50) {
    text.textContent = `You're more than halfway there. ${formatCurrency(
      remaining,
    )} is left to reach your target.`;
  } else {
    text.textContent = `You've saved ${formatCurrency(
      highestProgressGoal.saved,
    )} toward this goal. Keep contributing regularly to build momentum.`;
  }
}

/* =========================================================
   OPEN ADD GOAL MODAL
   ========================================================= */

function openAddGoalModal() {
  editingGoalId = null;

  if (goalForm) {
    goalForm.reset();
  }

  if (goalIdInput) {
    goalIdInput.value = "";
  }

  if (currentAmountInput) {
    currentAmountInput.value = "0";
  }

  const modalTitle = document.getElementById("modalTitle");

  const modalLabel = document.getElementById("goalModalLabel");

  if (modalTitle) {
    modalTitle.textContent = "Add Savings Goal";
  }

  if (modalLabel) {
    modalLabel.textContent = "NEW SAVINGS GOAL";
  }

  showModal(goalModal);
}

/* =========================================================
   OPEN EDIT GOAL MODAL
   ========================================================= */

function openEditGoalModal(id) {
  const goal = savingsData.find((item) => Number(item.id) === Number(id));

  if (!goal) {
    return;
  }

  editingGoalId = Number(id);

  setValue("goalId", goal.id);

  setValue("goalName", goal.name);

  setValue("targetAmount", goal.target);

  setValue("currentAmount", goal.saved);

  setValue("targetDate", goal.deadline);

  setValue("goalDescription", goal.description || "");

  const modalTitle = document.getElementById("modalTitle");

  const modalLabel = document.getElementById("goalModalLabel");

  if (modalTitle) {
    modalTitle.textContent = "Edit Savings Goal";
  }

  if (modalLabel) {
    modalLabel.textContent = "EDIT SAVINGS GOAL";
  }

  showModal(goalModal);
}

/* =========================================================
   CLOSE GOAL MODAL
   ========================================================= */

function closeGoalModal() {
  hideModal(goalModal);

  editingGoalId = null;
}

/* =========================================================
   SAVE GOAL
   ========================================================= */

async function handleGoalSubmit(event) {
  event.preventDefault();

  const name = getValue("goalName").trim();
  const target = Number(getValue("targetAmount"));
  const currentAmount = Number(getValue("currentAmount"));
  const deadline = getValue("targetDate");
  const description = getValue("goalDescription").trim();

  if (!name) {
    alert("Please enter a goal name.");
    return;
  }
  if (!Number.isFinite(target) || target <= 0) {
    alert("Please enter a valid target amount.");
    return;
  }
  if (!Number.isFinite(currentAmount) || currentAmount < 0) {
    alert("Please enter a valid current savings amount.");
    return;
  }
  if (currentAmount > target) {
    alert("Current savings cannot be greater than the target amount.");
    return;
  }
  if (!deadline) {
    alert("Please select a deadline.");
    return;
  }

  const payload = { name, target, saved: currentAmount, deadline, description };
  const isEditing = editingGoalId !== null;
  const url = isEditing
    ? `${SAVINGS_API_BASE}/${editingGoalId}`
    : SAVINGS_API_BASE;

  try {
    const savedGoal = await savingsApiRequest(url, {
      method: isEditing ? "PUT" : "POST",
      body: JSON.stringify(payload),
    });

    const normalizedGoal = normalizeSavingsGoal(savedGoal);
    if (isEditing) {
      savingsData = savingsData.map((goal) =>
        Number(goal.id) === Number(editingGoalId) ? normalizedGoal : goal,
      );
    } else {
      savingsData.unshift(normalizedGoal);
    }

    closeGoalModal();
    currentPage = 1;
    renderGoals();
  } catch (error) {
    console.error("Failed to save savings goal:", error);
    alert(`Could not save the goal. ${error.message}`);
  }
}

/* =========================================================
   DELETE GOAL
   ========================================================= */

async function deleteGoal(id) {
  const goal = savingsData.find((item) => Number(item.id) === Number(id));
  if (!goal) return;

  const confirmed = confirm(
    `Delete "${goal.name}"? This action cannot be undone.`,
  );
  if (!confirmed) return;

  try {
    await savingsApiRequest(`${SAVINGS_API_BASE}/${id}`, { method: "DELETE" });
    savingsData = savingsData.filter((item) => Number(item.id) !== Number(id));

    const filtered = getFilteredGoals();
    const totalPages = Math.max(
      Math.ceil(filtered.length / SAVINGS_PER_PAGE),
      1,
    );
    if (currentPage > totalPages) currentPage = totalPages;
    renderGoals();
  } catch (error) {
    console.error("Failed to delete savings goal:", error);
    alert(
      `Could not delete this goal. It may have contribution records. ${error.message}`,
    );
  }
}

/* =========================================================
   OPEN ADD SAVINGS MODAL
   ========================================================= */

function openAddSavingsModal(id) {
  const goal = savingsData.find((item) => Number(item.id) === Number(id));

  if (!goal) {
    return;
  }

  addingSavingsGoalId = Number(id);

  setValue("savingsGoalId", goal.id);

  const selectedGoal = document.getElementById("selectedGoalName");

  if (selectedGoal) {
    selectedGoal.textContent = goal.name;
  }

  if (savingsForm) {
    savingsForm.reset();
  }

  setValue("savingsGoalId", goal.id);

  showModal(savingsModal);
}

/* =========================================================
   CLOSE SAVINGS MODAL
   ========================================================= */

function closeSavingsModal() {
  hideModal(savingsModal);

  addingSavingsGoalId = null;
}

/* =========================================================
   ADD SAVINGS
   ========================================================= */

async function handleSavingsSubmit(event) {
  event.preventDefault();

  if (addingSavingsGoalId === null) return;

  const amount = Number(getValue("savingsAmount"));
  if (!Number.isFinite(amount) || amount <= 0) {
    alert("Please enter a valid savings amount.");
    return;
  }

  const goal = savingsData.find(
    (item) => Number(item.id) === Number(addingSavingsGoalId),
  );
  if (!goal) return;

  const remaining = getRemaining(goal);
  if (remaining <= 0) {
    alert("This goal is already completed.");
    closeSavingsModal();
    return;
  }
  if (amount > remaining) {
    alert(
      `This amount exceeds the remaining goal amount of ${formatCurrency(remaining)}.`,
    );
    return;
  }

  const goalId = addingSavingsGoalId;
  try {
    await savingsApiRequest(`${SAVINGS_API_BASE}/${goalId}/contributions`, {
      method: "POST",
      body: JSON.stringify({
        amount,
        contributionDate: new Date().toISOString().slice(0, 10),
        note: "Contribution from Savings Goals page",
      }),
    });

    closeSavingsModal();
    await loadSavingsGoals(false);
  } catch (error) {
    console.error("Failed to add savings contribution:", error);
    alert(`Could not add the contribution. ${error.message}`);
  }
}

/* =========================================================
   EXPORT CSV
   ========================================================= */

function exportGoalsCSV() {
  if (savingsData.length === 0) {
    alert("There are no savings goals to export.");

    return;
  }

  const headers = [
    "Goal",

    "Target Amount",

    "Saved Amount",

    "Remaining Amount",

    "Progress",

    "Status",

    "Deadline",

    "Description",
  ];

  const rows = savingsData.map((goal) => {
    return [
      goal.name,

      goal.target,

      goal.saved,

      getRemaining(goal),

      getProgress(goal) + "%",

      getGoalStatus(goal),

      goal.deadline,

      goal.description,
    ];
  });

  let csv = headers.join(",") + "\n";

  rows.forEach((row) => {
    csv +=
      row
        .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
        .join(",") + "\n";
  });

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;

  link.download = "spendwise-savings-goals.csv";

  document.body.appendChild(link);

  link.click();

  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/* =========================================================
   SEARCH
   ========================================================= */

function handleSearch() {
  currentPage = 1;

  renderGoals();
}

/* =========================================================
   FILTER
   ========================================================= */

function handleFilter() {
  currentPage = 1;

  renderGoals();
}

/* =========================================================
   MODAL HELPERS
   ========================================================= */

function showModal(modal) {
  if (!modal) {
    return;
  }

  modal.style.display = "grid";

  document.body.style.overflow = "hidden";
}

function hideModal(modal) {
  if (!modal) {
    return;
  }

  modal.style.display = "none";

  /*
   * Keep body locked if the
   * mobile navigation is open.
   */

  if (!document.body.classList.contains("menu-open")) {
    document.body.style.overflow = "";
  }
}

/* =========================================================
   MOBILE MENU
   ========================================================= */

function openMobileMenu() {
  if (!hamburgerBtn || !sidebar || !mobileNavOverlay) {
    return;
  }

  sidebar.classList.add("mobile-open");

  mobileNavOverlay.classList.add("active");

  document.body.classList.add("menu-open");

  hamburgerBtn.setAttribute("aria-expanded", "true");

  hamburgerBtn.setAttribute("aria-label", "Close navigation");

  hamburgerBtn.textContent = "✕";
}

function closeMobileMenu() {
  if (!hamburgerBtn || !sidebar || !mobileNavOverlay) {
    return;
  }

  sidebar.classList.remove("mobile-open");

  mobileNavOverlay.classList.remove("active");

  document.body.classList.remove("menu-open");

  if (!goalModal || goalModal.style.display === "none") {
    if (!savingsModal || savingsModal.style.display === "none") {
      document.body.style.overflow = "";
    }
  }

  hamburgerBtn.setAttribute("aria-expanded", "false");

  hamburgerBtn.setAttribute("aria-label", "Open navigation");

  hamburgerBtn.textContent = "☰";
}

/* =========================================================
   CLICK OUTSIDE MODAL
   ========================================================= */

document.addEventListener("click", function (event) {
  if (event.target === goalModal) {
    closeGoalModal();
  }

  if (event.target === savingsModal) {
    closeSavingsModal();
  }
});

/* =========================================================
   ESC KEY
   ========================================================= */

document.addEventListener("keydown", function (event) {
  if (event.key !== "Escape") {
    return;
  }

  if (sidebar && sidebar.classList.contains("mobile-open")) {
    closeMobileMenu();

    return;
  }

  if (goalModal && goalModal.style.display !== "none") {
    closeGoalModal();
  }

  if (savingsModal && savingsModal.style.display !== "none") {
    closeSavingsModal();
  }
});

/* =========================================================
   HELPER FUNCTIONS
   ========================================================= */

function setText(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = value;
  }
}

function setValue(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.value = value;
  }
}

function getValue(id) {
  const element = document.getElementById(id);

  return element ? element.value : "";
}

/* =========================================================
   DATE FORMAT
   ========================================================= */

function formatDate(dateString) {
  if (!dateString) {
    return "No deadline";
  }

  const date = new Date(dateString + "T00:00:00");

  if (Number.isNaN(date.getTime())) {
    return "No deadline";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/* =========================================================
   HTML ESCAPE
   ========================================================= */

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* =========================================================
   EVENT LISTENERS
   ========================================================= */

/* Add Goal */

if (addGoalButton) {
  addGoalButton.addEventListener("click", openAddGoalModal);
}

/* Empty State Add Goal */

if (emptyAddGoalBtn) {
  emptyAddGoalBtn.addEventListener("click", openAddGoalModal);
}

/* Goal Form */

if (goalForm) {
  goalForm.addEventListener("submit", handleGoalSubmit);
}

/* Savings Form */

if (savingsForm) {
  savingsForm.addEventListener("submit", handleSavingsSubmit);
}

/* Search */

if (searchInput) {
  searchInput.addEventListener("input", handleSearch);
}

/* Status Filter */

if (statusFilter) {
  statusFilter.addEventListener("change", handleFilter);
}

/* Sort Filter */

if (sortFilter) {
  sortFilter.addEventListener("change", handleFilter);
}

/* Export */

if (exportButton) {
  exportButton.addEventListener("click", exportGoalsCSV);
}

/* Previous */

if (prevPageButton) {
  prevPageButton.addEventListener("click", () => {
    changePage(currentPage - 1);
  });
}

/* Next */

if (nextPageButton) {
  nextPageButton.addEventListener("click", () => {
    changePage(currentPage + 1);
  });
}

/* =========================================================
   MODAL BUTTONS
   ========================================================= */

const closeGoalModalButton = document.getElementById("closeGoalModal");

const cancelGoalButton = document.getElementById("cancelGoalBtn");

const closeSavingsModalButton = document.getElementById("closeSavingsModal");

const cancelSavingsButton = document.getElementById("cancelSavingsBtn");

if (closeGoalModalButton) {
  closeGoalModalButton.addEventListener("click", closeGoalModal);
}

if (cancelGoalButton) {
  cancelGoalButton.addEventListener("click", closeGoalModal);
}

if (closeSavingsModalButton) {
  closeSavingsModalButton.addEventListener("click", closeSavingsModal);
}

if (cancelSavingsButton) {
  cancelSavingsButton.addEventListener("click", closeSavingsModal);
}

/* =========================================================
   HAMBURGER MENU
   ========================================================= */

if (hamburgerBtn && sidebar && mobileNavOverlay) {
  hamburgerBtn.addEventListener("click", () => {
    if (sidebar.classList.contains("mobile-open")) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  });

  mobileNavOverlay.addEventListener("click", closeMobileMenu);

  navLinks.forEach((link) => {
    link.addEventListener("click", closeMobileMenu);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 600) {
      closeMobileMenu();
    }
  });
}

/* =========================================================
   INITIAL RENDER
   ========================================================= */

loadSavingsGoals();
