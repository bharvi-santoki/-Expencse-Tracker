// ─────────────────────────────────────────────
//   EXPENSE TRACKER — script.js
//   Features: Add / Delete / Filter / localStorage
// ─────────────────────────────────────────────

// ── CATEGORY EMOJI MAP ──
const CATEGORY_ICONS = {
  Food:          "🍔",
  Transport:     "🚗",
  Shopping:      "🛍",
  Health:        "💊",
  Entertainment: "🎮",
  Education:     "📚",
  Salary:        "💼",
  Other:         "📦"
};

// ── STATE ──
let transactions = [];        // master array
let selectedType = "expense"; // "income" or "expense"

// ── DOM REFS ──
const descInput       = document.getElementById("description");
const amountInput     = document.getElementById("amount");
const categorySelect  = document.getElementById("category");
const dateInput       = document.getElementById("date");
const addBtn          = document.getElementById("add-btn");
const formError       = document.getElementById("form-error");

const btnExpense      = document.getElementById("btn-expense");
const btnIncome       = document.getElementById("btn-income");

const filterCategory  = document.getElementById("filter-category");
const filterType      = document.getElementById("filter-type");
const clearAllBtn     = document.getElementById("clear-all-btn");

const transactionList = document.getElementById("transaction-list");
const emptyState      = document.getElementById("empty-state");

const balanceEl       = document.getElementById("balance");
const totalIncomeEl   = document.getElementById("total-income");
const totalExpenseEl  = document.getElementById("total-expense");

// ── INIT ──
function init() {
  // Set today's date as default
  dateInput.value = getTodayDate();

  // Load saved transactions from localStorage
  const saved = localStorage.getItem("spendly_transactions");
  if (saved) {
    transactions = JSON.parse(saved);
  }

  render();
}

// ── HELPERS ──
function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatAmount(amount) {
  return "₹" + parseFloat(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function saveToStorage() {
  localStorage.setItem("spendly_transactions", JSON.stringify(transactions));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// ── TYPE TOGGLE ──
btnExpense.addEventListener("click", () => {
  selectedType = "expense";
  btnExpense.classList.add("active");
  btnIncome.classList.remove("active");
});

btnIncome.addEventListener("click", () => {
  selectedType = "income";
  btnIncome.classList.add("active");
  btnExpense.classList.remove("active");
});

// ── ADD TRANSACTION ──
addBtn.addEventListener("click", () => {
  const desc     = descInput.value.trim();
  const amount   = parseFloat(amountInput.value);
  const category = categorySelect.value;
  const date     = dateInput.value || getTodayDate();

  // Validation
  if (!desc) {
    showError("Please enter a description.");
    descInput.focus();
    return;
  }
  if (!amountInput.value || isNaN(amount) || amount <= 0) {
    showError("Please enter a valid amount greater than 0.");
    amountInput.focus();
    return;
  }

  clearError();

  const newTransaction = {
    id:       generateId(),
    desc:     desc,
    amount:   amount,
    type:     selectedType,
    category: category,
    date:     date
  };

  transactions.unshift(newTransaction); // add to beginning
  saveToStorage();
  render();
  resetForm();
});

// ── DELETE TRANSACTION ──
function deleteTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  saveToStorage();
  render();
}

// ── CLEAR ALL ──
clearAllBtn.addEventListener("click", () => {
  if (transactions.length === 0) return;
  const confirmed = confirm("Delete ALL transactions? This cannot be undone.");
  if (confirmed) {
    transactions = [];
    saveToStorage();
    render();
  }
});

// ── FILTER ──
filterCategory.addEventListener("change", render);
filterType.addEventListener("change", render);

function getFilteredTransactions() {
  const cat  = filterCategory.value;
  const type = filterType.value;

  return transactions.filter(t => {
    const catMatch  = cat  === "All" || t.category === cat;
    const typeMatch = type === "All" || t.type === type;
    return catMatch && typeMatch;
  });
}

// ── RENDER ──
function render() {
  updateSummary();
  renderList();
}

function updateSummary() {
  const totalIncome  = transactions.filter(t => t.type === "income")
                                   .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === "expense")
                                   .reduce((sum, t) => sum + t.amount, 0);
  const balance      = totalIncome - totalExpense;

  balanceEl.textContent      = formatAmount(balance);
  totalIncomeEl.textContent  = formatAmount(totalIncome);
  totalExpenseEl.textContent = formatAmount(totalExpense);

  // Color balance based on positive/negative
  balanceEl.style.color =
    balance > 0  ? "var(--accent-mint)"  :
    balance < 0  ? "var(--accent-coral)" :
                   "var(--accent-blue)";
}

function renderList() {
  const filtered = getFilteredTransactions();

  // Clear old items (but keep empty-state div)
  const oldItems = transactionList.querySelectorAll(".transaction-item");
  oldItems.forEach(el => el.remove());

  if (filtered.length === 0) {
    emptyState.style.display = "flex";
    return;
  }

  emptyState.style.display = "none";

  filtered.forEach(t => {
    const item = createTransactionElement(t);
    transactionList.appendChild(item);
  });
}

function createTransactionElement(t) {
  const item = document.createElement("div");
  item.classList.add("transaction-item");
  item.dataset.id = t.id;

  const icon    = CATEGORY_ICONS[t.category] || "📦";
  const sign    = t.type === "income" ? "+" : "−";
  const typeClass = t.type; // "income" or "expense"

  item.innerHTML = `
    <div class="t-icon ${typeClass}">${icon}</div>
    <div class="t-info">
      <div class="t-desc">${escapeHTML(t.desc)}</div>
      <div class="t-meta">${t.category} &bull; ${formatDate(t.date)}</div>
    </div>
    <div class="t-right">
      <span class="t-amount ${typeClass}">${sign}${formatAmount(t.amount)}</span>
      <button class="t-delete" title="Delete" data-id="${t.id}">✕</button>
    </div>
  `;

  // Delete button listener
  item.querySelector(".t-delete").addEventListener("click", () => {
    deleteTransaction(t.id);
  });

  return item;
}

// ── FORM HELPERS ──
function resetForm() {
  descInput.value    = "";
  amountInput.value  = "";
  categorySelect.selectedIndex = 0;
  dateInput.value    = getTodayDate();
}

function showError(msg) {
  formError.textContent = msg;
}

function clearError() {
  formError.textContent = "";
}

// Clear error when user starts typing
descInput.addEventListener("input",   clearError);
amountInput.addEventListener("input", clearError);

// Allow Enter key in inputs to submit
descInput.addEventListener("keydown", e => {
  if (e.key === "Enter") amountInput.focus();
});
amountInput.addEventListener("keydown", e => {
  if (e.key === "Enter") addBtn.click();
});

// ── SECURITY: Escape HTML ──
function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ── START ──
init();
