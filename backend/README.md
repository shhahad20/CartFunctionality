# Backend (Node.js + Express + TypeScript)

## Setup

1. Install dependencies:
   - `npm install`
2. Copy env file:
   - `copy .env.example .env` (Windows PowerShell)
3. Run in development:
   - `npm run dev`
4. Build TypeScript:
   - `npm run build`
5. Run built server:
   - `npm start`

Server runs by default on `http://localhost:4000`.

## Available APIs

- `GET /api/health`
- `GET /api/cart`
- `POST /api/cart/items`
- `PATCH /api/cart/items/:productId`
- `DELETE /api/cart/items/:productId`
- `DELETE /api/cart`

### Headers

- Optional user header: `x-user-id`  
  If omitted, backend uses `guest`.

### POST Body Example

```json
{
  "productId": "p4",
  "quantity": 1
}
```

