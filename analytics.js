/* =========================================================
   SPENDWISE ANALYTICS
   Fully Functional Analytics JavaScript
   ========================================================= */

/* =========================================================
   STORAGE
   ========================================================= */
const API_BASE = `${window.location.protocol}//${window.location.hostname}:8080/api`;
function getStorageData(keys) {
  for (const key of keys) {
    try {
      const data = JSON.parse(localStorage.getItem(key));

      if (Array.isArray(data)) {
        return data;
      }
    } catch (error) {
      console.error("Storage error:", error);
    }
  }

  return [];
}

/* =========================================================
   DATA SOURCES
   ========================================================= */

// Analytics transaction data is loaded from the Spring Boot backend.
let analyticsExpenses = [];
let analyticsIncome = [];

function getExpenses() {
  return analyticsExpenses;
}

function getIncome() {
  return analyticsIncome;
}

async function fetchAnalyticsData(url) {
  const response = await fetch(url, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const body = await response.json();
      if (body && body.message) message = body.message;
    } catch (_) {
      // Keep the status-based message when the response is not JSON.
    }

    throw new Error(`${message} (${url})`);
  }

  const data = await response.json();

  if (!Array.isArray(data)) {
    throw new Error(`Expected an array from ${url}`);
  }

  return data;
}

async function loadAnalyticsData() {
  const title = document.getElementById("analyticsInsightTitle");
  const text = document.getElementById("analyticsInsightText");

  try {
      const [expenses, income] = await Promise.all([
        fetchAnalyticsData(`${API_BASE}/expenses`),
        fetchAnalyticsData(`${API_BASE}/income`),
      ]);

    analyticsExpenses = expenses.map((item) => ({
      ...item,
      date: item.expenseDate ?? item.date ?? item.createdAt ?? item.createdDate,
      amount: Number(item.amount) || 0,
    }));

    analyticsIncome = income.map((item) => ({
      ...item,
      date: item.incomeDate ?? item.date ?? item.createdAt ?? item.createdDate,
      amount: Number(item.amount) || 0,
    }));

    console.log("Analytics expenses loaded:", analyticsExpenses);
    console.log("Analytics income loaded:", analyticsIncome);

    calculateAnalytics();
  } catch (error) {
    console.error("Failed to load Analytics data:", error);

    if (title) title.textContent = "Analytics data could not be loaded.";
    if (text) {
      text.textContent =
        error.message.includes("401") ||
        error.message.toLowerCase().includes("log in")
          ? "Please log in again, then reload the Analytics page."
          : "Check that the backend is running and your login session is active, then reload this page.";
    }
  }
}

function getBudgets() {
  return getStorageData(["spendwiseBudgets", "budgets", "budgetData"]);
}

function getSavings() {
  return getStorageData([
    "spendwiseSavings",
    "savings",
    "savingsGoals",
    "savingsData",
  ]);
}

/* =========================================================
   MOBILE MENU — ANALYTICS
   ========================================================= */

const hamburgerBtn = document.getElementById("hamburgerBtn");
const sidebar = document.querySelector(".sidebar");
const mobileNavOverlay = document.getElementById("mobileNavOverlay");

function openMobileMenu() {
  if (!hamburgerBtn || !sidebar || !mobileNavOverlay) return;

  sidebar.classList.add("mobile-open");
  mobileNavOverlay.classList.add("active");
  document.body.classList.add("menu-open");

  hamburgerBtn.textContent = "✕";
  hamburgerBtn.setAttribute("aria-expanded", "true");
  hamburgerBtn.setAttribute("aria-label", "Close navigation");
}

function closeMobileMenu() {
  if (!hamburgerBtn || !sidebar || !mobileNavOverlay) return;

  sidebar.classList.remove("mobile-open");
  mobileNavOverlay.classList.remove("active");
  document.body.classList.remove("menu-open");

  hamburgerBtn.textContent = "☰";
  hamburgerBtn.setAttribute("aria-expanded", "false");
  hamburgerBtn.setAttribute("aria-label", "Open navigation");
}

if (hamburgerBtn) {
  hamburgerBtn.addEventListener("click", function () {
    if (sidebar.classList.contains("mobile-open")) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  });
}

if (mobileNavOverlay) {
  mobileNavOverlay.addEventListener("click", closeMobileMenu);
}

if (sidebar) {
  sidebar.querySelectorAll(".nav-link").forEach(function (link) {
    link.addEventListener("click", closeMobileMenu);
  });
}


/* =========================================================
   HELPERS
   ========================================================= */

function getAmount(item) {
  return (
    Number(
      item.amount ??
        item.value ??
        item.currentAmount ??
        item.savedAmount ??
        item.spent ??
        0,
    ) || 0
  );
}

function getDate(item) {
  const value =
    item.date ??
    item.expenseDate ??
    item.incomeDate ??
    item.createdAt ??
    item.createdDate;

  // Invalid or missing dates should not be counted as today's transactions.
  if (!value) return new Date(0);

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date(0) : date;
}

function getCategory(item) {
  return (item.category ?? item.type ?? "Other").toString().trim() || "Other";
}

function formatCurrency(amount) {
  return (
    "₹" +
    Number(amount || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 0,
    })
  );
}

function formatPercentage(value) {
  return Number(value || 0).toFixed(1) + "%";
}

function setText(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = value;
  }
}

/* =========================================================
   PERIOD FILTER
   ========================================================= */

function filterByPeriod(data, period) {
  if (period === "all") {
    return [...data];
  }

  const now = new Date();

  let start = new Date(now);

  if (period === "month") {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (period === "3months") {
    start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  } else if (period === "6months") {
    start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  } else if (period === "year") {
    start = new Date(now.getFullYear(), 0, 1);
  }

  start.setHours(0, 0, 0, 0);

  now.setHours(23, 59, 59, 999);

  return data.filter((item) => {
    const date = getDate(item);

    return date >= start && date <= now;
  });
}

/* =========================================================
   MAIN ANALYTICS
   ========================================================= */

function calculateAnalytics() {
  const expenses = getExpenses();

  const income = getIncome();

  const budgets = getBudgets();

  const savings = getSavings();

  const periodSelect = document.getElementById("analyticsPeriod");

  const period = periodSelect ? periodSelect.value : "all";

  const filteredExpenses = filterByPeriod(expenses, period);

  const filteredIncome = filterByPeriod(income, period);

  /* ================= TOTALS ================= */

  const totalIncome = filteredIncome.reduce(
    (sum, item) => sum + getAmount(item),
    0,
  );

  const totalExpenses = filteredExpenses.reduce(
    (sum, item) => sum + getAmount(item),
    0,
  );

  const savingsAmount = Math.max(totalIncome - totalExpenses, 0);

  const savingsRate = totalIncome > 0 ? (savingsAmount / totalIncome) * 100 : 0;

  const transactions = filteredIncome.length + filteredExpenses.length;

  /* ================= UPDATE PAGE ================= */

  updateSummary(
    totalIncome,
    totalExpenses,
    savingsAmount,
    savingsRate,
    transactions,
  );

  createCashFlowChart(income, expenses);

  createSavingsRate(totalIncome, totalExpenses, savingsAmount, savingsRate);

  createCategoryChart(filteredExpenses);

  createTopCategories(filteredExpenses);

  createTrendChart(expenses);

  updateStatistics(filteredExpenses, filteredIncome);

  createSmartInsight(
    totalIncome,
    totalExpenses,
    savingsAmount,
    savingsRate,
    filteredExpenses,
  );

  updateCategoryFilter(expenses);
}

/* =========================================================
   SUMMARY CARDS
   ========================================================= */

function updateSummary(income, expenses, savings, savingsRate, transactions) {
  setText("analyticsIncome", formatCurrency(income));

  setText("analyticsExpenses", formatCurrency(expenses));

  setText("analyticsSavings", formatCurrency(savings));

  setText("savingsRate", formatPercentage(savingsRate));

  setText("analyticsTransactions", transactions);
}

/* =========================================================
   CASH FLOW CHART
   ========================================================= */

function createCashFlowChart(incomeData, expenseData) {
  const incomeByMonth = {};

  const expenseByMonth = {};

  incomeData.forEach((item) => {
    const date = getDate(item);

    const key = date.getFullYear() + "-" + date.getMonth();

    incomeByMonth[key] = (incomeByMonth[key] || 0) + getAmount(item);
  });

  expenseData.forEach((item) => {
    const date = getDate(item);

    const key = date.getFullYear() + "-" + date.getMonth();

    expenseByMonth[key] = (expenseByMonth[key] || 0) + getAmount(item);
  });

  const now = new Date();

  const months = [];

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);

    months.push({
      key: date.getFullYear() + "-" + date.getMonth(),

      name: date.toLocaleString("en-IN", {
        month: "short",
      }),
    });
  }

  const maxValue = Math.max(
    1,
    ...months.map((month) =>
      Math.max(incomeByMonth[month.key] || 0, expenseByMonth[month.key] || 0),
    ),
  );

  const bars = document.getElementById("cashFlowBars");

  const labels = document.getElementById("chartMonths");

  if (!bars || !labels) {
    return;
  }

  bars.innerHTML = "";

  labels.innerHTML = "";

  months.forEach((month) => {
    const income = incomeByMonth[month.key] || 0;

    const expense = expenseByMonth[month.key] || 0;

    const column = document.createElement("div");

    column.className = "month-bar";

    const incomeBar = document.createElement("span");

    incomeBar.className = "bar income-bar";

    const expenseBar = document.createElement("span");

    expenseBar.className = "bar expense-bar";

    incomeBar.style.height =
      Math.max(income > 0 ? (income / maxValue) * 100 : 3, 3) + "%";

    expenseBar.style.height =
      Math.max(expense > 0 ? (expense / maxValue) * 100 : 3, 3) + "%";

    column.appendChild(incomeBar);

    column.appendChild(expenseBar);

    bars.appendChild(column);

    const label = document.createElement("span");

    label.textContent = month.name;

    labels.appendChild(label);
  });
}

/* =========================================================
   SAVINGS RATE
   ========================================================= */

function createSavingsRate(income, expenses, saved, rate) {
  setText("savingsRateCircle", formatPercentage(rate));

  setText("rateIncome", formatCurrency(income));

  setText("rateExpenses", formatCurrency(expenses));

  setText("rateSaved", formatCurrency(saved));

  const circle = document.querySelector(".savings-circle");

  if (circle) {
    circle.style.background = `conic-gradient(
                var(--black) ${rate * 3.6}deg,
                #e5e5e5 ${rate * 3.6}deg
            )`;
  }
}

/* =========================================================
   CATEGORY CHART
   ========================================================= */

function createCategoryChart(expenses) {
  const totals = {};

  expenses.forEach((item) => {
    const category = getCategory(item);

    totals[category] = (totals[category] || 0) + getAmount(item);
  });

  const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);

  const container = document.getElementById("categoryChart");

  if (!container) {
    return;
  }

  container.innerHTML = "";

  if (sorted.length === 0) {
    container.innerHTML = `
            <div class="analytics-empty">
                No expense data available.
            </div>
            `;

    return;
  }

  const total = sorted.reduce((sum, item) => sum + item[1], 0);

  sorted.forEach(([category, amount]) => {
    const percentage = total > 0 ? (amount / total) * 100 : 0;

    const row = document.createElement("div");

    row.className = "category-row";

    const heading = document.createElement("div");

    heading.className = "category-heading";

    const name = document.createElement("span");

    name.textContent = category;

    const value = document.createElement("strong");

    value.textContent = formatCurrency(amount);

    heading.appendChild(name);

    heading.appendChild(value);

    const track = document.createElement("div");

    track.className = "category-track";

    const fill = document.createElement("span");

    fill.className = "category-fill";

    fill.style.width = percentage + "%";

    track.appendChild(fill);

    const percent = document.createElement("small");

    percent.textContent = formatPercentage(percentage);

    row.appendChild(heading);

    row.appendChild(track);

    row.appendChild(percent);

    container.appendChild(row);
  });
}

/* =========================================================
   TOP CATEGORIES
   ========================================================= */

function createTopCategories(expenses) {
  const totals = {};

  expenses.forEach((item) => {
    const category = getCategory(item);

    totals[category] = (totals[category] || 0) + getAmount(item);
  });

  const sorted = Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const container = document.getElementById("topCategories");

  if (!container) {
    return;
  }

  container.innerHTML = "";

  if (sorted.length === 0) {
    container.innerHTML = `
            <div class="analytics-empty">
                No spending data available.
            </div>
            `;

    return;
  }

  sorted.forEach(([category, amount], index) => {
    const item = document.createElement("div");

    item.className = "category-item";

    item.innerHTML = `
                <div class="category-rank">
                    ${index + 1}
                </div>

                <div class="category-item-info">
                    <strong>
                        ${category}
                    </strong>

                    <span>
                        Spending category
                    </span>
                </div>

                <strong>
                    ${formatCurrency(amount)}
                </strong>
            `;

    container.appendChild(item);
  });

  /* TOP CATEGORY */

  setText("topCategory", sorted.length > 0 ? sorted[0][0] : "—");
}

/* =========================================================
   MONTHLY EXPENSE TREND
   ========================================================= */

function createTrendChart(expenses) {
  const select = document.getElementById("trendPeriod");

  const monthCount = select ? Number(select.value) : 6;

  const now = new Date();

  const months = [];

  for (let i = monthCount - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);

    months.push({
      year: date.getFullYear(),

      month: date.getMonth(),

      name: date.toLocaleString("en-IN", {
        month: "short",
      }),

      amount: 0,
    });
  }

  expenses.forEach((item) => {
    const date = getDate(item);

    const month = months.find(
      (value) =>
        value.year === date.getFullYear() && value.month === date.getMonth(),
    );

    if (month) {
      month.amount += getAmount(item);
    }
  });

  const maximum = Math.max(1, ...months.map((month) => month.amount));

  const container = document.getElementById("trendChart");

  if (!container) {
    return;
  }

  container.innerHTML = "";

  months.forEach((month) => {
    const column = document.createElement("div");

    column.className = "trend-column";

    const bar = document.createElement("div");

    bar.className = "trend-bar";

    bar.style.height =
      Math.max(month.amount > 0 ? (month.amount / maximum) * 100 : 3, 3) + "%";

    const label = document.createElement("span");

    label.textContent = month.name;

    column.appendChild(bar);

    column.appendChild(label);

    container.appendChild(column);
  });
}

/* =========================================================
   FINANCIAL STATISTICS
   ========================================================= */

function updateStatistics(expenses, income) {
  /* Largest Expense */

  const largestExpense = expenses.reduce(
    (largest, item) => Math.max(largest, getAmount(item)),
    0,
  );

  setText("largestExpense", formatCurrency(largestExpense));

  /* Average Transaction */

  const allTransactions = [...expenses, ...income];

  const totalTransactions = allTransactions.reduce(
    (sum, item) => sum + getAmount(item),
    0,
  );

  const averageTransaction =
    allTransactions.length > 0 ? totalTransactions / allTransactions.length : 0;

  setText("averageTransaction", formatCurrency(averageTransaction));

  /* Average Monthly Expense */

  const monthlyTotals = {};

  expenses.forEach((item) => {
    const date = getDate(item);

    const key = date.getFullYear() + "-" + date.getMonth();

    monthlyTotals[key] = (monthlyTotals[key] || 0) + getAmount(item);
  });

  const months = Object.values(monthlyTotals);

  const averageMonthlyExpense =
    months.length > 0
      ? months.reduce((sum, value) => sum + value, 0) / months.length
      : 0;

  setText("averageExpense", formatCurrency(averageMonthlyExpense));
}

/* =========================================================
   CATEGORY FILTER
   ========================================================= */

function updateCategoryFilter(expenses) {
  const select = document.getElementById("categoryPeriod");

  if (!select) {
    return;
  }

  const current = select.value;

  const categories = [
    ...new Set(expenses.map((item) => getCategory(item))),
  ].sort();

  select.innerHTML = `
        <option value="all">
            All Categories
        </option>
        `;

  categories.forEach((category) => {
    const option = document.createElement("option");

    option.value = category;

    option.textContent = category;

    select.appendChild(option);
  });

  if (categories.includes(current)) {
    select.value = current;
  }
}

/* =========================================================
   CATEGORY FILTER FUNCTIONALITY
   ========================================================= */

const categoryPeriod = document.getElementById("categoryPeriod");

if (categoryPeriod) {
  categoryPeriod.addEventListener("change", function () {
    const expenses = getExpenses();

    if (this.value === "all") {
      createCategoryChart(expenses);

      createTopCategories(expenses);

      return;
    }

    const filtered = expenses.filter(
      (item) => getCategory(item) === this.value,
    );

    createCategoryChart(filtered);

    createTopCategories(filtered);
  });
}

/* =========================================================
   TREND PERIOD
   ========================================================= */

const trendPeriod = document.getElementById("trendPeriod");

if (trendPeriod) {
  trendPeriod.addEventListener("change", function () {
    createTrendChart(getExpenses());
  });
}

/* =========================================================
   ANALYTICS PERIOD
   ========================================================= */

const analyticsPeriod = document.getElementById("analyticsPeriod");

if (analyticsPeriod) {
  analyticsPeriod.addEventListener("change", function () {
    calculateAnalytics();
  });
}

/* =========================================================
   SMART INSIGHT
   ========================================================= */

function createSmartInsight(
  income,
  expenses,
  savings,
  savingsRate,
  expenseData,
) {
  const title = document.getElementById("analyticsInsightTitle");

  const text = document.getElementById("analyticsInsightText");

  if (!title || !text) {
    return;
  }

  if (income === 0 && expenses === 0) {
    title.textContent =
      "Start adding transactions to unlock your financial insights.";

    text.textContent =
      "SpendWise will analyze your income, expenses and savings patterns automatically.";

    return;
  }

  /* Spending greater than income */

  if (expenses > income) {
    const difference = expenses - income;

    title.textContent = "Your expenses are higher than your income.";

    text.textContent = `You spent ${formatCurrency(
      difference,
    )} more than you earned during this period. Consider reviewing your largest spending categories.`;

    return;
  }

  /* Excellent savings */

  if (savingsRate >= 30) {
    title.textContent = "Excellent financial performance.";

    text.textContent = `You are saving ${formatPercentage(
      savingsRate,
    )} of your income. Your current savings amount is ${formatCurrency(
      savings,
    )}.`;

    return;
  }

  /* Good savings */

  if (savingsRate >= 20) {
    title.textContent = "Your savings rate is healthy.";

    text.textContent = `You are saving ${formatPercentage(
      savingsRate,
    )} of your income. Keep maintaining this habit.`;

    return;
  }

  /* Low savings */

  if (savingsRate > 0) {
    title.textContent = "There is an opportunity to improve your savings.";

    text.textContent = `Your current savings rate is ${formatPercentage(
      savingsRate,
    )}. Review your highest expense categories to find possible savings.`;

    return;
  }

  /* Zero savings */

  title.textContent = "Your income is currently being fully used.";

  text.textContent =
    "Try setting aside a small amount from each income transaction to gradually build your savings.";
}

/* =========================================================
   INITIAL LOAD
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
  loadAnalyticsData();
});

/* =========================================================
   UPDATE WHEN OTHER PAGES CHANGE LOCAL STORAGE
   ========================================================= */

// Refresh backend-backed analytics when the page becomes visible again.
document.addEventListener("visibilitychange", function () {
  if (document.visibilityState === "visible") {
    loadAnalyticsData();
  }
});