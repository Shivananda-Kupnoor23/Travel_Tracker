const cds = require('@sap/cds');

async function askChatbot(question, db) {
  const q = question.toLowerCase().trim();
  const today = new Date().toISOString().split('T')[0];
  const future7 = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  try {
    // ===== INTENT MATCHING =====

    // Greeting
    if (/^(hi|hello|hey|good morning|good evening)/.test(q)) {
      return reply("Hello! I'm your Travel Intelligence Assistant. Ask me anything about company travel — who's travelling, where, when, department stats, and more!");
    }

    // Help
    if (/help|what can you|how to use/.test(q)) {
      return reply("You can ask me questions like:\n- Who is travelling today?\n- How many employees are abroad?\n- Which country has most travellers?\n- Show Engineering department travel\n- Who is returning today?\n- How many domestic vs international?\n- Travel stats summary\n- Who is going to Singapore?\n- Upcoming travel next week");
    }

    // === DASHBOARD STATS / SUMMARY ===
    if (/summary|stats|overview|dashboard|at a glance/.test(q)) {
      const travelling = await countQuery(db, `SELECT COUNT(*) as c FROM travel_tracker_Travels WHERE startDate <= '${today}' AND endDate >= '${today}' AND status IN ('Travelling','Approved')`);
      const upcoming = await countQuery(db, `SELECT COUNT(*) as c FROM travel_tracker_Travels WHERE startDate > '${today}' AND startDate <= '${future7}'`);
      const returning = await countQuery(db, `SELECT COUNT(*) as c FROM travel_tracker_Travels WHERE endDate = '${today}' AND status = 'Travelling'`);
      const abroad = await countQuery(db, `SELECT COUNT(*) as c FROM travel_tracker_Travels WHERE travelType = 'International' AND startDate <= '${today}' AND endDate >= '${today}' AND status IN ('Travelling','Approved')`);
      const domestic = await countQuery(db, `SELECT COUNT(*) as c FROM travel_tracker_Travels WHERE travelType = 'Domestic' AND startDate <= '${today}' AND endDate >= '${today}' AND status IN ('Travelling','Approved')`);
      return reply(`Travel Summary for today (${today}):\n- Travelling Today: ${travelling}\n- Upcoming (7 days): ${upcoming}\n- Returning Today: ${returning}\n- Currently Abroad: ${abroad}\n- Domestic Today: ${domestic}`);
    }

    // === WHO IS TRAVELLING TODAY ===
    if (/who.*(travel|going|flying).*(today|now|current)/.test(q) || /travel.*today/.test(q) || /currently travel/.test(q)) {
      const rows = await db.run(`SELECT e.name, e.department, t.toCountry, t.toCity, t.fromCity, t.travelType, t.endDate FROM travel_tracker_Travels t JOIN travel_tracker_Employees e ON t.employee_ID = e.ID WHERE t.startDate <= '${today}' AND t.endDate >= '${today}' AND t.status IN ('Travelling','Approved') ORDER BY e.name`);
      if (!rows.length) return reply("No employees are travelling today.");
      const count = rows.length;
      let answer = `${count} employee(s) are travelling today:\n\n`;
      rows.forEach((r, i) => {
        const dest = r.travelType === 'International' ? r.toCountry : `${r.fromCity} → ${r.toCity}`;
        answer += `${i + 1}. ${r.name} (${r.department}) → ${dest}, returning ${r.endDate}\n`;
      });
      return replyWithData(answer, rows);
    }

    // === RETURNING TODAY ===
    if (/return.*today|coming back|arriving today/.test(q)) {
      const rows = await db.run(`SELECT e.name, e.department, t.toCountry, t.toCity, t.travelType FROM travel_tracker_Travels t JOIN travel_tracker_Employees e ON t.employee_ID = e.ID WHERE t.endDate = '${today}' AND t.status = 'Travelling' ORDER BY e.name`);
      if (!rows.length) return reply("No employees are returning today.");
      let answer = `${rows.length} employee(s) returning today:\n\n`;
      rows.forEach((r, i) => {
        const dest = r.travelType === 'International' ? r.toCountry : r.toCity;
        answer += `${i + 1}. ${r.name} (${r.department}) from ${dest}\n`;
      });
      return replyWithData(answer, rows);
    }

    // === CURRENTLY ABROAD / OUTSIDE INDIA ===
    if (/abroad|outside india|international.*today|currently.*international/.test(q)) {
      const rows = await db.run(`SELECT e.name, e.department, t.toCountry, t.endDate FROM travel_tracker_Travels t JOIN travel_tracker_Employees e ON t.employee_ID = e.ID WHERE t.travelType = 'International' AND t.startDate <= '${today}' AND t.endDate >= '${today}' AND t.status IN ('Travelling','Approved') ORDER BY t.toCountry`);
      if (!rows.length) return reply("No employees are currently abroad.");
      // Group by country
      const byCountry = {};
      rows.forEach(r => { byCountry[r.toCountry] = (byCountry[r.toCountry] || 0) + 1; });
      let answer = `${rows.length} employee(s) currently abroad:\n\n`;
      Object.entries(byCountry).sort((a, b) => b[1] - a[1]).forEach(([c, n]) => {
        answer += `${c}: ${n} employee(s)\n`;
      });
      answer += '\nDetails:\n';
      rows.forEach((r, i) => { answer += `${i + 1}. ${r.name} (${r.department}) → ${r.toCountry}, returning ${r.endDate}\n`; });
      return replyWithData(answer, rows);
    }

    // === COUNTRY DISTRIBUTION / WHERE ARE THEY ===
    if (/where.*travel|which countr|country.*(distribution|breakdown|wise)|destination/.test(q)) {
      const rows = await db.run(`SELECT t.toCountry as country, COUNT(*) as count FROM travel_tracker_Travels t WHERE t.travelType = 'International' AND t.startDate <= '${today}' AND t.endDate >= '${today}' AND t.status IN ('Travelling','Approved') GROUP BY t.toCountry ORDER BY count DESC`);
      if (!rows.length) return reply("No international travel active right now.");
      let answer = "Country distribution of active international travel:\n\n";
      rows.forEach(r => { answer += `${r.country}: ${r.count} employee(s)\n`; });
      return replyWithData(answer, rows);
    }

    // === SPECIFIC COUNTRY ===
    const countryMatch = q.match(/(?:who.*(?:in|to|going|travelling to)|show|employees in|travel.*to)\s+(singapore|usa|uk|uae|germany|japan|australia|india|china|france|canada|brazil)/i);
    if (countryMatch) {
      const country = countryMatch[1].charAt(0).toUpperCase() + countryMatch[1].slice(1);
      const countryMap = { 'Usa': 'USA', 'Uk': 'UK', 'Uae': 'UAE' };
      const cName = countryMap[country] || country;
      const rows = await db.run(`SELECT e.name, e.department, t.startDate, t.endDate, t.purpose, t.status FROM travel_tracker_Travels t JOIN travel_tracker_Employees e ON t.employee_ID = e.ID WHERE t.toCountry = '${cName}' AND t.startDate <= '${today}' AND t.endDate >= '${today}' AND t.status IN ('Travelling','Approved') ORDER BY e.name`);
      if (!rows.length) return reply(`No employees are currently travelling to ${cName}.`);
      let answer = `${rows.length} employee(s) in ${cName}:\n\n`;
      rows.forEach((r, i) => { answer += `${i + 1}. ${r.name} (${r.department}) — ${r.startDate} to ${r.endDate} — ${r.purpose}\n`; });
      return replyWithData(answer, rows);
    }

    // === UPCOMING TRAVEL ===
    if (/upcoming|next week|next 7|travelling next|future travel/.test(q)) {
      const rows = await db.run(`SELECT e.name, e.department, t.toCountry, t.toCity, t.travelType, t.startDate, t.endDate FROM travel_tracker_Travels t JOIN travel_tracker_Employees e ON t.employee_ID = e.ID WHERE t.startDate > '${today}' AND t.startDate <= '${future7}' ORDER BY t.startDate`);
      if (!rows.length) return reply("No upcoming travel in the next 7 days.");
      let answer = `${rows.length} upcoming trip(s) in next 7 days:\n\n`;
      rows.forEach((r, i) => {
        const dest = r.travelType === 'International' ? r.toCountry : `${r.toCity}`;
        answer += `${i + 1}. ${r.name} (${r.department}) → ${dest}, ${r.startDate} to ${r.endDate}\n`;
      });
      return replyWithData(answer, rows);
    }

    // === DEPARTMENT TRAVEL ===
    const deptMatch = q.match(/(engineering|sales|hr|marketing|finance)\s*(department|dept|team)?/i);
    if (deptMatch && /travel|how many|employees|who/.test(q)) {
      const dept = deptMatch[1].charAt(0).toUpperCase() + deptMatch[1].slice(1);
      const rows = await db.run(`SELECT e.name, t.toCountry, t.toCity, t.travelType, t.startDate, t.endDate, t.status FROM travel_tracker_Travels t JOIN travel_tracker_Employees e ON t.employee_ID = e.ID WHERE e.department = '${dept}' AND t.startDate <= '${today}' AND t.endDate >= '${today}' AND t.status IN ('Travelling','Approved') ORDER BY e.name`);
      if (!rows.length) return reply(`No employees from ${dept} department are travelling today.`);
      let answer = `${rows.length} employee(s) from ${dept} travelling today:\n\n`;
      rows.forEach((r, i) => {
        const dest = r.travelType === 'International' ? r.toCountry : r.toCity;
        answer += `${i + 1}. ${r.name} → ${dest} (${r.startDate} to ${r.endDate})\n`;
      });
      return replyWithData(answer, rows);
    }

    // === DOMESTIC VS INTERNATIONAL ===
    if (/domestic.*international|international.*domestic|compare.*type|travel type|dom.*vs.*int/.test(q)) {
      const dom = await countQuery(db, `SELECT COUNT(*) as c FROM travel_tracker_Travels WHERE travelType = 'Domestic' AND startDate <= '${today}' AND endDate >= '${today}' AND status IN ('Travelling','Approved')`);
      const intl = await countQuery(db, `SELECT COUNT(*) as c FROM travel_tracker_Travels WHERE travelType = 'International' AND startDate <= '${today}' AND endDate >= '${today}' AND status IN ('Travelling','Approved')`);
      return reply(`Travel type breakdown for today:\n- Domestic: ${dom} employee(s)\n- International: ${intl} employee(s)\n- Total: ${dom + intl}`);
    }

    // === SPECIFIC EMPLOYEE ===
    const nameMatch = q.match(/(?:where is|show|travel.*of|trips.*of|about)\s+([a-z]+)/i);
    if (nameMatch && nameMatch[1].length > 2) {
      const name = nameMatch[1];
      const rows = await db.run(`SELECT e.name, t.travelType, t.toCountry, t.toCity, t.fromCity, t.startDate, t.endDate, t.status, t.purpose FROM travel_tracker_Travels t JOIN travel_tracker_Employees e ON t.employee_ID = e.ID WHERE LOWER(e.name) LIKE '%${name.toLowerCase()}%' ORDER BY t.startDate DESC`);
      if (!rows.length) return reply(`No travel records found for "${name}".`);
      let answer = `Travel history for ${rows[0].name}:\n\n`;
      rows.forEach((r, i) => {
        const dest = r.travelType === 'International' ? r.toCountry : `${r.fromCity} → ${r.toCity}`;
        answer += `${i + 1}. ${dest} — ${r.startDate} to ${r.endDate} — ${r.status} — ${r.purpose}\n`;
      });
      return replyWithData(answer, rows);
    }

    // === HOW MANY TOTAL ===
    if (/how many.*(employee|people|person|staff)|total.*employee|employee.*count/.test(q)) {
      const count = await countQuery(db, `SELECT COUNT(*) as c FROM travel_tracker_Employees`);
      return reply(`There are ${count} employees in the system.`);
    }

    // === PLANNED / PENDING APPROVAL ===
    if (/planned|pending|waiting.*approv|need.*approv/.test(q)) {
      const rows = await db.run(`SELECT e.name, e.department, t.toCountry, t.toCity, t.travelType, t.startDate, t.endDate FROM travel_tracker_Travels t JOIN travel_tracker_Employees e ON t.employee_ID = e.ID WHERE t.status = 'Planned' ORDER BY t.startDate`);
      if (!rows.length) return reply("No travel requests pending approval.");
      let answer = `${rows.length} travel request(s) pending approval:\n\n`;
      rows.forEach((r, i) => {
        const dest = r.travelType === 'International' ? r.toCountry : r.toCity;
        answer += `${i + 1}. ${r.name} (${r.department}) → ${dest}, ${r.startDate} to ${r.endDate}\n`;
      });
      return replyWithData(answer, rows);
    }

    // === CANCELLED ===
    if (/cancel/.test(q)) {
      const rows = await db.run(`SELECT e.name, e.department, t.toCountry, t.toCity, t.travelType, t.startDate, t.endDate FROM travel_tracker_Travels t JOIN travel_tracker_Employees e ON t.employee_ID = e.ID WHERE t.status = 'Cancelled' ORDER BY t.startDate DESC`);
      if (!rows.length) return reply("No cancelled travels found.");
      let answer = `${rows.length} cancelled travel(s):\n\n`;
      rows.forEach((r, i) => {
        const dest = r.travelType === 'International' ? r.toCountry : r.toCity;
        answer += `${i + 1}. ${r.name} (${r.department}) → ${dest}, ${r.startDate} to ${r.endDate}\n`;
      });
      return replyWithData(answer, rows);
    }

    // === VISA STATUS ===
    if (/visa/.test(q)) {
      const rows = await db.run(`SELECT e.name, t.toCountry, t.visaStatus, t.startDate FROM travel_tracker_Travels t JOIN travel_tracker_Employees e ON t.employee_ID = e.ID WHERE t.travelType = 'International' AND t.visaStatus IS NOT NULL AND t.visaStatus != '' ORDER BY t.visaStatus`);
      if (!rows.length) return reply("No visa information found.");
      const needVisa = rows.filter(r => r.visaStatus === 'Need Visa');
      const applied = rows.filter(r => r.visaStatus === 'Applied');
      const haveVisa = rows.filter(r => r.visaStatus === 'Have Visa');
      let answer = `Visa status breakdown:\n- Have Visa: ${haveVisa.length}\n- Applied: ${applied.length}\n- Need Visa: ${needVisa.length}\n`;
      if (needVisa.length) {
        answer += '\nEmployees needing visa:\n';
        needVisa.forEach((r, i) => { answer += `${i + 1}. ${r.name} → ${r.toCountry} (travel: ${r.startDate})\n`; });
      }
      return replyWithData(answer, rows);
    }

    // === MOST POPULAR COUNTRY ===
    if (/most popular|top country|most travel|busiest/.test(q)) {
      const rows = await db.run(`SELECT toCountry as country, COUNT(*) as count FROM travel_tracker_Travels WHERE travelType = 'International' AND toCountry IS NOT NULL GROUP BY toCountry ORDER BY count DESC LIMIT 5`);
      if (!rows.length) return reply("No international travel data found.");
      let answer = "Top travel destinations (all time):\n\n";
      rows.forEach((r, i) => { answer += `${i + 1}. ${r.country}: ${r.count} trip(s)\n`; });
      return replyWithData(answer, rows);
    }

    // === DEFAULT / UNKNOWN ===
    return reply("I'm not sure I understood that. Try asking:\n- Who is travelling today?\n- How many are abroad?\n- Country breakdown\n- Show Engineering department travel\n- Upcoming travel\n- Travel stats summary\n- Who is returning today?");

  } catch (err) {
    return { answer: `Error processing your question: ${err.message}`, data: [], sql: '', success: false };
  }
}

// Helpers
async function countQuery(db, sql) {
  const rows = await db.run(sql);
  return rows[0]?.c || 0;
}

function reply(answer) {
  return { answer, data: [], sql: '', success: true };
}

function replyWithData(answer, rows) {
  return {
    answer,
    data: rows.slice(0, 50).map(row => {
      const keys = Object.keys(row).filter(k => k !== 'password').slice(0, 6);
      const obj = {};
      keys.forEach((k, i) => { obj[`col${i + 1}`] = String(row[k] ?? ''); });
      return obj;
    }),
    sql: '',
    success: true
  };
}

module.exports = { askChatbot };
