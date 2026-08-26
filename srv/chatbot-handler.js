const cds = require('@sap/cds');

const chatHistory = [];

function getSystemPrompt() {
  const today = new Date().toISOString().split('T')[0];
  return `You are a Travel Intelligence Assistant for a company travel tracker.
You have access to a SQLite database with these tables:

TABLE: travel_tracker_Employees
Columns: ID (TEXT), name (TEXT), email (TEXT), password (TEXT), department (TEXT), manager (TEXT), role (TEXT)

TABLE: travel_tracker_Travels
Columns: ID (TEXT), employee_ID (TEXT FK to Employees.ID), travelType (TEXT: 'Domestic'|'International'), fromCountry (TEXT), toCountry (TEXT), fromCity (TEXT), toCity (TEXT), startDate (TEXT 'YYYY-MM-DD'), endDate (TEXT 'YYYY-MM-DD'), purpose (TEXT), status (TEXT: 'Planned'|'Approved'|'Travelling'|'Completed'|'Cancelled'), passportNumber (TEXT), visaStatus (TEXT)

Today's date: ${today}

RULES:
1. Generate ONLY valid SQLite SELECT queries. Never INSERT/UPDATE/DELETE/DROP.
2. JOIN using: travel_tracker_Travels.employee_ID = travel_tracker_Employees.ID
3. "travelling today": startDate <= '${today}' AND endDate >= '${today}' AND status IN ('Travelling','Approved')
4. "abroad"/"outside India": travelType='International' AND currently travelling
5. "returning today": endDate = '${today}'
6. "upcoming": startDate > '${today}' AND startDate <= date('${today}','+7 days')
7. Use exact table names: travel_tracker_Employees, travel_tracker_Travels
8. Never expose password field in results.
9. If not about travel, say: "I can only answer questions about company travel data."

Respond in this JSON format:
{"sql": "YOUR SELECT QUERY", "explanation": "Brief explanation"}

If no SQL needed (greeting/non-travel): {"sql": "", "explanation": "Your response"}`;
}

async function askChatbot(question, db) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return {
      answer: 'Chatbot is not configured. Set OPENAI_API_KEY environment variable.',
      data: [], sql: '', success: false
    };
  }

  try {
    // Build messages with history
    const messages = [{ role: 'system', content: getSystemPrompt() }];
    for (const entry of chatHistory.slice(-8)) {
      messages.push({ role: 'user', content: entry.question });
      messages.push({ role: 'assistant', content: entry.rawResponse });
    }
    messages.push({ role: 'user', content: question });

    // Call OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0,
        max_tokens: 1000
      })
    });

    const result = await response.json();
    if (!result.choices || !result.choices[0]) {
      return { answer: 'No response from AI service.', data: [], sql: '', success: false };
    }

    const rawResponse = result.choices[0].message.content.trim();
    const parsed = parseResponse(rawResponse);
    const sql = parsed.sql || '';
    const explanation = parsed.explanation || '';

    if (!sql) {
      chatHistory.push({ question, rawResponse });
      return { answer: explanation, data: [], sql: '', success: true };
    }

    // Validate SQL safety
    const sqlUpper = sql.toUpperCase().trim();
    if (!sqlUpper.startsWith('SELECT')) {
      return { answer: 'I can only run read-only queries.', data: [], sql: '', success: false };
    }
    const forbidden = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'CREATE', 'TRUNCATE'];
    for (const word of forbidden) {
      if (sqlUpper.includes(word)) {
        return { answer: `Forbidden operation: ${word}`, data: [], sql: '', success: false };
      }
    }

    // Execute SQL
    const rows = await db.run(sql);
    const data = Array.isArray(rows) ? rows : [];

    // Format answer
    const answer = await formatAnswer(question, sql, data, apiKey);

    chatHistory.push({ question, rawResponse });
    return {
      answer,
      data: data.slice(0, 50).map(row => {
        const keys = Object.keys(row).filter(k => k !== 'password').slice(0, 6);
        const obj = {};
        keys.forEach((k, i) => { obj[`col${i + 1}`] = String(row[k] ?? ''); });
        return obj;
      }),
      sql,
      success: true
    };

  } catch (err) {
    return {
      answer: `Error: ${err.message}. Please try again.`,
      data: [], sql: '', success: false
    };
  }
}

function parseResponse(raw) {
  try { return JSON.parse(raw); } catch {}

  const jsonMatch = raw.match(/```(?:json)?\s*(\{.*?\})\s*```/s);
  if (jsonMatch) {
    try { return JSON.parse(jsonMatch[1]); } catch {}
  }

  const objMatch = raw.match(/\{[^{}]*"sql"[^{}]*\}/s);
  if (objMatch) {
    try { return JSON.parse(objMatch[0]); } catch {}
  }

  return { sql: '', explanation: raw };
}

async function formatAnswer(question, sql, data, apiKey) {
  if (!data.length) return 'No records found matching your query.';

  const dataStr = JSON.stringify(data.slice(0, 15), null, 2)
    .replace(/"password":\s*"[^"]*",?\s*/g, '');

  const prompt = `Question: ${question}
SQL: ${sql}
Results (${data.length} rows, showing first ${Math.min(15, data.length)}):
${dataStr}

Give a clear, concise natural language answer. Start with the direct answer (e.g., "12 employees are travelling today"). Summarize key points. Do NOT include SQL. Do NOT use markdown.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You summarize travel data clearly and concisely.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 500
    })
  });

  const result = await response.json();
  return result.choices?.[0]?.message?.content?.trim() || 'Here are the results.';
}

module.exports = { askChatbot };
