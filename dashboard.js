/* =========================================================
   SPENDWISE DASHBOARD
   Mobile Navigation + User Profile + Real Financial Data
   ========================================================= */
const API_BASE = `${window.location.protocol}//${window.location.hostname}:8080/api`;
document.addEventListener("DOMContentLoaded", () => {
  const hamburgerBtn = document.getElementById("hamburgerBtn");
  const sidebar = document.querySelector(".sidebar");
  const mobileNavOverlay = document.getElementById("mobileNavOverlay");
  const navLinks = document.querySelectorAll(".sidebar .nav-link");



  /* ================= MOBILE NAVIGATION ================= */

  function closeMobileMenu() {
    if (!hamburgerBtn || !sidebar || !mobileNavOverlay) return;

    sidebar.classList.remove("mobile-open");
    mobileNavOverlay.classList.remove("active");
    document.body.classList.remove("menu-open");

    hamburgerBtn.setAttribute("aria-expanded", "false");
    hamburgerBtn.setAttribute("aria-label", "Open navigation");
    hamburgerBtn.textContent = "☰";
  }

  function openMobileMenu() {
    sidebar.classList.add("mobile-open");
    mobileNavOverlay.classList.add("active");
    document.body.classList.add("menu-open");

    hamburgerBtn.setAttribute("aria-expanded", "true");
    hamburgerBtn.setAttribute("aria-label", "Close navigation");
    hamburgerBtn.textContent = "✕";
  }

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

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMobileMenu();
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 600) closeMobileMenu();
    });
  }

  /* ================= SHARED HELPERS ================= */

  function formatCurrency(value) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value) || 0);
  }

  function formatDate(dateValue) {
    if (!dateValue) return "Date unavailable";

    // Avoid timezone shifts for API dates formatted as YYYY-MM-DD.
    const dateText = String(dateValue);
    const date = /^\d{4}-\d{2}-\d{2}$/.test(dateText)
      ? new Date(`${dateText}T12:00:00`)
      : new Date(dateText);

    if (Number.isNaN(date.getTime())) return dateText;

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  async function fetchJson(url) {
    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    });

    if (response.status === 401) {
      window.location.href = "login.html";
      throw new Error("Your session has expired. Please log in again.");
    }

    if (!response.ok) {
      throw new Error(`Request failed (${response.status}): ${url}`);
    }

    return response.json();
  }

  /* ================= LOAD LOGGED-IN USER ================= */

  async function loadUserProfile() {
    try {
      const user = await fetchJson(`${API_BASE}/auth/me`);
      const fullName = user.fullName?.trim();

      if (!fullName) {
        throw new Error("User name was not returned by the server.");
      }

      const firstName = fullName.split(/\s+/)[0];

      const profileName = document.getElementById("profileName");
      const profileAvatar = document.getElementById("profileAvatar");
      const welcomeHeading = document.getElementById("welcomeHeading");

      if (profileName) profileName.textContent = firstName;

      if (profileAvatar) {
        profileAvatar.textContent = firstName.charAt(0).toUpperCase();
      }

      if (welcomeHeading) {
        welcomeHeading.textContent = `Welcome back, ${firstName}!`;
      }
    } catch (error) {
      console.error("Profile loading error:", error);
    }
  }

  /* ================= LOAD FINANCIAL SUMMARY ================= */

  async function loadFinancialSummary() {
    try {
      const summary = await fetchJson(`${API_BASE}/dashboard/summary`);

      const totalIncome = Number(summary.totalIncome) || 0;
      const totalExpenses = Number(summary.totalExpenses) || 0;
      const balance = Number(summary.balance) || 0;

      const balanceElement = document.getElementById("totalBalance");
      const incomeElement = document.getElementById("totalIncome");
      const expensesElement = document.getElementById("totalExpenses");
      const savingsElement = document.getElementById("netSavings");

      if (balanceElement) {
        balanceElement.textContent = formatCurrency(balance);
      }

      if (incomeElement) {
        incomeElement.textContent = formatCurrency(totalIncome);
      }

      if (expensesElement) {
        expensesElement.textContent = formatCurrency(totalExpenses);
      }

      if (savingsElement) {
        savingsElement.textContent = formatCurrency(balance);
      }
    } catch (error) {
      console.error("Financial summary loading error:", error);
    }
  }

  /* ================= RECENT TRANSACTIONS ================= */

  function getTransactionDate(transaction, type) {
    return type === "expense"
      ? transaction.expenseDate
      : transaction.incomeDate;
  }

  function createTransactionElement(transaction) {
    const row = document.createElement("div");
    row.className = "transaction";

    const isExpense = transaction.type === "expense";
    const name = isExpense
      ? transaction.category || transaction.description || "Expense"
      : transaction.source || transaction.category || "Income";

    const date = getTransactionDate(transaction, transaction.type);
    const amount = Number(transaction.amount) || 0;

    const icon = document.createElement("div");
    icon.className = "transaction-icon";
    icon.textContent = isExpense ? "↘" : "↗";

    const info = document.createElement("div");
    info.className = "transaction-info";

    const title = document.createElement("strong");
    title.textContent = name;

    const dateText = document.createElement("span");
    dateText.textContent = formatDate(date);

    info.append(title, dateText);

    const amountElement = document.createElement("strong");
    amountElement.className = isExpense ? "expense" : "income";
    amountElement.textContent = `${isExpense ? "−" : "+"}${formatCurrency(amount)}`;

    row.append(icon, info, amountElement);

    return row;
  }

  async function loadRecentTransactions() {
    const transactionList = document.getElementById("transactionList");
    if (!transactionList) return;

    try {
      const [expenses, incomes] = await Promise.all([
        fetchJson(`${API_BASE}/expenses`),
        fetchJson(`${API_BASE}/income`),
      ]);

      const expenseTransactions = expenses.map((item) => ({
        ...item,
        type: "expense",
      }));

      const incomeTransactions = incomes.map((item) => ({
        ...item,
        type: "income",
      }));

      const transactions = [...expenseTransactions, ...incomeTransactions];

      transactions.sort((a, b) => {
        const dateA = new Date(
          `${getTransactionDate(a, a.type) || "1970-01-01"}T00:00:00`,
        ).getTime();

        const dateB = new Date(
          `${getTransactionDate(b, b.type) || "1970-01-01"}T00:00:00`,
        ).getTime();

        return dateB - dateA;
      });

      transactionList.replaceChildren();

      if (transactions.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "empty-transactions";
        emptyMessage.textContent = "No transactions yet.";
        transactionList.appendChild(emptyMessage);
        return;
      }

      transactions.slice(0, 5).forEach((transaction) => {
        transactionList.appendChild(createTransactionElement(transaction));
      });
    } catch (error) {
      console.error("Recent transactions loading error:", error);

      transactionList.replaceChildren();

      const message = document.createElement("p");
      message.className = "empty-transactions";
      message.textContent = "Unable to load transactions. Please refresh.";
      transactionList.appendChild(message);
    }
  }

  /* ================= INITIALIZE DASHBOARD ================= */

  loadUserProfile();
  loadFinancialSummary();
  loadRecentTransactions();
});


/* =========================================================
   REAL SPENDING CHART
   ========================================================= */

async function loadDashboardSpendingChart() {
    const periodSelect = document.getElementById("spendingPeriod");
    const chart = document.getElementById("spendingChart");
    const chartTitle = document.getElementById("spendingChartTitle");

    if (!periodSelect || !chart || !chartTitle) return;

    const selectedPeriod = periodSelect.value;
    const now = new Date();

    let startDate;
    let endDate;

    if (selectedPeriod === "last-month") {
        startDate = new Date(
            now.getFullYear(),
            now.getMonth() - 1,
            1
        );

        endDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            1
        );

        chartTitle.textContent = "Last month's spending";
    } else if (selectedPeriod === "this-year") {
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear() + 1, 0, 1);

        chartTitle.textContent = "Yearly spending";
    } else {
        startDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            1
        );

        endDate = new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            1
        );

        chartTitle.textContent = "Monthly spending";
    }

    chart.replaceChildren();

    const status = document.createElement("p");
    status.className = "chart-status";
    status.textContent = "Loading spending data...";
    chart.appendChild(status);

    try {
        let chartData = [];

        // Fetch each month within the selected period.
        for (
            let monthDate = new Date(startDate);
            monthDate < endDate;
            monthDate = new Date(
                monthDate.getFullYear(),
                monthDate.getMonth() + 1,
                1
            )
        ) {
            const year = monthDate.getFullYear();
            const month = monthDate.getMonth() + 1;

            const response = await fetch(
              `${API_BASE}/analytics/daily-spending?year=${year}&month=${month}`,
              { credentials: "include" },
            );

           
if (response.status === 401) {
  window.location.href = "login.html";
  throw new Error("Your session has expired. Please log in again.");
}

if (!response.ok) {
  throw new Error("Unable to load spending data.");
}


            const dailyData = await response.json();
            chartData.push(...dailyData);
        }

        const totalsByDate = new Map();

        chartData.forEach(item => {
            totalsByDate.set(
                item.date,
                Number(item.total) || 0
            );
        });

        let bars = [];

        if (selectedPeriod === "this-year") {
            // Combine daily totals into January–December totals.
            const monthlyTotals = Array(12).fill(0);

            chartData.forEach(item => {
                const monthIndex = Number(item.date.slice(5, 7)) - 1;
                monthlyTotals[monthIndex] += Number(item.total) || 0;
            });

            const monthNames = [
                "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
            ];

            bars = monthlyTotals.map((total, index) => ({
                label: monthNames[index],
                total
            }));
        } else {
            // Show every day in the selected month, including zero-spend days.
            const dayCount = new Date(
                endDate.getFullYear(),
                endDate.getMonth(),
                0
            ).getDate();

            // For the current month, show only days up to today.
            const daysToShow = selectedPeriod === "this-month"
                ? now.getDate()
                : dayCount;

            bars = Array.from(
                { length: daysToShow },
                (_, index) => {
                    const day = index + 1;
                    const date = [
                        startDate.getFullYear(),
                        String(startDate.getMonth() + 1).padStart(2, "0"),
                        String(day).padStart(2, "0")
                    ].join("-");

                    return {
                        label: String(day),
                        total: totalsByDate.get(date) || 0
                    };
                }
            );
        }

        const maxTotal = Math.max(
            ...bars.map(bar => bar.total),
            1
        );

        const barsContainer = document.createElement("div");
        barsContainer.className = "spending-chart-bars";
        barsContainer.style.setProperty(
            "--bar-count",
            bars.length
        );

        const labelsContainer = document.createElement("div");
        labelsContainer.className = "spending-chart-labels";
        labelsContainer.style.setProperty(
            "--bar-count",
            bars.length
        );

        bars.forEach(bar => {
            const barElement = document.createElement("div");
            barElement.className = "spending-chart-bar";

            const height = bar.total === 0
                ? 0
                : Math.max((bar.total / maxTotal) * 100, 3);

            barElement.style.setProperty(
                "--bar-height",
                `${height}%`
            );

            barElement.title =
                `${bar.label}: ${new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency: "INR",
                    maximumFractionDigits: 2
                }).format(bar.total)}`;

            barElement.setAttribute(
                "aria-label",
                barElement.title
            );

            barsContainer.appendChild(barElement);

            const label = document.createElement("span");

            // Avoid cluttering the daily chart with every day label.
            if (
                selectedPeriod === "this-year" ||
                bar.label === "1" ||
                Number(bar.label) % 5 === 0 ||
                Number(bar.label) === bars.length
            ) {
                label.textContent = bar.label;
            } else {
                label.textContent = "";
                label.setAttribute("aria-hidden", "true");
            }

            labelsContainer.appendChild(label);
        });

        chart.replaceChildren(barsContainer, labelsContainer);
    } catch (error) {
        console.error("Spending chart error:", error);

        chart.replaceChildren();

        const errorMessage = document.createElement("p");
        errorMessage.className = "chart-status";
        errorMessage.textContent = error.message ||
            "Unable to load spending data.";

        chart.appendChild(errorMessage);
    }
}

const spendingPeriodSelect =
    document.getElementById("spendingPeriod");

if (spendingPeriodSelect) {
    spendingPeriodSelect.addEventListener(
        "change",
        loadDashboardSpendingChart
    );

    loadDashboardSpendingChart();
}


/* =====================================================
   REAL BUDGET SUMMARY
   ===================================================== */

async function loadDashboardBudget() {
    const spentElement = document.getElementById("budgetSpent");
    const totalElement = document.getElementById("budgetTotal");
    const noteElement = document.getElementById("budgetNote");
    const progressElement = document.getElementById("budgetProgress");
    const progressBar = document.getElementById("budgetProgressBar");

    if (
        !spentElement ||
        !totalElement ||
        !noteElement ||
        !progressElement ||
        !progressBar
    ) {
        return;
    }

    const formatCurrency = amount =>
        new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2
        }).format(Number(amount) || 0);

    try {
        const response = await fetch(`${API_BASE}/budgets/summary`, {
          credentials: "include",
        });

        
if (response.status === 401) {
  window.location.href = "login.html";
  throw new Error("Your session has expired. Please log in again.");
}

if (!response.ok) {
  throw new Error("Unable to load budget details.");
}


        const data = await response.json();

        const total = Number(data.totalBudget) || 0;
        const spent = Number(data.totalSpent) || 0;
        const remaining = Number(data.remainingBudget) || 0;
        const percentage = Number(data.percentageUsed) || 0;

        spentElement.textContent = formatCurrency(spent);
        totalElement.textContent = formatCurrency(total);

        progressBar.style.width =
            `${Math.min(Math.max(percentage, 0), 100)}%`;

        progressElement.setAttribute(
            "aria-valuenow",
            String(Math.min(Math.max(percentage, 0), 100))
        );

        if (total === 0) {
            noteElement.textContent =
                "No budget set for this month yet.";
        } else if (remaining < 0) {
            noteElement.textContent =
                `${formatCurrency(Math.abs(remaining))} over budget this month`;
        } else {
            noteElement.textContent =
                `${formatCurrency(remaining)} remaining this month`;
        }

    } catch (error) {
        console.error("Dashboard budget error:", error);
        noteElement.textContent =
            error.message || "Unable to load budget details.";
    }
}

loadDashboardBudget();


/* =====================================================
   REAL SMART FINANCIAL INSIGHT
   ===================================================== */

async function loadSmartInsight() {
    const titleElement = document.getElementById("smartInsightTitle");
    const descriptionElement = document.getElementById(
        "smartInsightDescription"
    );

    if (!titleElement || !descriptionElement) return;

    try {
        const response = await fetch(`${API_BASE}/analytics/smart-insight`, {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        });

        
if (response.status === 401) {
  window.location.href = "login.html";
  throw new Error("Your session has expired. Please log in again.");
}

if (!response.ok) {
  throw new Error("Unable to load your financial insight.");
}


        const data = await response.json();

        titleElement.textContent =
            data.title || "Your financial insight";

        descriptionElement.textContent =
            data.description || "No insight is available yet.";

    } catch (error) {
        console.error("Smart Insight loading error:", error);

        titleElement.textContent = "Financial insight unavailable";
        descriptionElement.textContent =
            error.message || "Please refresh the dashboard to try again.";
    }
}

loadSmartInsight();


/* =====================================================
   LOGOUT — INVALIDATE BACKEND SESSION
   ===================================================== */

document.addEventListener("DOMContentLoaded", () => {
    const logoutLink = document.querySelector(".nav-link.logout");

    if (!logoutLink) return;

    logoutLink.addEventListener("click", async (event) => {
        event.preventDefault();

        logoutLink.style.pointerEvents = "none";
        logoutLink.style.opacity = "0.6";

        try {
            const response = await fetch(`${API_BASE}/auth/logout`, {
              method: "POST",
              credentials: "include",
              headers: {
                Accept: "application/json",
              },
            });

            if (!response.ok) {
                throw new Error("Logout request failed.");
            }

            window.location.href = "index.html";
        } catch (error) {
            console.error("Logout error:", error);

            logoutLink.style.pointerEvents = "";
            logoutLink.style.opacity = "";

            alert("Unable to log out. Please check your connection and try again.");
        }
    });
});
