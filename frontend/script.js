const chat = document.getElementById("chat");
const input = document.getElementById("input");
const balanceEl = document.getElementById("balance");

let chart;

// 🔥 ADD MESSAGE
function addMessage(text, type) {
  const div = document.createElement("div");
  div.className = "message " + type;
  div.innerText = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

// 🔥 TYPING
function showTyping() {
  const div = document.createElement("div");
  div.className = "message bot typing";
  div.innerText = "Typing...";
  div.id = "typing";
  chat.appendChild(div);
}

function removeTyping() {
  const t = document.getElementById("typing");
  if (t) t.remove();
}

// 🔥 BALANCE ANIMATION
function animateBalance(value) {
  let current = 0;
  const step = value / 20;

  const interval = setInterval(() => {
    current += step;

    if ((step > 0 && current >= value) || (step < 0 && current <= value)) {
      current = value;
      clearInterval(interval);
    }

    balanceEl.innerText = "₹" + Math.floor(current);
  }, 20);
}

// 🔥 COLOR CHANGE
function updateBalanceColor(value) {
  if (value > 0) balanceEl.style.color = "#22c55e";
  else if (value < 0) balanceEl.style.color = "#ef4444";
  else balanceEl.style.color = "#fff";
}

// 🔥 COMMON API CALL
async function callAPI(message) {
  showTyping();

  try {
    const res = await fetch("http://localhost:3000/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message })
    });

    const data = await res.json();

    removeTyping();
    addMessage(data.reply, "bot");

    if (data.balance !== undefined) {
      animateBalance(data.balance);
      updateBalanceColor(data.balance);
    }

  } catch {
    removeTyping();
    addMessage("⚠️ Server error", "bot");
  }

  input.disabled = false;
  input.focus();
}

// 🔥 SEND
function send() {
  const text = input.value.trim();
  if (!text) return;

  addMessage(text, "user");
  input.value = "";
  input.disabled = true;

  callAPI(text);
}

// 🔥 QUICK BUTTONS

function quickIncome() {
  const amt = prompt("Enter income:");
  if (!amt) return;

  const msg = `I earned ${amt}`;
  addMessage(msg, "user");
  input.disabled = true;

  callAPI(msg);
}

function quickExpense() {
  const amt = prompt("Enter expense:");
  if (!amt) return;

  const msg = `I spent ${amt} on food`;
  addMessage(msg, "user");
  input.disabled = true;

  callAPI(msg);
}

function checkBalance() {
  const msg = "What is my balance?";
  addMessage(msg, "user");
  input.disabled = true;

  callAPI(msg);
}

// 🔥 INSIGHTS
function showInsights() {
  const msg = "Give me detailed breakdown of my expenses";
  addMessage("📊 Show my expense breakdown", "user");
  input.disabled = true;

  callAPI(msg);
}

// 🔥 📊 CHART FEATURE
function showChart() {
  addMessage("📊 Generating expense chart...", "user");

  fetch("http://localhost:3000/chart-data")
    .then(res => res.json())
    .then(data => {
      const canvas = document.getElementById("chartCanvas");
      canvas.style.display = "block";

      if (chart) chart.destroy();

      chart = new Chart(canvas, {
        type: "pie",
        data: {
          labels: data.labels,
          datasets: [{
            data: data.values
          }]
        }
      });

      addMessage("✅ Chart ready", "bot");
    })
    .catch(() => {
      addMessage("⚠️ Chart error", "bot");
    });
}

// 🔥 📅 MONTHLY REPORT
function monthlyReport() {
  addMessage("📅 Generating monthly report...", "user");

  fetch("http://localhost:3000/monthly-report")
    .then(res => res.json())
    .then(data => {
      addMessage(data.report, "bot");
    })
    .catch(() => {
      addMessage("⚠️ Error generating report", "bot");
    });
}

// 🔥 ENTER KEY
input.addEventListener("keypress", e => {
  if (e.key === "Enter") send();
});