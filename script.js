let displayStr = "";
let internalStr = "";
let memory = 0;
let lastWasEqual = false;

const displayExpr = document.getElementById("displayExpr");
const displayResult = document.getElementById("displayResult");

function updateUI() {
  displayExpr.textContent = displayStr || "0";
  if (!lastWasEqual) displayResult.textContent = "";
}

function appendToken(disp, internal) {
  if (internal === "clear") {
    displayStr = "";
    internalStr = "";
    updateUI();
    return;
  }

  // Memory keys
  if (internal === "mc") { memory = 0; return; }
  if (internal === "mr") { displayStr += memory; internalStr += memory; updateUI(); return; }
  if (internal === "mplus") { const v = evaluateInternal(); if (!isNaN(v)) memory += v; return; }
  if (internal === "mminus") { const v = evaluateInternal(); if (!isNaN(v)) memory -= v; return; }

  // Start new expression after equals
  if (lastWasEqual && /[0-9.]/.test(internal)) {
    displayStr = "";
    internalStr = "";
  }
  lastWasEqual = false;

  // Add token
  displayStr += disp;

  // Map internal symbols to JS-safe equivalents
  const map = {
    "^": "**",
    "π": "Math.PI",
    "pi": "Math.PI",
    "e": "Math.E",
    "÷": "/",
    "×": "*"
  };
  internalStr += map[internal] || internal;

  updateUI();
}

function evaluateInternal() {
  if (!internalStr) return 0;
  try {
    // Prepare safe expression
    let expr = internalStr
      .replace(/π/g, "Math.PI")
      .replace(/\bpi\b/g, "Math.PI")
      .replace(/\be\b/g, "Math.E")
      .replace(/ln\(/g, "Math.log(")
      .replace(/log10\(/g, "Math.log10(")
      .replace(/sqrt\(/g, "Math.sqrt(")
      .replace(/sin\(/g, "Math.sin(")
      .replace(/cos\(/g, "Math.cos(")
      .replace(/tan\(/g, "Math.tan(")
      .replace(/\^/g, "**");

    // Evaluate safely with factorial function allowed
    const func = new Function("fact", "with(Math){return(" + expr + ");}");
    return func(factorial);
  } catch {
    return NaN;
  }
}

function factorial(n) {
  n = Number(n);
  if (n < 0 || !Number.isFinite(n) || !Number.isInteger(n)) return NaN;
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

function computeResult() {
  if (!internalStr) return;
  const res = evaluateInternal();
  if (isNaN(res) || !isFinite(res)) {
    displayResult.textContent = "Error";
    lastWasEqual = true;
    return;
  }
  const pretty = parseFloat(res.toPrecision(12)).toString();
  displayResult.textContent = pretty;
  displayStr = pretty;
  internalStr = pretty;
  lastWasEqual = true;
}

function applyFactorial() {
  const val = evaluateInternal();
  const f = factorial(val);
  if (isNaN(f)) {
    displayResult.textContent = "Error";
    return;
  }
  const pretty = parseFloat(f.toPrecision(12)).toString();
  displayResult.textContent = pretty;
  displayStr = pretty;
  internalStr = pretty;
  lastWasEqual = true;
}

// Add event listeners for buttons
document.querySelectorAll("#keys button.key").forEach(k => {
  k.addEventListener("click", () => {
    const disp = k.getAttribute("data-display");
    const internal = k.getAttribute("data-internal");
    if (internal === "=") { computeResult(); return; }
    if (internal === "fact") { applyFactorial(); return; }
    appendToken(disp, internal);
  });
});

// Keyboard support
window.addEventListener("keydown", (e) => {
  if (e.key === "Enter") { computeResult(); e.preventDefault(); }
  if (e.key === "Backspace") {
    displayStr = displayStr.slice(0, -1);
    internalStr = internalStr.slice(0, -1);
    updateUI();
  }
  if (/^[0-9+\-*/().%]$/.test(e.key)) appendToken(e.key, e.key);
});

updateUI();
