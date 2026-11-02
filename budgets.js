"use strict";

/* =========================================================
   SPENDWISE — BUDGETS
   Connected to Spring Boot REST API + MySQL
   ========================================================= */

const API_BASE = `${window.location.protocol}//${window.location.hostname}:8080/api`;

const recordsPerPage = 5;

let budgetData = [];
let currentPage = 1;
let editingBudgetId = null;
let isSavingBudget = false;

/* =========================================================
   DOM ELEMENTS
   ========================================================= */

const totalBudgetElement = document.getElementById("totalBudget");
const totalSpentElement = document.getElementById("totalSpent");
const remainingBudgetElement = document.getElementById("remainingBudget");
const activeBudgetsElement = document.getElementById("activeBudgets");

const searchInput = document.getElementById("budgetSearch");
const categoryFilter = document.getElementById("categoryFilter");
const monthFilter = document.getElementById("monthFilter");

const budgetTableBody = document.getElementById("budgetTableBody");
const emptyBudgetState = document.getElementById("emptyBudgetState");

const previousPageButton = document.getElementById("prevPage");
const nextPageButton = document.getElementById("nextPage");
const pageNumbersContainer = document.getElementById("pageNumbers");

const exportBudgetButton = document.getElementById("exportBudgetBtn");

const budgetModal = document.getElementById("budgetModal");
const budgetForm = document.getElementById("budgetForm");
const modalTitle = document.getElementById("modalTitle");

const closeBudgetModalButton = document.getElementById("closeBudgetModal");
const cancelBudgetButton = document.getElementById("cancelBudgetBtn");

const addBudgetButton = document.getElementById("addBudgetBtn");
const emptyAddBudgetButton = document.getElementById("emptyAddBudgetBtn");

const budgetIdInput = document.getElementById("budgetId");
const budgetCategoryInput = document.getElementById("budgetCategory");
const budgetAmountInput = document.getElementById("budgetAmount");
const budgetMonthInput = document.getElementById("budgetMonth");
const budgetDescriptionInput = document.getElementById("budgetDescription");

const budgetInsightTitle = document.getElementById("budgetInsightTitle");
const budgetInsightText = document.getElementById("budgetInsightText");

const hamburgerButton = document.getElementById("hamburgerBtn");
const mobileNavOverlay = document.getElementById("mobileNavOverlay");
const sidebar = document.querySelector(".sidebar");

/* =========================================================
   CURRENCY + DATE HELPERS
   ========================================================= */

function formatCurrency(value) {
  const amount = Number(value) || 0;

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(amount);
}

function getCurrentMonth() {
  const now = new Date();

  return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0")].join(
    "-",
  );
}

function getPreviousMonth() {
  const previous = new Date();

  previous.setDate(1);
  previous.setMonth(previous.getMonth() - 1);

  return [
    previous.getFullYear(),
    String(previous.getMonth() + 1).padStart(2, "0"),
  ].join("-");
}

function formatMonth(monthValue) {
  if (!monthValue) {
    return "—";
  }

  const month = String(monthValue).slice(0, 7);
  const date = new Date(`${month}-01T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return month;
  }

  return date.toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });
}

function toApiMonth(monthValue) {
  if (!monthValue) {
    return null;
  }

  // HTML month input: 2026-10
  // Backend LocalDate: 2026-10-01
  return `${monthValue}-01`;
}

function getMonthFromDate(dateValue) {
  return dateValue ? String(dateValue).slice(0, 7) : "";
}

/* =========================================================
   CATEGORY ICONS
   ========================================================= */

function getCategoryIcon(category) {
  const icons = {
    Food: "🍽",
    Transport: "🚗",
    Shopping: "🛍",
    Entertainment: "🎬",
    Bills: "🧾",
    Healthcare: "💊",
    Education: "📚",
    Other: "◈",
  };

  return icons[category] || "◈";
}

/* =========================================================
   HTML SAFETY
   ========================================================= */

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => {
    const replacements = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return replacements[character];
  });
}

/* =========================================================
   API HELPERS
   ========================================================= */

async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,

    credentials: "include",

    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;

    try {
      const errorData = await response.json();

      message =
        errorData.detail ||
        errorData.message ||
        errorData.title ||
        errorData.error ||
        message;
    } catch {
      try {
        const responseText = await response.text();

        if (responseText) {
          message = responseText;
        }
      } catch {
        // Keep the default message.
      }
    }

    if (response.status === 401) {
      throw new Error("SESSION_EXPIRED");
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  const responseText = await response.text();

  return responseText ? JSON.parse(responseText) : null;
}

function handleApiError(error, action = "complete this action") {
  console.error(`Unable to ${action}:`, error);

  if (error.message === "SESSION_EXPIRED") {
    alert("Your session has expired. Please log in again.");
    window.location.href = "login.html";
    return;
  }

  alert(error.message || `Unable to ${action}. Please try again.`);
}

/* =========================================================
   LOAD BUDGETS + REAL EXPENSE TOTALS
   ========================================================= */

async function loadBudgets() {
  if (budgetTableBody) {
    budgetTableBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center;padding:30px;">
                    Loading your budgets...
                </td>
            </tr>
        `;
  }

  try {
    // Load the logged-in user's budgets.
    const apiBudgets = await apiRequest("/budgets");

    if (!Array.isArray(apiBudgets)) {
      throw new Error("The server returned an invalid budgets response.");
    }

    /*
     * Find each distinct budget month.
     * Fetch its monthly summary so spending values come from
     * the user's actual Expenses records.
     */
    const months = [
      ...new Set(
        apiBudgets
          .map((budget) => getMonthFromDate(budget.budgetMonth))
          .filter(Boolean),
      ),
    ];

    const monthlySummaries = await Promise.all(
      months.map(async (month) => {
        const summary = await apiRequest(
          `/budgets/summary?month=${encodeURIComponent(toApiMonth(month))}`,
        );

        return [month, summary];
      }),
    );

    const summariesByMonth = new Map(monthlySummaries);

    budgetData = apiBudgets.map((apiBudget) => {
      const month = getMonthFromDate(apiBudget.budgetMonth);
      const summary = summariesByMonth.get(month);

      const categorySummary = summary?.categories?.find(
        (item) => item.category === apiBudget.category,
      );

      return {
        id: apiBudget.budgetId,
        category: apiBudget.category,
        amount: Number(apiBudget.budgetAmount) || 0,
        spent: Number(categorySummary?.spentAmount) || 0,
        month,
        description: apiBudget.description || "",
      };
    });

    currentPage = 1;
    renderBudgets();
  } catch (error) {
    budgetData = [];
    renderBudgets();

    handleApiError(error, "load your budgets");
  }
}

/* =========================================================
   FILTERS
   ========================================================= */

function getFilteredBudgets() {
  const searchTerm = (searchInput?.value || "").trim().toLowerCase();
  const selectedCategory = categoryFilter?.value || "all";
  const selectedMonth = monthFilter?.value || "all";

  return budgetData.filter((budget) => {
    const matchesSearch =
      budget.category.toLowerCase().includes(searchTerm) ||
      budget.description.toLowerCase().includes(searchTerm);

    const matchesCategory =
      selectedCategory === "all" || budget.category === selectedCategory;

    let matchesMonth = true;

    if (selectedMonth === "current") {
      matchesMonth = budget.month === getCurrentMonth();
    } else if (selectedMonth === "previous") {
      matchesMonth = budget.month === getPreviousMonth();
    }

    return matchesSearch && matchesCategory && matchesMonth;
  });
}

/* =========================================================
   SUMMARY CARDS
   ========================================================= */

function updateSummary(data) {
  const totalBudget = data.reduce((total, budget) => total + budget.amount, 0);

  const totalSpent = data.reduce((total, budget) => total + budget.spent, 0);

  const remainingBudget = totalBudget - totalSpent;

  if (totalBudgetElement) {
    totalBudgetElement.textContent = formatCurrency(totalBudget);
  }

  if (totalSpentElement) {
    totalSpentElement.textContent = formatCurrency(totalSpent);
  }

  if (remainingBudgetElement) {
    remainingBudgetElement.textContent = formatCurrency(remainingBudget);
  }

  if (activeBudgetsElement) {
    activeBudgetsElement.textContent = String(data.length);
  }
}

/* =========================================================
   BUDGET STATUS
   ========================================================= */

function getBudgetPercentage(budget) {
  if (budget.amount <= 0) {
    return 0;
  }

  return (budget.spent / budget.amount) * 100;
}

function getBudgetStatus(budget) {
  const percentage = getBudgetPercentage(budget);

  if (percentage > 100) {
    return {
      label: "Exceeded",
      className: "exceeded",
    };
  }

  if (percentage >= 80) {
    return {
      label: "Warning",
      className: "warning",
    };
  }

  return {
    label: "Healthy",
    className: "healthy",
  };
}

/* =========================================================
   PAGINATION
   ========================================================= */

function updatePagination(totalPages) {
  if (previousPageButton) {
    previousPageButton.disabled = currentPage <= 1;
  }

  if (nextPageButton) {
    nextPageButton.disabled = totalPages === 0 || currentPage >= totalPages;
  }

  if (!pageNumbersContainer) {
    return;
  }

  pageNumbersContainer.innerHTML = "";

  for (let page = 1; page <= totalPages; page++) {
    const button = document.createElement("button");

    button.type = "button";
    button.className = `page-number${page === currentPage ? " active" : ""}`;

    button.textContent = String(page);
    button.setAttribute("aria-label", `Go to page ${page}`);

    if (page === currentPage) {
      button.setAttribute("aria-current", "page");
    }

    button.addEventListener("click", () => {
      currentPage = page;
      renderBudgets();
    });

    pageNumbersContainer.appendChild(button);
  }
}

/* =========================================================
   RENDER BUDGET TABLE
   ========================================================= */

function renderBudgets() {
  const filteredBudgets = getFilteredBudgets();

  updateSummary(filteredBudgets);
  updateInsight(filteredBudgets);

  const totalPages = Math.ceil(filteredBudgets.length / recordsPerPage);

  if (currentPage > totalPages) {
    currentPage = Math.max(1, totalPages);
  }

  const startIndex = (currentPage - 1) * recordsPerPage;

  const visibleBudgets = filteredBudgets.slice(
    startIndex,
    startIndex + recordsPerPage,
  );

  if (budgetTableBody) {
    budgetTableBody.innerHTML = visibleBudgets
      .map((budget) => {
        const percentage = getBudgetPercentage(budget);
        const displayedPercentage = percentage.toFixed(1);
        const progressWidth = Math.min(percentage, 100);
        const remaining = budget.amount - budget.spent;
        const status = getBudgetStatus(budget);

        return `
                <tr>
                    <td>
                        <div class="budget-category">
                            <span class="budget-category-icon">
                                ${getCategoryIcon(budget.category)}
                            </span>

                            <span>${escapeHTML(budget.category)}</span>
                        </div>
                    </td>

                    <td>
                        <span class="budget-period">
                            ${escapeHTML(formatMonth(budget.month))}
                        </span>
                    </td>

                    <td>
                        <span class="budget-limit">
                            ${formatCurrency(budget.amount)}
                        </span>
                    </td>

                    <td>
                        <span class="budget-spent">
                            ${formatCurrency(budget.spent)}
                        </span>
                    </td>

                    <td>
                        <span class="budget-remaining">
                            ${formatCurrency(remaining)}
                        </span>
                    </td>

                    <td>
                        <div class="progress-wrapper">
                            <div
                                class="progress"
                                role="progressbar"
                                aria-label="${escapeHTML(budget.category)} budget usage"
                                aria-valuemin="0"
                                aria-valuemax="100"
                                aria-valuenow="${Math.min(percentage, 100).toFixed(1)}"
                            >
                                <span style="width:${progressWidth}%"></span>
                            </div>

                            <span class="progress-percent">
                                ${displayedPercentage}% used
                            </span>
                        </div>
                    </td>

                    <td>
                        <span class="status ${status.className}">
                            ${status.label}
                        </span>
                    </td>

                    <td>
                        <div class="actions">
                            <button
                                type="button"
                                class="action-btn"
                                data-action="edit"
                                data-id="${budget.id}"
                                aria-label="Edit ${escapeHTML(budget.category)} budget"
                                title="Edit budget"
                            >✎</button>

                            <button
                                type="button"
                                class="action-btn delete"
                                data-action="delete"
                                data-id="${budget.id}"
                                aria-label="Delete ${escapeHTML(budget.category)} budget"
                                title="Delete budget"
                            >⌫</button>
                        </div>
                    </td>
                </tr>
            `;
      })
      .join("");
  }

  const hasBudgets = filteredBudgets.length > 0;

  if (emptyBudgetState) {
    emptyBudgetState.style.display = hasBudgets ? "none" : "block";
  }

  const tableWrapper = document.querySelector(".table-wrapper");

  if (tableWrapper) {
    tableWrapper.style.display = hasBudgets ? "block" : "none";
  }

  updatePagination(totalPages);
}

/* =========================================================
   SMART BUDGET INSIGHT
   ========================================================= */

function updateInsight(data) {
  if (!budgetInsightTitle || !budgetInsightText) {
    return;
  }

  if (data.length === 0) {
    budgetInsightTitle.textContent = "Start planning your budget.";
    budgetInsightText.textContent =
      "Add a budget to track your spending and see your financial progress.";
    return;
  }

  const exceededBudgets = data.filter((budget) => budget.spent > budget.amount);

  if (exceededBudgets.length > 0) {
    const highestExceeded = exceededBudgets.reduce((highest, current) =>
      getBudgetPercentage(current) > getBudgetPercentage(highest)
        ? current
        : highest,
    );

    budgetInsightTitle.textContent = `${highestExceeded.category} is over budget.`;

    budgetInsightText.textContent =
      `You've spent ${formatCurrency(highestExceeded.spent)} of your ` +
      `${formatCurrency(highestExceeded.amount)} budget for ` +
      `${formatMonth(highestExceeded.month)}.`;
    return;
  }

  const highestUsage = data.reduce((highest, current) =>
    getBudgetPercentage(current) > getBudgetPercentage(highest)
      ? current
      : highest,
  );

  const percentage = getBudgetPercentage(highestUsage);

  if (percentage >= 80) {
    budgetInsightTitle.textContent = `${highestUsage.category} is approaching its limit.`;

    budgetInsightText.textContent =
      `You've used ${percentage.toFixed(1)}% of this budget. ` +
      `${formatCurrency(Math.max(0, highestUsage.amount - highestUsage.spent))} remains.`;
    return;
  }

  budgetInsightTitle.textContent = "You're keeping your spending on track.";

  budgetInsightText.textContent =
    `Your highest budget usage is ${highestUsage.category} at ` +
    `${percentage.toFixed(1)}%. Keep monitoring your spending to stay on target.`;
}

/* =========================================================
   OPEN + CLOSE MODAL
   ========================================================= */

function openBudgetModal(budget = null) {
  if (!budgetModal || !budgetForm) {
    return;
  }

  budgetForm.reset();

  editingBudgetId = budget ? budget.id : null;

  if (budgetIdInput) {
    budgetIdInput.value = budget ? String(budget.id) : "";
  }

  if (modalTitle) {
    modalTitle.textContent = budget ? "Edit Budget" : "Add New Budget";
  }

  if (budgetCategoryInput) {
    budgetCategoryInput.value = budget ? budget.category : "";
  }

  if (budgetAmountInput) {
    budgetAmountInput.value = budget ? String(budget.amount) : "";
  }

  if (budgetMonthInput) {
    budgetMonthInput.value = budget ? budget.month : getCurrentMonth();
  }

  if (budgetDescriptionInput) {
    budgetDescriptionInput.value = budget ? budget.description : "";
  }

  budgetModal.style.display = "grid";
  budgetModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  budgetCategoryInput?.focus();
}

function closeBudgetModal() {
  if (!budgetModal) {
    return;
  }

  budgetModal.style.display = "none";
  budgetModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";

  editingBudgetId = null;

  if (budgetForm) {
    budgetForm.reset();
  }
}

/* =========================================================
   CREATE + UPDATE BUDGET
   ========================================================= */

async function saveBudget(event) {
  event.preventDefault();

  if (isSavingBudget) {
    return;
  }

  const category = budgetCategoryInput?.value.trim();
  const amount = Number(budgetAmountInput?.value);
  const month = budgetMonthInput?.value;
  const description = budgetDescriptionInput?.value.trim() || "";

  if (!category) {
    alert("Please select a budget category.");
    return;
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    alert("Please enter a budget amount greater than zero.");
    return;
  }

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    alert("Please select a valid budget month.");
    return;
  }

  const requestBody = {
    category,
    budgetAmount: amount,
    budgetMonth: toApiMonth(month),
    description,
  };

  isSavingBudget = true;

  const saveButton = budgetForm.querySelector(
    ".save-budget-btn, button[type='submit']",
  );

  if (saveButton) {
    saveButton.disabled = true;
    saveButton.textContent = "Saving...";
  }

  try {
    if (editingBudgetId !== null) {
      await apiRequest(`/budgets/${editingBudgetId}`, {
        method: "PUT",
        body: JSON.stringify(requestBody),
      });
    } else {
      await apiRequest("/budgets", {
        method: "POST",
        body: JSON.stringify(requestBody),
      });
    }

    closeBudgetModal();

    // Reload from MySQL so all displayed values remain authoritative.
    await loadBudgets();
  } catch (error) {
    handleApiError(
      error,
      editingBudgetId !== null ? "update the budget" : "create the budget",
    );
  } finally {
    isSavingBudget = false;

    if (saveButton) {
      saveButton.disabled = false;
      saveButton.textContent = "Save Budget";
    }
  }
}

/* =========================================================
   EDIT BUDGET
   ========================================================= */

function editBudget(budgetId) {
  const budget = budgetData.find((item) => item.id === Number(budgetId));

  if (!budget) {
    alert("This budget could not be found. Please refresh the page.");
    return;
  }

  openBudgetModal(budget);
}

/* =========================================================
   DELETE BUDGET
   ========================================================= */

async function deleteBudget(budgetId) {
  const budget = budgetData.find((item) => item.id === Number(budgetId));

  if (!budget) {
    alert("This budget could not be found. Please refresh the page.");
    return;
  }

  const confirmed = window.confirm(
    `Delete the ${budget.category} budget for ${formatMonth(budget.month)}?\n\n` +
      "This will delete the budget, but it will not delete any expense records.",
  );

  if (!confirmed) {
    return;
  }

  try {
    await apiRequest(`/budgets/${budget.id}`, {
      method: "DELETE",
    });

    await loadBudgets();
  } catch (error) {
    handleApiError(error, "delete the budget");
  }
}

/* =========================================================
   TABLE ACTIONS
   ========================================================= */

if (budgetTableBody) {
  budgetTableBody.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");

    if (!button) {
      return;
    }

    const budgetId = Number(button.dataset.id);

    if (!Number.isInteger(budgetId)) {
      return;
    }

    if (button.dataset.action === "edit") {
      editBudget(budgetId);
    } else if (button.dataset.action === "delete") {
      deleteBudget(budgetId);
    }
  });
}

/* =========================================================
   CSV EXPORT
   ========================================================= */

function exportBudgetsToCSV() {
  const data = getFilteredBudgets();

  if (data.length === 0) {
    alert("There are no budgets to export.");
    return;
  }

  const headers = [
    "Category",
    "Month",
    "Budget Amount",
    "Spent Amount",
    "Remaining Amount",
    "Percentage Used",
    "Status",
    "Description",
  ];

  const rows = data.map((budget) => [
    budget.category,
    budget.month,
    budget.amount.toFixed(2),
    budget.spent.toFixed(2),
    (budget.amount - budget.spent).toFixed(2),
    `${getBudgetPercentage(budget).toFixed(2)}%`,
    getBudgetStatus(budget).label,
    budget.description,
  ]);

  const escapeCSV = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

  const csvContent = [headers, ...rows]
    .map((row) => row.map(escapeCSV).join(","))
    .join("\r\n");

  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `spendwise-budgets-${getCurrentMonth()}.csv`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

/* =========================================================
   MOBILE NAVIGATION
   ========================================================= */

function setMobileNavigation(open) {
  if (!sidebar || !hamburgerButton || !mobileNavOverlay) {
    return;
  }

  sidebar.classList.toggle("mobile-open", open);
  mobileNavOverlay.classList.toggle("active", open);
  document.body.classList.toggle("menu-open", open);

  hamburgerButton.textContent = open ? "✕" : "☰";
  hamburgerButton.setAttribute("aria-expanded", String(open));
  hamburgerButton.setAttribute(
    "aria-label",
    open ? "Close navigation" : "Open navigation",
  );
}

if (hamburgerButton) {
  hamburgerButton.addEventListener("click", () => {
    const isOpen = sidebar?.classList.contains("mobile-open");
    setMobileNavigation(!isOpen);
  });
}

if (mobileNavOverlay) {
  mobileNavOverlay.addEventListener("click", () => {
    setMobileNavigation(false);
  });
}

if (sidebar) {
  sidebar.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      setMobileNavigation(false);
    });
  });
}

window.addEventListener("resize", () => {
  if (window.innerWidth > 600) {
    setMobileNavigation(false);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeBudgetModal();
    setMobileNavigation(false);
  }
});

/* =========================================================
   EVENT LISTENERS
   ========================================================= */

if (searchInput) {
  searchInput.addEventListener("input", () => {
    currentPage = 1;
    renderBudgets();
  });
}

if (categoryFilter) {
  categoryFilter.addEventListener("change", () => {
    currentPage = 1;
    renderBudgets();
  });
}

if (monthFilter) {
  monthFilter.addEventListener("change", () => {
    currentPage = 1;
    renderBudgets();
  });
}

if (previousPageButton) {
  previousPageButton.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderBudgets();
    }
  });
}

if (nextPageButton) {
  nextPageButton.addEventListener("click", () => {
    const totalPages = Math.ceil(getFilteredBudgets().length / recordsPerPage);

    if (currentPage < totalPages) {
      currentPage++;
      renderBudgets();
    }
  });
}

if (exportBudgetButton) {
  exportBudgetButton.addEventListener("click", exportBudgetsToCSV);
}

if (addBudgetButton) {
  addBudgetButton.addEventListener("click", () => openBudgetModal());
}

if (emptyAddBudgetButton) {
  emptyAddBudgetButton.addEventListener("click", () => openBudgetModal());
}

if (closeBudgetModalButton) {
  closeBudgetModalButton.addEventListener("click", closeBudgetModal);
}

if (cancelBudgetButton) {
  cancelBudgetButton.addEventListener("click", closeBudgetModal);
}

if (budgetForm) {
  budgetForm.addEventListener("submit", saveBudget);
}

if (budgetModal) {
  budgetModal.addEventListener("click", (event) => {
    if (event.target === budgetModal) {
      closeBudgetModal();
    }
  });

  budgetModal.style.display = "none";
  budgetModal.setAttribute("aria-hidden", "true");
}

/* =========================================================
   INITIALIZE
   ========================================================= */

loadBudgets();
