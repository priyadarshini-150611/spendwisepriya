/* =========================================================
   SPENDWISE - EXPENSES PAGE
   Backend API + Mobile Menu + CRUD + Filters + Pagination
   ========================================================= */
const API_BASE ="https://spendwise-backend-stvh.onrender.com/api";

/* =========================================================
   ELEMENTS
   ========================================================= */

const hamburgerBtn = document.getElementById("hamburgerBtn");
const sidebar = document.querySelector(".sidebar");
const mobileNavOverlay = document.getElementById("mobileNavOverlay");
const navLinks = document.querySelectorAll(".sidebar .nav-link");

const addExpenseButton = document.querySelector(".add-expense-btn");
const expenseModal = document.getElementById("expenseModal");
const closeModal = document.getElementById("closeModal");
const cancelModal = document.getElementById("cancelModal");
const expenseForm = document.getElementById("expenseForm");
const expenseTableBody = document.querySelector("table tbody");

const descriptionInput = document.getElementById("expenseDescription");
const amountInput = document.getElementById("expenseAmount");
const categoryInput = document.getElementById("expenseCategory");
const dateInput = document.getElementById("expenseDate");
const paymentInput = document.getElementById("expensePayment");

const modalTitle = document.querySelector(".modal-header h2");
const saveButton = document.querySelector(".save-expense-btn");

const expenseSearch = document.getElementById("expenseSearch");
const categoryFilter = document.getElementById("categoryFilter");
const dateFilter = document.getElementById("dateFilter");

const paginationText = document.querySelector(".pagination > span");
const pageButtonsContainer = document.querySelector(".page-buttons");
const exportButton = document.querySelector(".export-btn");

const rowsPerPage = 5;

let currentPage = 1;
let editingRow = null;

/* =========================================================
   CHECK REQUIRED HTML ELEMENTS
   ========================================================= */

if (!expenseForm || !expenseTableBody) {
  console.error("Expenses page elements were not found. Check expenses.html.");
}

/* =========================================================
   API HELPER
   ========================================================= */

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  if (response.status === 401) {
    window.location.href = "login.html";
    throw new Error("Your session has expired. Please log in again.");
  }

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return null;
}

/* =========================================================
   MOBILE MENU
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

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && sidebar.classList.contains("mobile-open")) {
      closeMobileMenu();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 600) {
      closeMobileMenu();
    }
  });
}

/* =========================================================
   MODAL HELPERS
   ========================================================= */

function openExpenseModal() {
  if (!expenseModal) return;
  expenseModal.classList.add("show");
}

function closeExpenseModal() {
  if (!expenseModal) return;

  expenseModal.classList.remove("show");
  expenseForm.reset();
  editingRow = null;

  if (modalTitle) {
    modalTitle.textContent = "Add New Expense";
  }

  if (saveButton) {
    saveButton.textContent = "Save Expense";
  }
}

if (addExpenseButton) {
  addExpenseButton.addEventListener("click", () => {
    editingRow = null;
    expenseForm.reset();

    modalTitle.textContent = "Add New Expense";
    saveButton.textContent = "Save Expense";

    openExpenseModal();
  });
}

if (closeModal) {
  closeModal.addEventListener("click", closeExpenseModal);
}

if (cancelModal) {
  cancelModal.addEventListener("click", closeExpenseModal);
}

if (expenseModal) {
  expenseModal.addEventListener("click", (event) => {
    if (event.target === expenseModal) {
      closeExpenseModal();
    }
  });
}

/* =========================================================
   DATE FORMATTING
   ========================================================= */

function formatExpenseDate(dateString) {
  const date = new Date(`${dateString}T00:00:00`);

  return {
    day: String(date.getDate()).padStart(2, "0"),
    month: date.toLocaleString("en-US", { month: "short" }),
  };
}

function formatAmount(amount) {
  return Number(amount).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/* =========================================================
   CREATE A TABLE ROW
   ========================================================= */

function createExpenseRow(expense) {
  const row = document.createElement("tr");

  row.dataset.expenseId = expense.expenseId;
  row.dataset.date = expense.expenseDate;

  const formattedDate = formatExpenseDate(expense.expenseDate);

  const dateCell = document.createElement("td");
  const dateStrong = document.createElement("strong");
  dateStrong.textContent = `${formattedDate.day} ${formattedDate.month}`;

  const dateLabel = document.createElement("span");
  dateLabel.textContent = "Saved";

  dateCell.append(dateStrong, dateLabel);

  const descriptionCell = document.createElement("td");
  const expenseName = document.createElement("div");
  expenseName.className = "expense-name";

  const expenseIcon = document.createElement("div");
  expenseIcon.className = "expense-icon";
  expenseIcon.textContent = "💸";

  const descriptionDetails = document.createElement("div");
  const descriptionStrong = document.createElement("strong");
  descriptionStrong.textContent = expense.description;

  const descriptionLabel = document.createElement("span");
  descriptionLabel.textContent = "Expense";

  descriptionDetails.append(descriptionStrong, descriptionLabel);
  expenseName.append(expenseIcon, descriptionDetails);
  descriptionCell.appendChild(expenseName);

  const categoryCell = document.createElement("td");
  const categoryLabel = document.createElement("span");
  categoryLabel.className = "category";
  categoryLabel.textContent = expense.category;
  categoryCell.appendChild(categoryLabel);

  const paymentCell = document.createElement("td");
  paymentCell.className = "payment-method";
  paymentCell.textContent = expense.paymentMethod;

  const amountCell = document.createElement("td");
  amountCell.className = "amount";
  amountCell.textContent = `-₹${formatAmount(expense.amount)}`;

  const actionsCell = document.createElement("td");
  const actions = document.createElement("div");
  actions.className = "actions";

  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.setAttribute("aria-label", "Edit expense");
  editButton.textContent = "✎";

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.setAttribute("aria-label", "Delete expense");
  deleteButton.textContent = "×";

  actions.append(editButton, deleteButton);
  actionsCell.appendChild(actions);

  row.append(
    dateCell,
    descriptionCell,
    categoryCell,
    paymentCell,
    amountCell,
    actionsCell,
  );

  return row;
}

/* =========================================================
   EXPENSE SUMMARY CARDS
   ========================================================= */

function getExpenseDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function updateExpenseSummary(expenses) {
  const cards = document.querySelectorAll(
    ".expense-summary .summary-card"
  );

  if (cards.length < 4) return;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
  const lastMonth = lastMonthDate.getMonth();
  const lastMonthYear = lastMonthDate.getFullYear();

  const currentMonthExpenses = expenses.filter((expense) => {
    const date = getExpenseDate(expense.expenseDate);
    return (
      date.getMonth() === currentMonth &&
      date.getFullYear() === currentYear
    );
  });

  const lastMonthExpenses = expenses.filter((expense) => {
    const date = getExpenseDate(expense.expenseDate);
    return (
      date.getMonth() === lastMonth &&
      date.getFullYear() === lastMonthYear
    );
  });

  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + Number(expense.amount || 0),
    0
  );

  const thisMonthTotal = currentMonthExpenses.reduce(
    (sum, expense) => sum + Number(expense.amount || 0),
    0
  );

  const lastMonthTotal = lastMonthExpenses.reduce(
    (sum, expense) => sum + Number(expense.amount || 0),
    0
  );

  const dailyAverage = thisMonthTotal / now.getDate();

  // Card 1: All recorded expenses
  cards[0].querySelector("h2").textContent =
    `₹${formatAmount(totalExpenses)}`;

  cards[0].querySelector("p").textContent =
    "Across all recorded transactions";

  // Card 2: Current month's expenses
  cards[1].querySelector("h2").textContent =
    `₹${formatAmount(thisMonthTotal)}`;

  const comparison = cards[1].querySelector("p");

  if (lastMonthTotal > 0) {
    const percentage =
      ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;

    if (percentage > 0) {
      comparison.textContent =
        `↑ ${percentage.toFixed(1)}% from last month`;
      comparison.className = "negative";
    } else if (percentage < 0) {
      comparison.textContent =
        `↓ ${Math.abs(percentage).toFixed(1)}% from last month`;
      comparison.className = "positive";
    } else {
      comparison.textContent = "Same as last month";
      comparison.className = "";
    }
  } else {
    comparison.textContent = thisMonthTotal > 0
      ? "No previous-month spending to compare"
      : "No spending recorded this month";
    comparison.className = "";
  }

  // Card 3: Transactions this month
  cards[2].querySelector("h2").textContent =
    currentMonthExpenses.length;

  cards[2].querySelector("p").textContent =
    "Transactions this month";

  // Card 4: Average spending per calendar day so far this month
  cards[3].querySelector("h2").textContent =
    `₹${formatAmount(dailyAverage)}`;

  cards[3].querySelector("p").textContent =
    "Daily average this month";
}

/* =========================================================
   DYNAMIC EXPENSE SMART INSIGHT
   ========================================================= */

async function updateExpenseSmartInsight(expenses) {
  const section = document.querySelector(".expense-insight");
  if (!section) return;

  const title = section.querySelector("h2");
  const description = section.querySelector("span");

  if (!title || !description) return;

  // Use the existing backend insight API first.
  try {
    const insight = await apiRequest(
      `${API_BASE}/analytics/smart-insight`
    );

    if (
      insight &&
      typeof insight.title === "string" &&
      typeof insight.description === "string"
    ) {
      title.textContent = insight.title;
      description.textContent = insight.description;
      return;
    }
  } catch (error) {
    console.warn(
      "Smart Insight API unavailable; calculating insight locally.",
      error
    );
  }

  // Fallback: calculate the highest-spending category locally.
  const now = new Date();

  const thisMonthExpenses = expenses.filter((expense) => {
    const date = getExpenseDate(expense.expenseDate);

    return (
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  });

  const categoryTotals = {};

  thisMonthExpenses.forEach((expense) => {
    const category = expense.category || "Other";

    categoryTotals[category] =
      (categoryTotals[category] || 0) +
      Number(expense.amount || 0);
  });

  const total = thisMonthExpenses.reduce(
    (sum, expense) => sum + Number(expense.amount || 0),
    0
  );

  const highestCategory = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])[0];

  if (!highestCategory || total === 0) {
    title.textContent = "No spending recorded this month yet.";
    description.textContent =
      "Add an expense to receive a personalized spending insight.";
    return;
  }

  const [category, amount] = highestCategory;
  const percentage = (amount / total) * 100;

  title.textContent = `${category} is your highest expense category.`;

  description.textContent =
    `You have spent ₹${formatAmount(amount)} on ${category} this month, ` +
    `which is ${percentage.toFixed(1)}% of your total expenses.`;
}

/* =========================================================
   LOAD EXPENSES FROM SPRING BOOT API
   ========================================================= */
async function loadExpenses() {
  try {
    // Remove old or sample transactions immediately.
    expenseTableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center;">
          Loading expenses...
        </td>
      </tr>
    `;

    // Fetch expenses from the Spring Boot backend.
    const expenses = await apiRequest(`${API_BASE}/expenses`);

    if (!Array.isArray(expenses)) {
      throw new Error("Invalid expenses response from server.");
    }

    // Clear loading message.
    expenseTableBody.innerHTML = "";

    if (expenses.length === 0) {
      expenseTableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center;">
            No expenses recorded yet.
          </td>
        </tr>
      `;

      updateExpenseSummary([]);
      currentPage = 1;
      filterExpenses();
      return;
    }

    // Display database records.
    expenses.forEach((expense) => {
      expenseTableBody.appendChild(createExpenseRow(expense));
    });

    updateExpenseSummary(expenses);

    await updateExpenseSmartInsight(expenses);

    currentPage = 1;
    filterExpenses();

    console.log("Expenses loaded from backend:", expenses);

  } catch (error) {
    console.error("Error loading expenses:", error);

    expenseTableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center;">
          Unable to load expenses from server.
        </td>
      </tr>
    `;

    alert(`Unable to load expenses: ${error.message}`);
  }
}
/* =========================================================
   EDIT OR DELETE EXPENSE
   ========================================================= */

if (expenseTableBody) {
  expenseTableBody.addEventListener("click", async (event) => {
    const editButton = event.target.closest(
      'button[aria-label="Edit expense"]',
    );

    const deleteButton = event.target.closest(
      'button[aria-label="Delete expense"]',
    );

    const row = event.target.closest("tr");

    if (!row) return;

    if (editButton) {
      editingRow = row;

      descriptionInput.value = row
        .querySelector(".expense-name strong")
        .textContent.trim();

      categoryInput.value = row.querySelector(".category").textContent.trim();

      amountInput.value = row.cells[4].textContent
        .replace("-₹", "")
        .replace(/,/g, "")
        .trim();

      paymentInput.value = row
        .querySelector(".payment-method")
        .textContent.trim();
      dateInput.value = row.dataset.date;

      modalTitle.textContent = "Edit Expense";
      saveButton.textContent = "Save Changes";

      openExpenseModal();
      return;
    }

    if (deleteButton) {
      const expenseId = row.dataset.expenseId;
      const expenseName = row
        .querySelector(".expense-name strong")
        .textContent.trim();

      if (!confirm(`Are you sure you want to delete "${expenseName}"?`)) {
        return;
      }

      try {
        await apiRequest(`${API_BASE}/expenses/${expenseId}`, {
          method: "DELETE",
        });

        alert("Expense deleted successfully!");
        await loadExpenses();
      } catch (error) {
        console.error("Error deleting expense:", error);
        alert(`Unable to delete expense: ${error.message}`);
      }
    }
  });
}

/* =========================================================
   SEARCH AND FILTER EVENTS
   ========================================================= */

if (expenseSearch) {
  expenseSearch.addEventListener("input", () => {
    currentPage = 1;
    filterExpenses();
  });
}

if (categoryFilter) {
  categoryFilter.addEventListener("change", () => {
    currentPage = 1;
    filterExpenses();
  });
}

if (dateFilter) {
  dateFilter.addEventListener("change", () => {
    currentPage = 1;
    filterExpenses();
  });
}

/* =========================================================
   FILTER + PAGINATION
   ========================================================= */

function filterExpenses() {
  if (!expenseTableBody) return;

  const searchText = expenseSearch
    ? expenseSearch.value.toLowerCase().trim()
    : "";

  const selectedCategory = categoryFilter
    ? categoryFilter.value.toLowerCase().trim()
    : "all categories";

  const selectedDate = dateFilter ? dateFilter.value : "";

  const allRows = Array.from(expenseTableBody.querySelectorAll("tr"));

  const matchingRows = allRows.filter((row) => {
    const categoryElement = row.querySelector(".category");

    if (!categoryElement) return false;

    const rowText = row.textContent.toLowerCase();
    const rowCategory = categoryElement.textContent.toLowerCase().trim();

    const matchesSearch = rowText.includes(searchText);

    const matchesCategory =
      !selectedCategory ||
      selectedCategory === "all" ||
      selectedCategory === "all categories" ||
      rowCategory === selectedCategory;

    let matchesDate = true;

    if (row.dataset.date && selectedDate) {
      const rowDate = new Date(`${row.dataset.date}T00:00:00`);
      const today = new Date();

      if (selectedDate === "This Month") {
        matchesDate =
          rowDate.getMonth() === today.getMonth() &&
          rowDate.getFullYear() === today.getFullYear();
      } else if (selectedDate === "Last Month") {
        const lastMonth = new Date(
          today.getFullYear(),
          today.getMonth() - 1,
          1,
        );

        matchesDate =
          rowDate.getMonth() === lastMonth.getMonth() &&
          rowDate.getFullYear() === lastMonth.getFullYear();
      } else if (selectedDate === "Last 3 Months") {
        const threeMonthsAgo = new Date(
          today.getFullYear(),
          today.getMonth() - 3,
          today.getDate(),
        );

        matchesDate = rowDate >= threeMonthsAgo && rowDate <= today;
      } else if (selectedDate === "This Year") {
        matchesDate = rowDate.getFullYear() === today.getFullYear();
      } else if (selectedDate === "Today") {
        matchesDate =
          rowDate.getFullYear() === today.getFullYear() &&
          rowDate.getMonth() === today.getMonth() &&
          rowDate.getDate() === today.getDate();
      } else if (selectedDate === "All" || selectedDate === "All Time") {
        matchesDate = true;
      }
    }

    return matchesSearch && matchesCategory && matchesDate;
  });

  const totalPages = Math.max(1, Math.ceil(matchingRows.length / rowsPerPage));

  if (currentPage > totalPages) {
    currentPage = totalPages;
  }

  allRows.forEach((row) => {
    row.style.display = "none";
  });

  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;

  matchingRows.slice(startIndex, endIndex).forEach((row) => {
    row.style.display = "";
  });

  updatePaginationText(matchingRows.length, startIndex, endIndex);
  createPaginationButtons(totalPages);
}

/* =========================================================
   PAGINATION TEXT
   ========================================================= */

function updatePaginationText(totalItems, startIndex, endIndex) {
  if (!paginationText) return;

  if (totalItems === 0) {
    paginationText.textContent = "Showing 0 of 0 expenses";
    return;
  }

  const actualStart = startIndex + 1;
  const actualEnd = Math.min(endIndex, totalItems);

  paginationText.textContent = `Showing ${actualStart}–${actualEnd} of ${totalItems} expenses`;
}

/* =========================================================
   PAGINATION BUTTONS
   ========================================================= */

function createPaginationButtons(totalPages) {
  if (!pageButtonsContainer) return;

  pageButtonsContainer.innerHTML = "";

  const previousButton = document.createElement("button");
  previousButton.type = "button";
  previousButton.textContent = "←";
  previousButton.disabled = currentPage === 1;

  previousButton.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      filterExpenses();
    }
  });

  pageButtonsContainer.appendChild(previousButton);

  for (let page = 1; page <= totalPages; page++) {
    const pageButton = document.createElement("button");

    pageButton.type = "button";
    pageButton.textContent = page;
    pageButton.classList.add("page-btn");

    if (page === currentPage) {
      pageButton.classList.add("current");
    }

    pageButton.addEventListener("click", () => {
      currentPage = page;
      filterExpenses();
    });

    pageButtonsContainer.appendChild(pageButton);
  }

  const nextButton = document.createElement("button");
  nextButton.type = "button";
  nextButton.textContent = "→";
  nextButton.disabled = currentPage === totalPages;

  nextButton.addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++;
      filterExpenses();
    }
  });

  pageButtonsContainer.appendChild(nextButton);
}

/* =========================================================
   EXPORT VISIBLE EXPENSES TO CSV
   ========================================================= */

if (exportButton) {
  exportButton.addEventListener("click", () => {
    const rows = Array.from(expenseTableBody.querySelectorAll("tr"));

    const visibleRows = rows.filter((row) => row.style.display !== "none");

    if (visibleRows.length === 0) {
      alert("There are no expenses to export.");
      return;
    }

    const csvEscape = (value) => `"${String(value).replace(/"/g, '""')}"`;

    let csv = "Date,Description,Category,Payment,Amount\n";

    visibleRows.forEach((row) => {
      const date = row.cells[0].innerText.replace(/\n/g, " ").trim();
      const description = row
        .querySelector(".expense-name strong")
        .textContent.trim();
      const category = row.querySelector(".category").textContent.trim();
      const payment = row.querySelector(".payment-method").textContent.trim();
      const amount = row.querySelector(".amount").textContent.trim();

      csv +=
        [date, description, category, payment, amount]
          .map(csvEscape)
          .join(",") + "\n";
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "SpendWise-Expenses.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  });
}

/* =========================================================
   INITIAL LOAD
   ========================================================= */

loadExpenses();
