# Travel Tracker — Implementation Plan

## Context
Build a company **Travel Intelligence System** where N employees enter travel plans and Admin (HR role) gets a real-time intelligence dashboard showing company-wide travel picture.

- **Frontend:** SAP Fiori / SAPUI5 (Freestyle)
- **Backend:** SAP CAP (Cloud Application Programming Model) — Node.js runtime
- **Database:** SQLite (local development)
- **OData Version:** V4

---

## Roles

| Role       | Who               | What they can do                                  |
|------------|-------------------|---------------------------------------------------|
| **Employee** | N number of users | Submit travel, view/edit own trips, cancel own travel |
| **Admin**    | HR team           | Full dashboard, approve/reject travel, view all employees, filters, reports, world map, calendar |

---

## Travel Type: Domestic vs International

When employee creates a travel, they first select **travel type**:

```
Travel Type:  ( ) Domestic    ( ) International
```

### On selecting Domestic:
- From State / City fields appear
- To State / City fields appear
- Country is auto-set to "India"
- No visa/passport fields needed

### On selecting International:
- From Country field appears (default: India)
- To Country dropdown appears (all countries)
- Passport Number field appears
- Visa Status field appears (Have Visa / Need Visa / Applied)

This changes what data is captured and how the dashboard groups it.

---

## Project Structure

```
Travel_Tracker/
├── app/
│   ├── employee-travel/
│   │   ├── webapp/
│   │   │   ├── controller/
│   │   │   │   ├── App.controller.js
│   │   │   │   ├── TravelList.controller.js
│   │   │   │   └── TravelDetail.controller.js
│   │   │   ├── view/
│   │   │   │   ├── App.view.xml
│   │   │   │   ├── TravelList.view.xml
│   │   │   │   └── TravelDetail.view.xml
│   │   │   ├── i18n/
│   │   │   │   └── i18n.properties
│   │   │   ├── Component.js
│   │   │   ├── manifest.json
│   │   │   └── index.html
│   │   ├── package.json
│   │   └── ui5.yaml
│   │
│   ├── admin-dashboard/
│   │   ├── webapp/
│   │   │   ├── controller/
│   │   │   │   ├── App.controller.js
│   │   │   │   ├── Dashboard.controller.js
│   │   │   │   ├── CountryDetail.controller.js
│   │   │   │   └── Chatbot.controller.js
│   │   │   ├── view/
│   │   │   │   ├── App.view.xml
│   │   │   │   ├── Dashboard.view.xml
│   │   │   │   └── CountryDetail.view.xml
│   │   │   ├── fragment/
│   │   │   │   ├── SummaryCards.fragment.xml
│   │   │   │   ├── CountryChart.fragment.xml
│   │   │   │   ├── TravelTable.fragment.xml
│   │   │   │   ├── CalendarView.fragment.xml
│   │   │   │   ├── WorldMap.fragment.xml
│   │   │   │   └── Chatbot.fragment.xml
│   │   │   ├── i18n/
│   │   │   │   └── i18n.properties
│   │   │   ├── Component.js
│   │   │   ├── manifest.json
│   │   │   └── index.html
│   │   ├── package.json
│   │   └── ui5.yaml
│   │
│   └── index.html              # Fiori Launchpad
│
├── db/
│   ├── schema.cds              # CDS Data Model
│   └── data/
│       ├── travel.tracker-Employees.csv
│       └── travel.tracker-Travels.csv
│
├── srv/
│   ├── travel-service.cds      # OData Service Definition
│   └── travel-service.js       # Custom Service Handlers
│
├── chatbot/                    # Python RAG Chatbot (separate service)
│   ├── app.py                  # Flask API server
│   ├── rag_engine.py           # RAG engine — LLM + SQL generation
│   ├── db_connector.py         # Connects to CAP's SQLite DB
│   ├── prompt_templates.py     # System prompts for LLM
│   ├── requirements.txt        # Python dependencies
│   └── .env                    # API keys (OpenAI/Claude)
│
├── package.json
└── .cdsrc.json
```

---

## Step 1: Project Initialization

- Run `cds init` to scaffold the CAP project
- Install dependencies: `@sap/cds`, `express`, `sqlite3`
- Configure `.cdsrc.json` for SQLite
- Set up Python virtual environment for chatbot: `python -m venv chatbot/venv`
- Install Python deps: `pip install flask flask-cors openai langchain langchain-community sqlite3`

---

## Step 2: Data Model (`db/schema.cds`)

### Employees
| Field      | Type        | Notes                            |
|------------|-------------|----------------------------------|
| ID         | UUID        | Auto-generated (cuid)            |
| name       | String(100) | Employee full name               |
| email      | String(100) | Email address                    |
| department | String(50)  | Engineering, Sales, HR, etc.     |
| manager    | String(100) | Manager name                     |
| role       | String(20)  | **employee** or **admin**        |
| travels    | Composition | One-to-many with Travels         |

### Travels
| Field          | Type        | Notes                                                    |
|----------------|-------------|----------------------------------------------------------|
| ID             | UUID        | Auto-generated (cuid)                                    |
| employee       | Association | Links to Employees                                       |
| travelType     | String(20)  | **Domestic** or **International**                        |
| fromCountry    | String(100) | Origin country (International) or "India" (Domestic)     |
| toCountry      | String(100) | Destination country (International) or "India" (Domestic)|
| fromCity       | String(100) | Origin city/state (Domestic)                             |
| toCity         | String(100) | Destination city/state (Domestic)                        |
| startDate      | Date        | Travel start date                                        |
| endDate        | Date        | Travel end date                                          |
| purpose        | String(500) | Business meeting, Conference, Training, etc.             |
| status         | String(20)  | Planned / Approved / Travelling / Completed / Cancelled  |
| passportNumber | String(50)  | Only for International travel                            |
| visaStatus     | String(20)  | Have Visa / Need Visa / Applied (International only)     |

---

## Step 3: OData Service (`srv/travel-service.cds`)

### Standard CRUD
- `Employees` — full CRUD
- `Travels` — full CRUD

### Custom Functions (Dashboard Data)

| Function                      | Returns                          | Purpose                                  |
|-------------------------------|----------------------------------|------------------------------------------|
| `getDashboardStats()`         | Object with all counts           | At-a-glance summary numbers              |
| `getTravellingToday()`        | Array of Travels + Employee      | Table data for currently travelling      |
| `getCountryDistribution()`    | Array of {country, count}        | Chart data for country bar chart         |
| `getUpcomingTravel()`         | Array of Travels + Employee      | Upcoming 7 days table                    |
| `getCurrentlyAbroad()`        | Array of Travels + Employee      | Currently abroad table                   |
| `getReturningToday()`         | Array of Travels + Employee      | Returning today table                    |
| `getDomesticTravelStats()`    | Object with domestic counts      | Domestic travel summary                  |
| `getCalendarData(year, month)`| Array of {date, travelling, returning, departing} | Calendar day-wise data |

### Chatbot API (Python Flask — separate service on port 5000)

The CAP frontend calls the Python chatbot API. Not limited to predefined questions — Admin can ask **anything** about travel data.

| Endpoint              | Method | Input                    | Returns                              |
|-----------------------|--------|--------------------------|--------------------------------------|
| `/api/chat`           | POST   | `{ "question": "..." }` | `{ "answer": "...", "data": [...], "sql": "..." }` |
| `/api/chat/history`   | GET    | —                        | Chat history for session             |
| `/api/chat/clear`     | POST   | —                        | Clear chat history                   |

### Custom Actions (Admin)
| Action                    | Input      | Purpose                    |
|---------------------------|------------|----------------------------|
| `approveTravel(travelId)` | Travel ID  | Admin approves travel      |
| `rejectTravel(travelId)`  | Travel ID  | Admin rejects travel       |
| `cancelTravel(travelId)`  | Travel ID  | Cancel a travel            |

---

## Step 4: Service Handlers (`srv/travel-service.js`)

Key logic:

1. **getDashboardStats** — Returns:
   - `travellingToday` — Count where `startDate <= today AND endDate >= today`
   - `upcoming7Days` — Count where `startDate` within next 7 days
   - `returningToday` — Count where `endDate = today`
   - `abroadNow` — Count where international + active today
   - `countriesCount` — Distinct `toCountry` for active travels
   - `domesticToday` — Count of active domestic travels
   - `internationalToday` — Count of active international travels

2. **getTravellingToday** — All travels active today with employee details
3. **getCountryDistribution** — Group by `toCountry`, count per country (international travels)
4. **getUpcomingTravel** — Travels starting in next 7 days
5. **getCurrentlyAbroad** — International travels where `startDate <= today AND endDate >= today`
6. **getReturningToday** — Travels where `endDate = today`
7. **getDomesticTravelStats** — Domestic travel grouped by city
8. **getCalendarData** — For each day in given month, count travelling/returning/departing
9. **Auto-status update** — On READ:
   - "Approved" -> "Travelling" if `startDate <= today`
   - "Travelling" -> "Completed" if `endDate < today`
10. **Approval actions** — Validate status before changing

---

## Step 4B: Python RAG Chatbot (`chatbot/`)

A full AI-powered chatbot where Admin can ask **ANY** question about travel data in natural language. Not limited to predefined intents — the LLM understands the question, generates SQL, queries the database, and returns a human-readable answer.

### Architecture:

```
Admin types ANY question (natural language)
       |
       v
  SAPUI5 Chat UI  --->  POST /api/chat  --->  Python Flask (port 5000)
                                                      |
                                                      v
                                               rag_engine.py
                                                      |
                                          +-----------+-----------+
                                          |                       |
                                          v                       v
                                   prompt_templates.py     db_connector.py
                                   (System prompt with      (Connects to CAP's
                                    DB schema + rules)       SQLite DB)
                                          |                       |
                                          v                       |
                                     LLM API Call                 |
                                     (OpenAI / Claude)            |
                                          |                       |
                                          v                       |
                                    Generated SQL query           |
                                          |                       |
                                          +--------> Execute ---->+
                                                                  |
                                                                  v
                                                           Query Results
                                                                  |
                                                                  v
                                                       LLM formats answer
                                                       (natural language +
                                                        structured data)
                                                                  |
                                                                  v
                                                       JSON Response to UI
```

### File-by-File Breakdown:

#### `chatbot/prompt_templates.py`
Contains the system prompt that tells the LLM:
- The database schema (Employees table, Travels table, columns, types)
- Today's date (injected dynamically)
- Rules for generating SQL (use SQLite syntax, table names, column names)
- How to format the response (answer text + data array)
- Example question-SQL pairs for guidance

```python
SYSTEM_PROMPT = """
You are a Travel Intelligence Assistant for a company travel tracker.
You have access to a SQLite database with these tables:

Table: travel_tracker_Employees
Columns: ID, name, email, department, manager, role

Table: travel_tracker_Travels
Columns: ID, employee_ID, travelType, fromCountry, toCountry,
         fromCity, toCity, startDate, endDate, purpose, status,
         passportNumber, visaStatus

Today's date: {today}

Rules:
- Generate valid SQLite SQL queries to answer the user's question
- For "travelling today": startDate <= '{today}' AND endDate >= '{today}'
- For "abroad/outside India": travelType = 'International' AND active today
- For "returning today": endDate = '{today}'
- For "upcoming": startDate > '{today}' AND startDate <= date('{today}', '+7 days')
- JOIN Employees and Travels on employee_ID = Employees.ID
- Always return the SQL you used and a natural language answer
- If the question is not about travel data, politely redirect
...
"""
```

#### `chatbot/db_connector.py`
- Connects to the same SQLite DB file that CAP uses (`db.sqlite` in project root)
- Executes the LLM-generated SQL safely (read-only, SELECT only)
- Returns results as list of dicts

```python
class TravelDB:
    def __init__(self, db_path):
        self.db_path = db_path

    def execute_query(self, sql):
        # Validate: only SELECT allowed (no INSERT/UPDATE/DELETE)
        # Execute against SQLite
        # Return rows as list of dicts

    def get_schema(self):
        # Returns table schemas for the LLM prompt
```

#### `chatbot/rag_engine.py`
- Takes user question + chat history
- Builds prompt with schema context + conversation history
- Calls LLM API (OpenAI GPT-4 or Claude)
- Extracts SQL from LLM response
- Executes SQL via db_connector
- Sends results back to LLM to format natural language answer
- Returns final response

```python
class TravelRAGEngine:
    def __init__(self, db_path, api_key):
        self.db = TravelDB(db_path)
        self.client = OpenAI(api_key=api_key)  # or Anthropic
        self.chat_history = []

    def ask(self, question):
        # Step 1: Build prompt with schema + history + question
        # Step 2: Call LLM -> get SQL query
        # Step 3: Execute SQL -> get data
        # Step 4: Send data back to LLM -> get formatted answer
        # Step 5: Return { answer, data, sql }
```

#### `chatbot/app.py`
- Flask API server running on port 5000
- CORS enabled (so SAPUI5 app on port 4004 can call it)
- Endpoints:

```python
@app.route('/api/chat', methods=['POST'])
def chat():
    question = request.json['question']
    response = rag_engine.ask(question)
    return jsonify(response)

@app.route('/api/chat/history', methods=['GET'])
def get_history():
    return jsonify(rag_engine.chat_history)

@app.route('/api/chat/clear', methods=['POST'])
def clear_history():
    rag_engine.chat_history = []
    return jsonify({"status": "cleared"})
```

#### `chatbot/requirements.txt`
```
flask==3.0.0
flask-cors==4.0.0
openai==1.40.0
python-dotenv==1.0.0
```

#### `chatbot/.env`
```
OPENAI_API_KEY=sk-your-key-here
# Or for Claude:
# ANTHROPIC_API_KEY=sk-ant-your-key-here
LLM_PROVIDER=openai
DB_PATH=../db.sqlite
```

### What Admin Can Ask (ANY question, not limited):

```
"Who is travelling today?"
"Where are they travelling?"
"Who is travelling next week?"
"Who is currently outside India?"
"Who is returning today?"
"How many from Engineering are travelling?"
"Show me Singapore travellers"
"Which department has the most travel this month?"
"Who has been travelling the longest?"
"List all cancelled travels"
"How many people need visas?"
"Who is Rahul's manager and where is Rahul travelling?"
"Compare domestic vs international travel this month"
"Which country is most popular for travel?"
"Show me all travels in September 2026"
"Who is travelling to USA next month?"
"How many employees have travelled more than 3 times?"
"What is the average travel duration?"
"List employees who are both abroad and returning this week"
"Show travel purpose breakdown"
... literally ANY question about the travel data
```

### Chatbot UI (on Admin Dashboard):

```
+--------------------------------------------------+
|  Floating chat icon (bottom-right)            [?] |
+--------------------------------------------------+

On click, opens full chat panel:

+--------------------------------------------------+
|  Travel Intelligence Bot                     [x]  |
+--------------------------------------------------+
|                                                   |
|  Bot: Hi! I'm your Travel Intelligence Assistant. |
|       Ask me anything about company travel.       |
|       I can answer questions like:                |
|       - Who is travelling today?                  |
|       - Which department travels the most?        |
|       - Compare domestic vs international travel  |
|       - Show travels for September 2026           |
|       Or ask me anything else!                    |
|                                                   |
|  [Who is travelling today?]  [Currently abroad?]  |
|  [Returning today?]  [Country breakdown]          |
|                                                   |
|  You: How many from Engineering are in Singapore? |
|                                                   |
|  Bot: 2 employees from the Engineering department |
|       are currently in Singapore:                 |
|                                                   |
|       Name     Start      Return                  |
|       --------+-----------+--------               |
|       Rahul    20-Aug      30-Aug                  |
|       Arun     25-Aug      05-Sep                  |
|                                                   |
|  You: What about Sales department abroad?         |
|                                                   |
|  Bot: 3 Sales employees are currently abroad:     |
|       - Priya in USA (returning 02-Sep)           |
|       - Kiran in UAE (returning 28-Aug)            |
|       - Neha in UK (returning 01-Sep)             |
|                                                   |
|  You: Which country has most travellers?          |
|                                                   |
|  Bot: Singapore has the most travellers with 5    |
|       employees, followed by USA (3), UK (2),     |
|       and UAE (2).                                |
|                                                   |
|  You: Average travel duration this month?         |
|                                                   |
|  Bot: The average travel duration for August 2026 |
|       is 8.5 days. International trips average    |
|       10.2 days while domestic trips average      |
|       4.3 days.                                   |
|                                                   |
|  +----------------------------------------------+|
|  | Ask anything about travel...           [Send] ||
|  +----------------------------------------------+|
+--------------------------------------------------+
```

### SAPUI5 Components for Chatbot:
- `sap.m.Popover` or `sap.m.ResponsivePopover` — chat panel
- `sap.m.FeedInput` — message input box
- `sap.m.FeedListItem` — chat message bubbles (bot vs user styling)
- `sap.m.List` — scrollable chat message history
- `sap.m.Button` — floating chat trigger button (bottom-right, icon: "sap-icon://da")
- `sap.m.FormattedText` — for bot responses with tables/formatting
- `sap.m.Token` / `sap.m.FlexBox` — suggestion chips (clickable quick questions)
- Chat panel calls Python API at `http://localhost:5000/api/chat` via `jQuery.ajax`

### Conversation Memory:
- The chatbot maintains **chat history** so follow-up questions work:
  - "Who is in Singapore?" -> answers
  - "What about USA?" -> understands context, shows USA travellers
  - "Compare these two" -> compares Singapore vs USA
- History sent to LLM on each call for context
- "Clear chat" button to reset conversation

---

## Step 5: Seed Data (`db/data/*.csv`)

- **15 employees** across 5 departments (Engineering, Sales, HR, Marketing, Finance)
  - 2 admins, 13 employees
- **30 travel records** with dates around 2026-08-25:
  - Mix of **Domestic** and **International** travels
  - 12 active today (travelling now)
  - 4 returning today
  - 8 upcoming (next 7 days)
  - 6 completed (past)
  - International countries: Singapore, USA, UK, UAE, Germany, Japan, Australia
  - Domestic cities: Mumbai, Bangalore, Chennai, Hyderabad, Delhi, Pune, Kolkata

---

## Step 6: Employee Travel App

### What the employee sees:

**Travel List View:**
```
+-------------------------------------------+
|  My Travel                        [+ Add] |
+-------------------------------------------+
|                                           |
|  CURRENT TRIPS                            |
|  +-------------------------------------+ |
|  | [INTL] Singapore  25-Aug -> 02-Sep   | |
|  | Status: Travelling  (orange)         | |
|  +-------------------------------------+ |
|  | [DOM]  Mumbai -> Bangalore           | |
|  | 23-Aug -> 26-Aug  Travelling (orange)| |
|  +-------------------------------------+ |
|                                           |
|  UPCOMING TRIPS                           |
|  +-------------------------------------+ |
|  | [INTL] Germany  01-Sep -> 10-Sep     | |
|  | Status: Approved  (green)            | |
|  +-------------------------------------+ |
|                                           |
|  PAST TRIPS                              |
|  +-------------------------------------+ |
|  | [INTL] USA  10-Aug -> 18-Aug         | |
|  | Status: Completed  (grey)            | |
|  +-------------------------------------+ |
+-------------------------------------------+
```

**Travel Form (Add/Edit):**
```
+---------------------------------------+
|          Travel Details               |
+---------------------------------------+
|                                       |
| Travel Type:  (o) Domestic            |
|               ( ) International       |
|                                       |
| --- If Domestic selected ---          |
| From City    [ Delhi             v ]  |
| To City      [ Bangalore        v ]  |
| Start Date   [ 28-Aug-2026        ]  |
| End Date     [ 05-Sep-2026        ]  |
| Purpose      [ Client Meeting     ]  |
|                                       |
| --- If International selected ---     |
| From Country [ India             v ]  |
| To Country   [ Singapore        v ]  |
| Start Date   [ 28-Aug-2026        ]  |
| End Date     [ 05-Sep-2026        ]  |
| Purpose      [ Business Meeting   ]  |
| Passport No  [ A1234567           ]  |
| Visa Status  [ Have Visa         v ]  |
|                                       |
|       [ Cancel ]  [ Submit ]          |
+---------------------------------------+
```

### SAPUI5 Components:
- `sap.m.List` with `ObjectListItem` — travel list with [DOM]/[INTL] badge
- `sap.m.RadioButtonGroup` — Domestic/International toggle
- `sap.ui.layout.form.SimpleForm` — travel form
- `sap.m.ObjectStatus` — status with colors
- Conditional visibility on form fields based on travel type

---

## Step 7: Admin Dashboard (Travel Intelligence)

### At-a-Glance Summary Cards:
```
+------------+ +------------+ +------------+ +------------+ +------------+
| Travelling | | Upcoming   | | Returning  | | Currently  | | Countries  |
|   Today    | |  7 Days    | |   Today    | |  Abroad    | |            |
|     12     | |     28     | |      4     | |     17     | |      8     |
+------------+ +------------+ +------------+ +------------+ +------------+

+------------+ +------------+
| Domestic   | |International|
|   Today    | |   Today     |
|      5     | |      7      |
+------------+ +------------+
```

### Travel Intelligence — RAG Chatbot (bottom-right floating button)

Instead of static sections, the 5 intelligence questions are answered by the **Travel Bot**.
Admin clicks the chat icon, types a question, and gets live answers from the database.

**Example conversation:**
```
Admin: Who is travelling today?
Bot:   12 employees are travelling today (7 intl, 5 domestic).
       [shows table: Employee, Type, Destination, Return Date]

Admin: Where are they travelling?
Bot:   International: Singapore(5), USA(3), UK(2), UAE(2)
       Domestic: Bangalore(4), Mumbai(3), Chennai(2)
       [shows bar chart data]

Admin: Who is travelling next week?
Bot:   28 employees have travel starting in next 7 days.
       [shows upcoming table]

Admin: Who is currently outside India?
Bot:   17 employees are currently abroad.
       Singapore(6), USA(5), UK(3), UAE(3)

Admin: Who is returning today?
Bot:   4 employees returning today.
       [shows table: Arun-Singapore, Sneha-UK, ...]

Admin: How many from Engineering are travelling?
Bot:   5 engineers are travelling. 3 international, 2 domestic.

Admin: Show Singapore travellers
Bot:   5 employees in Singapore right now.
       [shows table with details]
```

**Quick suggestion chips** shown below input:
```
[Who is travelling today?] [Where are they?] [Returning today?] [Currently abroad?] [Upcoming travel?]
```

### Filters Bar:
```
[Domestic/International v] [Date v] [Country v] [Department v] [Status v] [Search employee...]
```

### World Map:
- Interactive SVG-based world map showing countries with travel markers
- Each country with active travellers gets a colored dot/marker
- Dot size or number badge shows employee count
- Click a country -> drill-down to see employee list
- Example:
```
         [World Map SVG]
         
     USA (3)        UK (2)
                          Germany (1)
                     UAE (2)
                         Singapore (5)
                              Japan (1)
                              Australia (1)
```
- Implementation: Custom SAPUI5 control with inline SVG world map
- Countries are highlighted with color intensity based on count
- Tooltip on hover shows: "Singapore - 5 employees travelling"

### Calendar View:
- `sap.ui.unified.Calendar` control
- Each date shows travel density (color-coded)
- On clicking a date (e.g., 25-Aug-2026):
```
25-Aug-2026

Travelling:  12
Returning:    4
Departing:    8
```
- Shows breakdown below the calendar
- Fetches data via `getCalendarData(year, month)` function

### Country Drill-Down (click country on map or chart):
```
+--------------------------------------------+
|  <- Back         Singapore - 5 Employees   |
+--------------------------------------------+
|  Employee    Dept     From     Start  Return|
|  ----------------------------------------- |
|  Rahul       Engg     India    20-Aug 30-Aug|
|  Priya       Sales    India    22-Aug 02-Sep|
|  Arun        Engg     India    25-Aug 05-Sep|
|  Kiran       Mktg     India    18-Aug 28-Aug|
|  Deepa       Fin      India    23-Aug 01-Sep|
+--------------------------------------------+
```

### SAPUI5 Components:
- `sap.m.GenericTile` — summary cards (7 tiles)
- `sap.viz.ui5.controls.VizFrame` — bar chart for country + domestic distribution
- `sap.m.Table` — currently travelling table, upcoming table, returning table
- `sap.ui.unified.Calendar` — calendar with date selection
- Custom SVG control — world map with interactive country markers
- `sap.m.OverflowToolbar` — filter bar
- `sap.m.SegmentedButton` — Domestic/International toggle on dashboard
- `sap.m.Select`, `sap.m.DatePicker`, `sap.m.SearchField` — filters
- `sap.m.IconTabBar` — tab sections for different intelligence views

---

## Step 8: Fiori Launchpad (`app/index.html`)

Landing page with role-based tiles:
- **My Travel** tile — visible to all (opens Employee Travel App)
- **Travel Dashboard** tile — visible to Admin only (opens Admin Dashboard)
- Simple login simulation: dropdown to select user (for demo)

---

## Build Order

| #  | Task                          | What Gets Created                    |
|----|-------------------------------|--------------------------------------|
| 1  | Initialize CAP project        | `package.json`, `.cdsrc.json`        |
| 2  | Create data model             | `db/schema.cds`                      |
| 3  | Create seed data              | `db/data/*.csv`                      |
| 4  | Define OData service          | `srv/travel-service.cds`             |
| 5  | Implement service handlers    | `srv/travel-service.js`              |
| 6  | Test CAP backend (`cds watch`)| Verify OData endpoints work          |
| 7  | Build Python RAG chatbot      | `chatbot/app.py`, `rag_engine.py`, `db_connector.py`, `prompt_templates.py` |
| 8  | Test chatbot API              | `curl POST /api/chat` with questions |
| 9  | Build Employee Travel App     | `app/employee-travel/webapp/*`       |
| 10 | Build Admin Dashboard App     | `app/admin-dashboard/webapp/*`       |
| 11 | Build Chatbot UI in Dashboard | `Chatbot.fragment.xml`, `Chatbot.controller.js` |
| 12 | Build Launchpad               | `app/index.html`                     |
| 13 | End-to-end testing            | Full app verification                |

---

## How to Run

```bash
# Terminal 1 — Start CAP backend
npm install
cds watch
# CAP runs on http://localhost:4004

# Terminal 2 — Start Python chatbot
cd chatbot
pip install -r requirements.txt
python app.py
# Chatbot API runs on http://localhost:5000
```

---

## Verification Checklist

### Backend
- [ ] `cds watch` starts without errors, SQLite DB created, seed data loaded
- [ ] `http://localhost:4004/travel/Employees` returns 15 employees
- [ ] `http://localhost:4004/travel/Travels` returns 30 travel records
- [ ] `http://localhost:4004/travel/getDashboardStats()` returns all counts
- [ ] Chatbot: POST `askTravelBot` with "Who is travelling today?" returns correct answer

### Employee App
- [ ] Domestic/International toggle shows/hides correct fields
- [ ] Can submit domestic travel (city fields)
- [ ] Can submit international travel (country + passport + visa fields)
- [ ] Travel list shows [DOM]/[INTL] badges and correct grouping

### Admin Dashboard
- [ ] 7 summary cards show correct numbers
- [ ] Bar chart renders country distribution
- [ ] World map shows countries with markers and counts
- [ ] Click country on map -> drill-down to employee list
- [ ] Calendar view shows dates, click date shows Travelling/Returning/Departing
- [ ] Filters (type/country/dept/status/search) all work
- [ ] Approve/Reject travel actions work

### Python RAG Chatbot
- [ ] `python chatbot/app.py` starts Flask on port 5000
- [ ] `POST /api/chat` with `{"question": "Who is travelling today?"}` returns answer + data
- [ ] Chat icon visible (bottom-right) on Admin dashboard
- [ ] Click opens chat panel with welcome message + suggestion chips
- [ ] Can ask ANY question: "Who is travelling today?" -> answer + table
- [ ] Can ask ANY question: "Which department travels the most?" -> answer
- [ ] Can ask ANY question: "Average travel duration?" -> computed answer
- [ ] Can ask ANY question: "Compare domestic vs international" -> answer
- [ ] Can ask ANY question: "Show me Rahul's travel history" -> answer + table
- [ ] Follow-up questions work (conversation memory): "What about USA?" after Singapore question
- [ ] Suggestion chips auto-send questions on click
- [ ] "Clear chat" button resets conversation
- [ ] Bot politely redirects non-travel questions
- [ ] SQL injection safe (read-only SELECT queries only)
