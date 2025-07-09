# Chatbot Gemini Backend

This project is the backend server for the Chatbot Gemini application. It is designed as a webhook server that receives messages or requests from the frontend Chatbot Gemini client, sends those messages to the Gemini API for AI-powered processing, and then returns the Gemini-generated response back to the frontend in real time.

## Features

- **Webhook Endpoint:** Receives POST requests from the frontend with user input or chat messages.
- **Gemini API Integration:** Forwards incoming messages to Google Gemini API and retrieves AI-generated responses.
- **RESTful API:** Responds to frontend with processed results in a standardized format.
- **Scalable:** Built for easy deployment and horizontal scaling.

## Technologies Used

- **JavaScript (Node.js):** Backend logic and server.
- **Express.js:** REST API and webhook handling.
- **Google Gemini API:** AI-powered natural language processing.
- **Google Firebase (optional):** May be used for authentication or session management.
- **Google Cloud Console:** For deployment, monitoring, and management.

## Getting Started

To run the backend server locally:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Manika2626/chatbot-gemini.git
   cd chatbot-gemini
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   - Create a `.env` file in the project root.
   - Add your Gemini API key and any other required variables:
     ```
     GEMINI_API_KEY=your_gemini_api_key_here
     PORT=5000
     ```
   - (Add more configuration options as needed.)

4. **Start the server:**
   ```bash
   npm start
   ```
   The backend server will run on the port specified in your `.env` file (default is 5000).

5. **Frontend Integration:**
   - Ensure the frontend (e.g., [Chatbot Gemini frontend](https://github.com/Manika2626/chatbot-gemini-frontend) or [CampusLoop](https://github.com/Manika2626/campusloop)) sends requests to the correct webhook endpoint (e.g., `http://localhost:5000/webhook`).

## Example API Usage

**POST /webhook**

Request body:
```json
{
  "message": "Hello, who are you?"
}
```

Response body:
```json
{
  "reply": "Hello! I am an AI-powered chatbot built with Gemini API."
}
```

## Deployment

- Deploy to your preferred cloud platform (e.g., Google Cloud Run, App Engine, Heroku, Vercel, etc.).
- Set environment variables for production in your cloud console.
- Ensure any required network or API credentials are securely configured.

## Contribution

Contributions are welcome! Please fork the repository, make your changes, and submit a pull request. For major changes, open an issue first to discuss your ideas.



---

**Developed by Manika Singh**
