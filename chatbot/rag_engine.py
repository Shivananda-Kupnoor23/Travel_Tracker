import json
import re
from openai import OpenAI
from db_connector import TravelDB
from prompt_templates import get_system_prompt

class TravelRAGEngine:
    def __init__(self, db_path, api_key):
        self.db = TravelDB(db_path)
        self.client = OpenAI(api_key=api_key)
        self.chat_history = []
        self.model = "gpt-4o-mini"

    def ask(self, question):
        """Process a natural language question and return answer with data."""
        system_prompt = get_system_prompt()

        # Build messages with history for context
        messages = [{"role": "system", "content": system_prompt}]
        for entry in self.chat_history[-10:]:  # Keep last 10 exchanges
            messages.append({"role": "user", "content": entry["question"]})
            messages.append({"role": "assistant", "content": entry["raw_response"]})
        messages.append({"role": "user", "content": question})

        try:
            # Step 1: Get SQL from LLM
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0,
                max_tokens=1000
            )

            raw_response = response.choices[0].message.content.strip()
            parsed = self._parse_llm_response(raw_response)

            sql = parsed.get("sql", "")
            explanation = parsed.get("explanation", "")

            if not sql:
                # No SQL needed (greeting, non-travel question)
                result = {
                    "answer": explanation,
                    "data": [],
                    "sql": "",
                    "success": True
                }
                self._add_to_history(question, raw_response, result)
                return result

            # Step 2: Execute SQL
            data = self.db.execute_query(sql)

            # Step 3: Send data back to LLM for natural language answer
            answer = self._format_answer(question, sql, data)

            result = {
                "answer": answer,
                "data": data[:50],  # Limit to 50 rows
                "sql": sql,
                "success": True
            }
            self._add_to_history(question, raw_response, result)
            return result

        except ValueError as e:
            error_result = {
                "answer": f"I encountered an issue processing your question: {str(e)}. Could you rephrase it?",
                "data": [],
                "sql": "",
                "success": False
            }
            return error_result
        except Exception as e:
            error_result = {
                "answer": f"Sorry, I encountered an error: {str(e)}. Please try again.",
                "data": [],
                "sql": "",
                "success": False
            }
            return error_result

    def _parse_llm_response(self, raw_response):
        """Extract JSON from LLM response."""
        # Try direct JSON parse
        try:
            return json.loads(raw_response)
        except json.JSONDecodeError:
            pass

        # Try extracting JSON from markdown code block
        json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', raw_response, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group(1))
            except json.JSONDecodeError:
                pass

        # Try finding JSON object in text
        json_match = re.search(r'\{[^{}]*"sql"[^{}]*\}', raw_response, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group())
            except json.JSONDecodeError:
                pass

        return {"sql": "", "explanation": raw_response}

    def _format_answer(self, question, sql, data):
        """Use LLM to format the query results into natural language."""
        if not data:
            return "No records found matching your query."

        # Truncate data for the prompt
        data_str = json.dumps(data[:20], indent=2, default=str)

        format_prompt = f"""Based on the user's question and the query results, provide a clear, concise natural language answer.

Question: {question}
SQL used: {sql}
Results ({len(data)} rows total, showing first {min(20, len(data))}):
{data_str}

Rules:
- Give a direct answer first (e.g., "12 employees are travelling today")
- If there are multiple rows, summarize key points
- Format numbers and dates clearly
- Keep it conversational but informative
- Do NOT include SQL in your answer
- Do NOT use markdown formatting"""

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are a helpful assistant that summarizes travel data clearly and concisely."},
                {"role": "user", "content": format_prompt}
            ],
            temperature=0.3,
            max_tokens=500
        )

        return response.choices[0].message.content.strip()

    def _add_to_history(self, question, raw_response, result):
        """Add exchange to chat history."""
        self.chat_history.append({
            "question": question,
            "raw_response": raw_response,
            "answer": result["answer"]
        })

    def clear_history(self):
        """Clear chat history."""
        self.chat_history = []
