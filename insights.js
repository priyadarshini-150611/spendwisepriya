/* SPENDWISE FINANCIAL INSIGHTS — Spring Boot integration */
const API_BASE = `${window.location.protocol}//${window.location.hostname}:8080/api`;
let expenses = [],
  income = [],
  budgets = [],
  savings = [];

async function fetchList(path) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  const data = await response.json();
  if (!Array.isArray(data)) throw new Error(`${path}: expected an array`);
  return data;
}

function amountOf(x) {
  return (
    Number(
      x?.amount ??
        x?.value ??
        x?.currentAmount ??
        x?.savedAmount ??
        x?.saved ??
        x?.spent ??
        0,
    ) || 0
  );
}
function categoryOf(x) {
  return String(x?.category ?? x?.type ?? "Other");
}
function targetOf(x) {
  return Number(x?.targetAmount ?? x?.target ?? x?.goalAmount ?? 0) || 0;
}
function savedOf(x) {
  const value =
    x?.currentAmount ??
    x?.savedAmount ??
    x?.saved ??
    x?.current ??
    x?.amountSaved ??
    x?.totalContributions;
  if (value !== undefined && value !== null) return Number(value) || 0;
  if (Array.isArray(x?.contributions))
    return x.contributions.reduce((s, c) => s + (Number(c?.amount) || 0), 0);
  return 0;
}
function goalName(x) {
  return x?.goalName ?? x?.name ?? x?.title ?? "Savings Goal";
}
function budgetLimit(x) {
  return (
    Number(
      x?.budgetLimit ??
        x?.limit ??
        x?.amount ??
        x?.monthlyLimit ??
        x?.plannedAmount ??
        0,
    ) || 0
  );
}
function dateOfExpense(x) {
  return (
    x?.expenseDate ??
    x?.date ??
    x?.transactionDate ??
    x?.createdAt ??
    x?.createdDate
  );
}
function isThisMonth(value) {
  if (!value) return false;
  const d = new Date(value),
    n = new Date();
  return (
    !Number.isNaN(d.getTime()) &&
    d.getFullYear() === n.getFullYear() &&
    d.getMonth() === n.getMonth()
  );
}
function budgetSpent(x) {
  if (x?.spent != null) return Number(x.spent) || 0;
  if (x?.totalSpent != null) return Number(x.totalSpent) || 0;
  return expenses
    .filter(
      (e) =>
        categoryOf(e) === String(x?.category ?? "Other") &&
        isThisMonth(dateOfExpense(e)),
    )
    .reduce((s, e) => s + amountOf(e), 0);
}
function formatCurrency(n) {
  return (
    "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })
  );
}
function getTotalIncome() {
  return income.reduce((s, x) => s + amountOf(x), 0);
}
function getTotalExpenses() {
  return expenses.reduce((s, x) => s + amountOf(x), 0);
}
function getTotalSavings() {
  return getTotalIncome() - getTotalExpenses();
}
function getSavingsRate() {
  const i = getTotalIncome();
  return i > 0 ? Math.max(0, (getTotalSavings() / i) * 100) : 0;
}
function getTopExpenseCategory() {
  const totals = {};
  expenses.forEach((x) => {
    const c = categoryOf(x);
    totals[c] = (totals[c] || 0) + amountOf(x);
  });
  let category = "None",
    amount = 0;
  Object.entries(totals).forEach(([c, a]) => {
    if (a > amount) {
      category = c;
      amount = a;
    }
  });
  return { category, amount };
}
function getBudgetAnalysis() {
  let totalLimit = 0,
    totalSpent = 0,
    highest = null;
  budgets.forEach((x) => {
    const limit = budgetLimit(x),
      spent = budgetSpent(x);
    totalLimit += limit;
    totalSpent += spent;
    if (!highest || spent > highest.spent)
      highest = { category: x?.category || "Other", limit, spent };
  });
  return {
    totalLimit,
    totalSpent,
    percentage: totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0,
    highest,
  };
}
function getSavingsGoalAnalysis() {
  let totalTarget = 0,
    totalSaved = 0,
    closestGoal = null,
    highestProgress = -1;
  savings.forEach((x) => {
    const target = targetOf(x),
      saved = savedOf(x);
    const progress = target > 0 ? (saved / target) * 100 : 0;
    totalTarget += target;
    totalSaved += saved;
    if (!closestGoal || progress > highestProgress) {
      highestProgress = progress;
      closestGoal = { name: goalName(x), target, saved, progress };
    }
  });
  return {
    totalTarget,
    totalSaved,
    percentage: totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0,
    closestGoal,
  };
}
function calculateHealthScore() {
  const i = getTotalIncome(),
    e = getTotalExpenses(),
    r = getSavingsRate();
  let score = 0;
  if (r >= 30) score += 40;
  else if (r >= 20) score += 35;
  else if (r >= 10) score += 25;
  else if (r > 0) score += 15;
  if (i > 0 && e < i * 0.5) score += 30;
  else if (i > 0 && e < i * 0.7) score += 25;
  else if (i > 0 && e < i) score += 15;
  const b = getBudgetAnalysis();
  if (b.totalLimit > 0) {
    if (b.percentage <= 70) score += 20;
    else if (b.percentage <= 90) score += 15;
    else if (b.percentage <= 100) score += 8;
  }
  const g = getSavingsGoalAnalysis();
  if (g.percentage >= 50) score += 10;
  else if (g.percentage >= 25) score += 7;
  else if (g.percentage > 0) score += 4;
  return Math.min(100, Math.round(score));
}
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
function updateFinancialHealth() {
  const score = calculateHealthScore();
  const msg =
    score >= 80
      ? [
          "Your financial health is excellent.",
          "You are maintaining a strong balance between income, spending and savings.",
        ]
      : score >= 60
        ? [
            "Your financial health is good.",
            "You have a healthy foundation, but there is still room to improve your savings.",
          ]
        : score >= 40
          ? [
              "Your financial health needs attention.",
              "Your spending and savings patterns could be improved with a clearer monthly plan.",
            ]
          : [
              "Your finances need improvement.",
              "Focus on reducing unnecessary expenses and building a consistent savings habit.",
            ];
  setText("healthScore", score);
  setText("financialHealthTitle", msg[0]);
  setText("financialHealthText", msg[1]);
}
function updateSummary() {
  setText("insightIncome", formatCurrency(getTotalIncome()));
  setText("insightExpenses", formatCurrency(getTotalExpenses()));
  setText("insightSavings", formatCurrency(Math.max(0, getTotalSavings())));
  setText("insightSavingsRate", Math.round(getSavingsRate()) + "%");
}
function updateSpendingInsight() {
  const total = getTotalExpenses();
  if (!total) {
    setText("spendingInsightTitle", "No spending recorded yet.");
    setText(
      "spendingInsightText",
      "Add expenses to receive personalized spending analysis.",
    );
    return;
  }
  const top = getTopExpenseCategory(),
    avg = total / expenses.length;
  setText(
    "spendingInsightTitle",
    `${top.category} is your highest spending category.`,
  );
  setText(
    "spendingInsightText",
    `You have spent ${formatCurrency(top.amount)} on ${top.category}. Your average expense transaction is ${formatCurrency(avg)}.`,
  );
}
function updateIncomeInsight() {
  const total = getTotalIncome();
  if (!total) {
    setText("incomeInsightTitle", "No income recorded yet.");
    setText(
      "incomeInsightText",
      "Add income transactions to receive personalized income analysis.",
    );
    return;
  }
  if (income.length === 1) {
    setText(
      "incomeInsightTitle",
      "Your income currently comes from one source.",
    );
    setText(
      "incomeInsightText",
      `You have recorded ${formatCurrency(total)} in income. Adding multiple income sources can give you a clearer financial picture.`,
    );
  } else {
    setText("incomeInsightTitle", "Your recorded income is diversified.");
    setText(
      "incomeInsightText",
      `You have recorded ${formatCurrency(total)} across ${income.length} income transactions, averaging ${formatCurrency(total / income.length)} per transaction.`,
    );
  }
}
function updateTopCategory() {
  const top = getTopExpenseCategory();
  setText("topInsightCategory", top.category);
  setText("topInsightCategoryAmount", `${formatCurrency(top.amount)} spent`);
}
function updateBudgetInsight() {
  const b = getBudgetAnalysis();
  if (!b.totalLimit) {
    setText(
      "budgetInsightTitle",
      "Create a budget to start tracking your spending.",
    );
    setText(
      "budgetInsightText",
      "A monthly budget will help SpendWise identify overspending and savings opportunities.",
    );
    return;
  }
  const p = Math.round(b.percentage);
  if (p > 100) {
    setText(
      "budgetInsightTitle",
      `${b.highest?.category || "Your budget"} needs attention.`,
    );
    setText(
      "budgetInsightText",
      `You have used ${p}% of your total budget. Consider reducing spending in your highest budget category.`,
    );
  } else if (p >= 80) {
    setText("budgetInsightTitle", "Your budget is getting close to its limit.");
    setText(
      "budgetInsightText",
      `You have used ${p}% of your available budget. Keep your remaining spending under control.`,
    );
  } else {
    setText("budgetInsightTitle", "Your spending is currently within budget.");
    setText(
      "budgetInsightText",
      `You have used ${p}% of your total budget, leaving room for your remaining expenses.`,
    );
  }
}
function updateSavingsInsight() {
  const g = getSavingsGoalAnalysis();
  if (!g.totalTarget) {
    setText("savingsInsightTitle", "Create a savings goal.");
    setText(
      "savingsInsightText",
      "Setting a target makes it easier to build a consistent savings habit.",
    );
    return;
  }
  const p = Math.round(g.percentage);
  if (p >= 75 && g.closestGoal) {
    setText("savingsInsightTitle", `${g.closestGoal.name} is almost complete.`);
    setText(
      "savingsInsightText",
      `Your savings goals are ${p}% funded. Keep going to reach your targets.`,
    );
  } else if (p >= 40) {
    setText("savingsInsightTitle", "Your savings goals are progressing well.");
    setText(
      "savingsInsightText",
      `You have completed ${p}% of your combined savings targets.`,
    );
  } else {
    setText("savingsInsightTitle", "Build your savings consistently.");
    setText(
      "savingsInsightText",
      `Your current savings progress is ${p}%. Consider setting aside a fixed amount after each income payment.`,
    );
  }
}
function updateRecommendation() {
  const i = getTotalIncome(),
    e = getTotalExpenses(),
    r = getSavingsRate();
  if (!i)
    setText(
      "recommendationText",
      "Start recording your income so SpendWise can provide personalized financial recommendations.",
    );
  else if (e > i)
    setText(
      "recommendationText",
      "Your expenses are higher than your income. Focus on reducing non-essential spending and review your largest expense categories.",
    );
  else if (r < 10)
    setText(
      "recommendationText",
      "Your savings rate is below 10%. Try setting a small automatic savings target each month.",
    );
  else if (r < 20)
    setText(
      "recommendationText",
      "You are saving, but increasing your savings rate toward 20% could strengthen your financial position.",
    );
  else
    setText(
      "recommendationText",
      `You are maintaining a healthy savings habit. Keep monitoring ${getTopExpenseCategory().category} spending to protect your progress.`,
    );
}
function updateSmartInsight() {
  const i = getTotalIncome(),
    e = getTotalExpenses(),
    r = getSavingsRate();
  const top = getTopExpenseCategory();
  if (!i) {
    setText(
      "mainInsightTitle",
      "Add your income to unlock financial insights.",
    );
    setText(
      "mainInsightText",
      "SpendWise needs income and expense data to analyze your financial patterns.",
    );
  } else if (e > i) {
    setText(
      "mainInsightTitle",
      "Your spending is currently higher than your income.",
    );
    setText(
      "mainInsightText",
      `Your expenses exceed your recorded income by ${formatCurrency(e - i)}. Review ${top.category} spending first.`,
    );
  } else if (r >= 30) {
    setText("mainInsightTitle", "Excellent savings performance.");
    setText(
      "mainInsightText",
      `You are saving approximately ${Math.round(r)}% of your recorded income. Keep maintaining this strong habit.`,
    );
  } else if (r >= 20) {
    setText("mainInsightTitle", "You are building a healthy savings habit.");
    setText(
      "mainInsightText",
      `Your current savings rate is ${Math.round(r)}%. Continue monitoring your ${top.category} expenses.`,
    );
  } else {
    setText(
      "mainInsightTitle",
      "There is an opportunity to improve your savings.",
    );
    setText(
      "mainInsightText",
      `Your current savings rate is ${Math.round(r)}%. Reducing ${top.category} spending could help you save more.`,
    );
  }
}
function refreshInsightDisplay() {
  updateFinancialHealth();
  updateSummary();
  updateSpendingInsight();
  updateIncomeInsight();
  updateTopCategory();
  updateBudgetInsight();
  updateSavingsInsight();
  updateRecommendation();
  updateSmartInsight();
}
function showLoadError(message) {
  let el = document.getElementById("insightsLoadError");
  if (!el) {
    el = document.createElement("p");
    el.id = "insightsLoadError";
    el.setAttribute("role", "status");
    el.style.cssText =
      "margin:12px 0;padding:10px 12px;border:1px solid #ddd;border-radius:8px;color:#555;background:#fafafa;font-size:14px;";
    (
      document.querySelector("main") ||
      document.querySelector(".main-content") ||
      document.body
    ).prepend(el);
  }
  el.textContent = message;
}
async function refreshInsights() {
  const button = document.getElementById("refreshInsights");
  if (button) {
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
  }
  try {
    const results = await Promise.allSettled([
      fetchList("/expenses"),
      fetchList("/income"),
      fetchList("/budgets"),
      fetchList("/savings-goals"),
    ]);
    const names = ["Expenses", "Income", "Budgets", "Savings goals"];
    const failures = [];
    results.forEach((r, i) => {
      if (r.status === "rejected")
        failures.push(`${names[i]}: ${r.reason.message}`);
    });
    expenses = results[0].status === "fulfilled" ? results[0].value : [];
    income = results[1].status === "fulfilled" ? results[1].value : [];
    budgets = results[2].status === "fulfilled" ? results[2].value : [];
    savings = results[3].status === "fulfilled" ? results[3].value : [];
    refreshInsightDisplay();
    if (failures.length) {
      console.error("Financial Insights API errors:", failures);
      showLoadError(
        "Some financial data could not be loaded. Check sign-in and backend status, then select Refresh.",
      );
    } else {
      const old = document.getElementById("insightsLoadError");
      if (old) old.remove();
    }
  } catch (error) {
    console.error("Financial Insights loading error:", error);
    showLoadError(
      "Unable to load Financial Insights. Check your connection and sign-in, then try Refresh.",
    );
  } finally {
    if (button) {
      button.disabled = false;
      button.removeAttribute("aria-busy");
    }
  }
}

/* MOBILE NAVIGATION */
const hamburgerBtn = document.getElementById("hamburgerBtn");
const sidebar = document.querySelector(".sidebar");
const mobileNavOverlay = document.getElementById("mobileNavOverlay");
const navLinks = document.querySelectorAll(".sidebar .nav-link");
function openMobileMenu() {
  if (!hamburgerBtn || !sidebar || !mobileNavOverlay) return;
  sidebar.classList.add("mobile-open");
  mobileNavOverlay.classList.add("active");
  document.body.classList.add("menu-open");
  hamburgerBtn.setAttribute("aria-expanded", "true");
  hamburgerBtn.setAttribute("aria-label", "Close navigation");
  hamburgerBtn.textContent = "✕";
}
function closeMobileMenu() {
  if (!hamburgerBtn || !sidebar || !mobileNavOverlay) return;
  sidebar.classList.remove("mobile-open");
  mobileNavOverlay.classList.remove("active");
  document.body.classList.remove("menu-open");
  hamburgerBtn.setAttribute("aria-expanded", "false");
  hamburgerBtn.setAttribute("aria-label", "Open navigation");
  hamburgerBtn.textContent = "☰";
}
if (hamburgerBtn && sidebar && mobileNavOverlay) {
  hamburgerBtn.addEventListener("click", () =>
    sidebar.classList.contains("mobile-open")
      ? closeMobileMenu()
      : openMobileMenu(),
  );
  mobileNavOverlay.addEventListener("click", closeMobileMenu);
  navLinks.forEach((link) => link.addEventListener("click", closeMobileMenu));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && sidebar.classList.contains("mobile-open"))
      closeMobileMenu();
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 600) closeMobileMenu();
  });
}
const refreshButton = document.getElementById("refreshInsights");
if (refreshButton) refreshButton.addEventListener("click", refreshInsights);
document.addEventListener("DOMContentLoaded", refreshInsights);
