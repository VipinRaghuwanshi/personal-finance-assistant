import express from 'express';
import cors from 'cors';
import Groq from 'groq-sdk';

const app = express();
app.use(express.json());
app.use(cors());

const expenseDB = [];
const incomeDB = [];

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// 🔥 MAIN CHAT API
app.post('/chat', async (req, res) => {
  const userMsg = req.body.message;

  const messages = [
    {
      role: 'system',
      content: `You are Josh, a smart personal finance assistant.
You help users manage expenses, income, balance, insights and affordability.
IMPORTANT:
- If user says "earned" → call addIncome
- If user says "spent" → call addExpense
- Always use tools for calculation`
    },
    {
      role: 'user',
      content: userMsg
    }
  ];

  while (true) {
    const completion = await groq.chat.completions.create({
      messages,
      model: 'llama-3.3-70b-versatile',
      tools: [
        {
          type: 'function',
          function: {
            name: 'addExpense',
            parameters: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                amount: { type: 'number' },
              },
              required: ['name', 'amount'],
            },
          },
        },
        {
          type: 'function',
          function: {
            name: 'addIncome',
            parameters: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                amount: { type: 'number' },
              },
              required: ['name', 'amount'],
            },
          },
        },
        {
          type: 'function',
          function: { name: 'getMoneyBalance' },
        },
        {
          type: 'function',
          function: { name: 'getInsights' },
        },
        {
          type: 'function',
          function: {
            name: 'canAfford',
            parameters: {
              type: 'object',
              properties: {
                price: { type: 'number' },
              },
              required: ['price'],
            },
          },
        },
      ],
    });

    const msg = completion.choices[0].message;
    messages.push(msg);

    if (!msg.tool_calls) {
      const balance = getBalance();
      return res.json({
        reply: msg.content,
        balance
      });
    }

    for (const tool of msg.tool_calls) {
      const name = tool.function.name;
      const args = JSON.parse(tool.function.arguments || '{}');

      let result = '';

      if (name === 'addExpense') result = addExpense(args);
      if (name === 'addIncome') result = addIncome(args);
      if (name === 'getMoneyBalance') result = getMoneyBalance();
      if (name === 'getInsights') result = getInsights();
      if (name === 'canAfford') result = canAfford(args);

      messages.push({
        role: 'tool',
        tool_call_id: tool.id,
        content: result,
      });
    }
  }
});

// 🔥 FUNCTIONS (same tera logic)

function addExpense({ name, amount }) {
  if (!amount || isNaN(amount)) return "Invalid expense";
  expenseDB.push({ name, amount: Number(amount) });
  return "✅ Expense added";
}

function addIncome({ name, amount }) {
  if (!amount || isNaN(amount)) return "Invalid income";
  incomeDB.push({ name, amount: Number(amount) });
  return "💰 Income added";
}

function getMoneyBalance() {
  return `💰 Balance: ${getBalance()} INR`;
}

function getBalance() {
  const income = incomeDB.reduce((a, i) => a + i.amount, 0);
  const expense = expenseDB.reduce((a, e) => a + e.amount, 0);
  return income - expense;
}

function getInsights() {
  const totalExpense = expenseDB.reduce((a, e) => a + e.amount, 0);
  return totalExpense === 0
    ? "No expenses yet."
    : `📊 Total spent: ${totalExpense} INR`;
}

function canAfford({ price }) {
  const balance = getBalance();
  return balance >= price
    ? `✅ You can afford it`
    : `❌ Need ${price - balance} more`;
}

// 🔥 START SERVER
app.listen(3000, () => {
  console.log("🔥 Server running on http://localhost:3000");
});