# ConversAI - React Frontend

Modern, lightweight React UI for ConversAI with Ocean Professional theme (blue primary, amber accents), implementing:
- User signup and login
- Authenticated chat interface with LLM
- Conversation history sidebar with search and delete
- Model/system prompt controls and optional OpenAI API key pass-through
- Responsive UI, rounded corners, subtle gradients, minimalist design

## Environment configuration

Copy `.env.example` to `.env` and set:
- `REACT_APP_API_BASE_URL` – Backend API base URL (e.g., http://localhost:8000)

Note: Do not commit secrets. Tokens are stored in localStorage under a namespaced key.

## Available scripts

- `npm start` – Start dev server
- `npm test` – Run tests
- `npm run build` – Build for production

## Backend endpoints used

The app connects to FastAPI routes:
- POST `/auth/signup` – create account
- POST `/auth/login` – get JWT
- GET `/auth/me` – current user
- GET `/conversations` – list conversations
- POST `/conversations` – create conversation
- GET `/conversations/{id}` – conversation + messages
- DELETE `/conversations/{id}` – delete conversation
- POST `/llm/chat` – send prompt (supports optional `X-OpenAI-API-Key` header)

## Styling

See `src/App.css` for theme variables and components following Ocean Professional guidelines:
- Primary: #2563EB
- Secondary: #F59E0B
- Background: #f9fafb
- Surface: #ffffff
- Text: #111827

## Security notes

- JWT is added as Authorization: Bearer <token>
- No secrets are embedded in the bundle
- Optional OpenAI key can be supplied per request via a text field (sent as `X-OpenAI-API-Key`)
