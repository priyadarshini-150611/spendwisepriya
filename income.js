/* =========================================================
   SPENDWISE - INCOME PAGE
   Connected to Spring Boot + MySQL
   ========================================================= */
const API_BASE ="https://spendwise-backend-stvh.onrender.com/api";

let incomeData = [];
const recordsPerPage = 5;

let currentPage = 1;
let filteredIncome = [];
let editingIncomeId = null;

/* =========================================================
   DOM ELEMENTS
   ========================================================= */

const hamburgerBtn = document.getElementById("hamburgerBtn");
const mobileNavOverlay = document.getElementById("mobileNavOverlay");
const sidebar = document.querySelector(".sidebar");

const incomeTableBody = document.getElementById("incomeTableBody");
const emptyState = document.getElementById("emptyState");

const searchIncome = document.getElementById("searchIncome");
const incomeSourceFilter = document.getElementById("incomeSourceFilter");
const incomeDateFilter = document.getElementById("incomeDateFilter");

const previousPage = document.getElementById("previousPage");
const nextPage = document.getElementById("nextPage");
const pageNumbers = document.getElementById("pageNumbers");
const paginationInfo = document.getElementById("paginationInfo");

const totalIncome = document.getElementById("totalIncome");
const monthlyIncome = document.getElementById("monthlyIncome");
const weeklyIncome = document.getElementById("weeklyIncome");
const incomeCount = document.getElementById("incomeCount");

const incomeModal = document.getElementById("incomeModal");
const openIncomeModal = document.getElementById("openIncomeModal");
const closeIncomeModal = document.getElementById("closeIncomeModal");
const cancelIncome = document.getElementById("cancelIncome");
const incomeForm = document.getElementById("incomeForm");
const modalTitle = document.getElementById("modalTitle");

const incomeSource = document.getElementById("incomeSource");
const incomeAmount = document.getElementById("incomeAmount");
const incomeDate = document.getElementById("incomeDate");
const incomeCategory = document.getElementById("incomeCategory");
const incomeDescription = document.getElementById("incomeDescription");

const exportIncome = document.getElementById("exportIncome");

/* =========================================================
   API HELPER
   ========================================================= */

async function fetchIncomeApi(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  const responseText = await response.text();

  let result = null;

  if (responseText) {
    try {
      result = JSON.parse(responseText);
    } catch {
      result = { message: responseText };
    }
  }

  if (!response.ok) {
    throw new Error(
      result?.message || `Request failed with status ${response.status}`,
    );
  }

  return result;
}

/* =========================================================
   MAP BACKEND DATA TO FRONTEND DATA
   ========================================================= */

function mapIncomeRecord(item) {
  return {
    id: item.incomeId,
    date: item.incomeDate,
    source: item.source,
    description: item.description || "",
    category: item.category,
    amount: Number(item.amount) || 0,
  };
}

/* =========================================================
   LOAD INCOME FROM MYSQL
   ========================================================= */

async function loadIncome() {
  const records = await fetchIncomeApi("/income");

  if (!Array.isArray(records)) {
    throw new Error("The server returned an unexpected income response.");
  }

  incomeData = records.map(mapIncomeRecord);

  const totalPages = Math.ceil(incomeData.length / recordsPerPage);

  if (totalPages > 0 && currentPage > totalPages) {
    currentPage = totalPages;
  }

  if (totalPages === 0) {
    currentPage = 1;
  }

  updateSummary();
  applyFilters();
  updateIncomeInsight();
}

/* =========================================================
   HAMBURGER MENU
   ========================================================= */

if (hamburgerBtn && sidebar && mobileNavOverlay) {
  function openMobileMenu() {
    sidebar.classList.add("mobile-open");
    mobileNavOverlay.classList.add("active");
    document.body.classList.add("menu-open");

    hamburgerBtn.setAttribute("aria-expanded", "true");
    hamburgerBtn.setAttribute("aria-label", "Close navigation");
    hamburgerBtn.textContent = "✕";
  }

  function closeMobileMenu() {
    sidebar.classList.remove("mobile-open");
    mobileNavOverlay.classList.remove("active");
    document.body.classList.remove("menu-open");

    hamburgerBtn.setAttribute("aria-expanded", "false");
    hamburgerBtn.setAttribute("aria-label", "Open navigation");
    hamburgerBtn.textContent = "☰";
  }

  hamburgerBtn.addEventListener("click", function () {
    if (sidebar.classList.contains("mobile-open")) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  });

  mobileNavOverlay.addEventListener("click", closeMobileMenu);

  document.querySelectorAll(".sidebar .nav-link").forEach(function (link) {
    link.addEventListener("click", closeMobileMenu);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && sidebar.classList.contains("mobile-open")) {
      closeMobileMenu();
    }
  });

  window.addEventListener("resize", function () {
    if (window.innerWidth > 600) {
      closeMobileMenu();
    }
  });
}

/* =========================================================
   FORMAT CURRENCY AND DATE
   ========================================================= */

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);
}

function formatDate(dateString) {
  if (!dateString) {
    return "—";
  }

  const date = new Date(dateString + "T00:00:00");

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/* Escape user-provided text before inserting it into HTML. */
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, function (character) {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });
}

/* =========================================================
   SOURCE ICON
   ========================================================= */

function getSourceIcon(source) {
  const icons = {
    Salary: "₹",
    Freelance: "↗",
    Business: "◆",
    Investment: "↟",
    Gift: "♡",
    Other: "•",
  };

  return icons[source] || "₹";
}

/* =========================================================
   DISPLAY INCOME
   ========================================================= */

function displayIncome() {
  if (!incomeTableBody) {
    return;
  }

  incomeTableBody.innerHTML = "";

  const tableWrapper = document.querySelector(".table-wrapper");

  if (filteredIncome.length === 0) {
    if (emptyState) {
      emptyState.style.display = "block";
    }

    if (tableWrapper) {
      tableWrapper.style.display = "none";
    }

    return;
  }

  if (emptyState) {
    emptyState.style.display = "none";
  }

  if (tableWrapper) {
    tableWrapper.style.display = "block";
  }

  const startIndex = (currentPage - 1) * recordsPerPage;
  const pageData = filteredIncome.slice(
    startIndex,
    startIndex + recordsPerPage,
  );

  pageData.forEach(function (income) {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>
        <strong>${escapeHtml(formatDate(income.date))}</strong>
        <span>${escapeHtml(income.date)}</span>
      </td>

      <td>
        <div class="income-name">
          <div class="income-icon">
            ${escapeHtml(getSourceIcon(income.source))}
          </div>
          <div>
            <strong>${escapeHtml(income.source)}</strong>
            <span>Income source</span>
          </div>
        </div>
      </td>

      <td>${escapeHtml(income.description || "—")}</td>

      <td>
        <span class="category">
          ${escapeHtml(income.category)}
        </span>
      </td>

      <td>
        <span class="amount">
          + ${escapeHtml(formatCurrency(income.amount))}
        </span>
      </td>

      <td>
        <div class="actions">
          <button
            type="button"
            class="edit-income-btn"
            title="Edit"
            aria-label="Edit income"
          >✎</button>

          <button
            type="button"
            class="delete-income-btn"
            title="Delete"
            aria-label="Delete income"
          >×</button>
        </div>
      </td>
    `;

    row
      .querySelector(".edit-income-btn")
      .addEventListener("click", function () {
        editIncome(income.id);
      });

    row
      .querySelector(".delete-income-btn")
      .addEventListener("click", function () {
        deleteIncome(income.id);
      });

    incomeTableBody.appendChild(row);
  });
}

/* =========================================================
   DATE FILTER
   ========================================================= */

function matchesDateFilter(dateString, filter) {
  if (filter === "all") {
    return true;
  }

  const incomeDateValue = new Date(dateString + "T00:00:00");

  if (Number.isNaN(incomeDateValue.getTime())) {
    return false;
  }

  incomeDateValue.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (filter === "today") {
    return incomeDateValue.getTime() === today.getTime();
  }

  if (filter === "week") {
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);

    return incomeDateValue >= weekAgo && incomeDateValue <= today;
  }

  if (filter === "month") {
    return (
      incomeDateValue.getMonth() === today.getMonth() &&
      incomeDateValue.getFullYear() === today.getFullYear()
    );
  }

  return true;
}

/* =========================================================
   APPLY SEARCH AND FILTERS
   ========================================================= */

function applyFilters() {
  const searchValue = searchIncome
    ? searchIncome.value.toLowerCase().trim()
    : "";

  const sourceValue = incomeSourceFilter ? incomeSourceFilter.value : "all";

  const dateValue = incomeDateFilter ? incomeDateFilter.value : "all";

  filteredIncome = incomeData.filter(function (income) {
    const source = String(income.source || "").toLowerCase();
    const description = String(income.description || "").toLowerCase();
    const category = String(income.category || "").toLowerCase();

    const matchesSearch =
      source.includes(searchValue) ||
      description.includes(searchValue) ||
      category.includes(searchValue);

    const matchesSource =
      sourceValue === "all" || income.source === sourceValue;

    const matchesDate = matchesDateFilter(income.date, dateValue);

    return matchesSearch && matchesSource && matchesDate;
  });

  currentPage = 1;

  displayIncome();
  updatePagination();
}

/* =========================================================
   UPDATE SUMMARY CARDS
   ========================================================= */

function updateSummary() {
  if (!totalIncome || !monthlyIncome || !weeklyIncome || !incomeCount) {
    return;
  }

  const total = incomeData.reduce(function (sum, income) {
    return sum + income.amount;
  }, 0);

  totalIncome.textContent = formatCurrency(total);
  incomeCount.textContent = incomeData.length;

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const monthTotal = incomeData.reduce(function (sum, income) {
    const date = new Date(income.date + "T00:00:00");

    if (
      date.getMonth() === currentMonth &&
      date.getFullYear() === currentYear
    ) {
      return sum + income.amount;
    }

    return sum;
  }, 0);

  monthlyIncome.textContent = formatCurrency(monthTotal);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const weekStart = new Date(todayStart);
  weekStart.setDate(todayStart.getDate() - 7);

  const weekTotal = incomeData.reduce(function (sum, income) {
    const date = new Date(income.date + "T00:00:00");
    date.setHours(0, 0, 0, 0);

    if (date >= weekStart && date <= todayStart) {
      return sum + income.amount;
    }

    return sum;
  }, 0);

  weeklyIncome.textContent = formatCurrency(weekTotal);
}

/* =========================================================
   PAGINATION
   ========================================================= */

function updatePagination() {
  if (!paginationInfo || !pageNumbers || !previousPage || !nextPage) {
    return;
  }

  const totalRecords = filteredIncome.length;
  const totalPages = Math.ceil(totalRecords / recordsPerPage);

  if (totalRecords === 0) {
    paginationInfo.textContent = "Showing 0–0 of 0";
  } else {
    const start = (currentPage - 1) * recordsPerPage + 1;
    const end = Math.min(currentPage * recordsPerPage, totalRecords);

    paginationInfo.textContent = `Showing ${start}–${end} of ${totalRecords}`;
  }

  previousPage.disabled = currentPage <= 1;
  nextPage.disabled = totalPages === 0 || currentPage >= totalPages;

  pageNumbers.innerHTML = "";

  for (let page = 1; page <= totalPages; page++) {
    const button = document.createElement("button");

    button.type = "button";
    button.textContent = page;

    if (page === currentPage) {
      button.classList.add("current");
    }

    button.addEventListener("click", function () {
      currentPage = page;
      displayIncome();
      updatePagination();
    });

    pageNumbers.appendChild(button);
  }
}

if (previousPage) {
  previousPage.addEventListener("click", function () {
    if (currentPage > 1) {
      currentPage--;
      displayIncome();
      updatePagination();
    }
  });
}

if (nextPage) {
  nextPage.addEventListener("click", function () {
    const totalPages = Math.ceil(filteredIncome.length / recordsPerPage);

    if (currentPage < totalPages) {
      currentPage++;
      displayIncome();
      updatePagination();
    }
  });
}

/* =========================================================
   SEARCH AND FILTER EVENTS
   ========================================================= */

if (searchIncome) {
  searchIncome.addEventListener("input", applyFilters);
}

if (incomeSourceFilter) {
  incomeSourceFilter.addEventListener("change", applyFilters);
}

if (incomeDateFilter) {
  incomeDateFilter.addEventListener("change", applyFilters);
}

/* =========================================================
   MODAL HELPERS
   ========================================================= */

function setTodayDate() {
  if (!incomeDate) {
    return;
  }

  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  incomeDate.value = `${year}-${month}-${day}`;
}

function openAddIncomeModal() {
  editingIncomeId = null;

  if (modalTitle) {
    modalTitle.textContent = "Add Income";
  }

  if (incomeForm) {
    incomeForm.reset();
  }

  setTodayDate();

  if (incomeModal) {
    incomeModal.classList.add("show");
  }
}

if (openIncomeModal) {
  openIncomeModal.addEventListener("click", openAddIncomeModal);
}

function closeModal() {
  if (incomeModal) {
    incomeModal.classList.remove("show");
  }

  editingIncomeId = null;
}

if (closeIncomeModal) {
  closeIncomeModal.addEventListener("click", closeModal);
}

if (cancelIncome) {
  cancelIncome.addEventListener("click", closeModal);
}

if (incomeModal) {
  incomeModal.addEventListener("click", function (event) {
    if (event.target === incomeModal) {
      closeModal();
    }
  });
}

/* =========================================================
   ADD / EDIT INCOME THROUGH THE API
   ========================================================= */

if (incomeForm) {
  incomeForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const source = incomeSource ? incomeSource.value : "";
    const amount = incomeAmount ? Number(incomeAmount.value) : 0;
    const date = incomeDate ? incomeDate.value : "";
    const category = incomeCategory ? incomeCategory.value : "";
    const description = incomeDescription ? incomeDescription.value.trim() : "";

    if (
      !source ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      !date ||
      !category
    ) {
      alert("Please fill in all required fields with valid values.");
      return;
    }

    const requestBody = {
      source: source,
      amount: amount,
      incomeDate: date,
      category: category,
      description: description,
    };

    const submitButton = incomeForm.querySelector('button[type="submit"]');

    if (submitButton) {
      submitButton.disabled = true;
    }

    try {
      if (editingIncomeId !== null) {
        await fetchIncomeApi(`/income/${editingIncomeId}`, {
          method: "PUT",
          body: JSON.stringify(requestBody),
        });
      } else {
        await fetchIncomeApi("/income", {
          method: "POST",
          body: JSON.stringify(requestBody),
        });
      }

      await loadIncome();

      closeModal();
    } catch (error) {
      console.error("Unable to save income:", error);

      alert(
        `Unable to save income: ${error.message}\n\n` +
          "Please check that you are logged in and the backend is running.",
      );
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
      }
    }
  });
}

/* =========================================================
   EDIT INCOME
   ========================================================= */

function editIncome(id) {
  const income = incomeData.find(function (item) {
    return item.id === id;
  });

  if (!income) {
    return;
  }

  editingIncomeId = id;

  if (modalTitle) {
    modalTitle.textContent = "Edit Income";
  }

  if (incomeSource) {
    incomeSource.value = income.source;
  }

  if (incomeAmount) {
    incomeAmount.value = income.amount;
  }

  if (incomeDate) {
    incomeDate.value = income.date;
  }

  if (incomeCategory) {
    incomeCategory.value = income.category;
  }

  if (incomeDescription) {
    incomeDescription.value = income.description || "";
  }

  if (incomeModal) {
    incomeModal.classList.add("show");
  }
}

/* =========================================================
   DELETE INCOME THROUGH THE API
   ========================================================= */

async function deleteIncome(id) {
  const income = incomeData.find(function (item) {
    return item.id === id;
  });

  if (!income) {
    return;
  }

  const confirmDelete = confirm(
    `Delete ${income.source} income of ${formatCurrency(income.amount)}?`,
  );

  if (!confirmDelete) {
    return;
  }

  try {
    await fetchIncomeApi(`/income/${id}`, {
      method: "DELETE",
    });

    await loadIncome();
  } catch (error) {
    console.error("Unable to delete income:", error);

    alert(`Unable to delete income: ${error.message}`);
  }
}

/* =========================================================
   EXPORT INCOME CSV
   ========================================================= */

if (exportIncome) {
  exportIncome.addEventListener("click", function () {
    if (incomeData.length === 0) {
      alert("There is no income data to export.");
      return;
    }

    const headers = ["Date", "Source", "Description", "Category", "Amount"];

    const rows = incomeData.map(function (income) {
      return [
        income.date,
        income.source,
        income.description,
        income.category,
        income.amount,
      ];
    });

    const csvContent = [headers, ...rows]
      .map(function (row) {
        return row
          .map(function (value) {
            const text = String(value ?? "").replace(/"/g, '""');
            return `"${text}"`;
          })
          .join(",");
      })
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "spendwise-income.csv";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  });
}

/* =========================================================
   SMART INCOME INSIGHT
   ========================================================= */

function updateIncomeInsight() {
  const title = document.getElementById("incomeInsightTitle");
  const text = document.getElementById("incomeInsightText");

  if (!title || !text) {
    return;
  }

  if (incomeData.length === 0) {
    title.textContent = "No income data available";

    text.textContent =
      "Add your first income transaction to start receiving financial insights.";

    return;
  }

  const total = incomeData.reduce(function (sum, income) {
    return sum + income.amount;
  }, 0);

  const sourceTotals = {};

  incomeData.forEach(function (income) {
    sourceTotals[income.source] =
      (sourceTotals[income.source] || 0) + income.amount;
  });

  let largestSource = "";
  let largestAmount = 0;

  for (const source in sourceTotals) {
    if (sourceTotals[source] > largestAmount) {
      largestSource = source;
      largestAmount = sourceTotals[source];
    }
  }

  const percentage = total > 0 ? Math.round((largestAmount / total) * 100) : 0;

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const monthTotal = incomeData.reduce(function (sum, income) {
    const date = new Date(income.date + "T00:00:00");

    if (
      date.getMonth() === currentMonth &&
      date.getFullYear() === currentYear
    ) {
      return sum + income.amount;
    }

    return sum;
  }, 0);

  title.textContent = `${largestSource} is your strongest income source`;

  text.textContent =
    `${largestSource} contributes ${percentage}% of your recorded income, ` +
    `with ${formatCurrency(largestAmount)} earned in total. ` +
    `You have earned ${formatCurrency(monthTotal)} this month.`;
}

/* =========================================================
   INITIALIZE PAGE
   ========================================================= */

async function initializeIncomePage() {
  try {
    await loadIncome();
  } catch (error) {
    console.error("Unable to load income:", error);

    incomeData = [];
    filteredIncome = [];

    updateSummary();
    displayIncome();
    updatePagination();
    updateIncomeInsight();

    alert(
      `Unable to load your income records: ${error.message}\n\n` +
        "Please make sure you are logged in and the backend is running.",
    );
  }
}

initializeIncomePage();
