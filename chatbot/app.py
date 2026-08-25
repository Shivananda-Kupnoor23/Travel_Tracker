import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from rag_engine import TravelRAGEngine

load_dotenv()

app = Flask(__name__)
CORS(app)

# Configuration
API_KEY = os.getenv('OPENAI_API_KEY', '')
DB_PATH = os.getenv('DB_PATH', os.path.join(os.path.dirname(__file__), '..', 'db.sqlite'))

# Initialize RAG engine
rag_engine = None
if API_KEY:
    rag_engine = TravelRAGEngine(db_path=DB_PATH, api_key=API_KEY)


@app.route('/api/chat', methods=['POST'])
def chat():
    """Handle chat messages."""
    if not rag_engine:
        return jsonify({
            "answer": "Chatbot is not configured. Please set OPENAI_API_KEY in chatbot/.env",
            "data": [],
            "sql": "",
            "success": False
        }), 500

    data = request.get_json()
    if not data or 'question' not in data:
        return jsonify({"error": "Missing 'question' field"}), 400

    question = data['question'].strip()
    if not question:
        return jsonify({"error": "Question cannot be empty"}), 400

    result = rag_engine.ask(question)
    return jsonify(result)


@app.route('/api/chat/history', methods=['GET'])
def get_history():
    """Get chat history."""
    if not rag_engine:
        return jsonify([])
    history = [{"question": h["question"], "answer": h["answer"]} for h in rag_engine.chat_history]
    return jsonify(history)


@app.route('/api/chat/clear', methods=['POST'])
def clear_history():
    """Clear chat history."""
    if rag_engine:
        rag_engine.clear_history()
    return jsonify({"status": "cleared"})


@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint."""
    db_available = False
    if rag_engine:
        db_available = rag_engine.db.is_available()
    return jsonify({
        "status": "ok",
        "api_key_configured": bool(API_KEY),
        "db_available": db_available,
        "db_path": DB_PATH
    })


if __name__ == '__main__':
    print(f"DB Path: {DB_PATH}")
    print(f"API Key configured: {bool(API_KEY)}")
    app.run(host='0.0.0.0', port=5000, debug=True)
