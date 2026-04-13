# Datrix Backend — Complete Setup Guide

## Project Structure
```
datrix-backend/
├── models/
│   ├── User.js           ← User schema + password hashing
│   └── Transaction.js    ← Transaction schema + auto cashback
├── routes/
│   ├── auth.js           ← POST /api/auth/register
│   ├── transactions.js   ← POST /api/transactions/add  |  GET /api/transactions
│   ├── rewards.js        ← GET /api/rewards
│   └── insights.js       ← POST /api/insights
├── .env                  ← PORT and MONGO_URI
├── .gitignore
├── package.json
└── server.js             ← Entry point
```

---

## Step-by-Step: Run From Scratch

### STEP 1 — Install Node.js (if not installed)

```bash
# Check if Node is already installed (need v16+)
node -v

# If not installed, install via NVM (recommended):
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Reload your terminal, then:
nvm install 18
nvm use 18

# Verify
node -v    # should show v18.x.x
npm -v     # should show 9.x.x or higher
```

---

### STEP 2 — Install MongoDB (if not installed)

#### On Ubuntu / WSL:
```bash
# Import MongoDB public key
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
  sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# Add MongoDB repo
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] \
https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
  sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Install
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod    # auto-start on boot

# Verify MongoDB is running
sudo systemctl status mongod
```

#### On macOS:
```bash
# Install Homebrew if not installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install MongoDB
brew tap mongodb/brew
brew install mongodb-community@7.0

# Start MongoDB
brew services start mongodb-community@7.0

# Verify
mongosh --eval "db.runCommand({ connectionStatus: 1 })"
```

#### On Windows:
Download the MongoDB Community Installer from:
https://www.mongodb.com/try/download/community
Run the .msi installer, then start MongoDB as a Windows Service.

---

### STEP 3 — Navigate to the project folder

```bash
cd datrix-backend
```

(Or wherever you placed the project files.)

---

### STEP 4 — Install dependencies

```bash
npm install
```

This installs: `express`, `mongoose`, `bcryptjs`, `cors`, `dotenv`, and `nodemon`.

---

### STEP 5 — Configure environment variables

The `.env` file is already created. Open it to confirm or change values:

```bash
cat .env
```

Expected content:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/datrix
```

If using MongoDB Atlas (cloud), replace MONGO_URI with your Atlas connection string:
```
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/datrix
```

---

### STEP 6 — Start the server

#### For development (auto-restarts on file change):
```bash
npm run dev
```

#### For production:
```bash
npm start
```

You should see:
```
✅  MongoDB connected
🚀  Datrix API running on http://localhost:5000
```

---

### STEP 7 — Test the APIs

Open a **new terminal window** and run these curl commands:

#### Health check
```bash
curl http://localhost:5000/
```

---

#### 1. Register a user
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Priya",
    "lastName":  "Sharma",
    "email":     "priya@example.com",
    "phone":     "+91 98765 43210",
    "city":      "Mumbai",
    "goal":      "Earn cashback on purchases"
  }'
```

**Copy the `id` from the response** — you'll need it for the next steps.

---

#### 2. Add a transaction
```bash
curl -X POST http://localhost:5000/api/transactions/add \
  -H "Content-Type: application/json" \
  -d '{
    "userId":   "PASTE_USER_ID_HERE",
    "amount":   1500,
    "category": "Groceries",
    "date":     "2024-11-10"
  }'
```

---

#### 3. Get all transactions
```bash
curl "http://localhost:5000/api/transactions?userId=PASTE_USER_ID_HERE"
```

---

#### 4. Get total rewards / cashback
```bash
curl "http://localhost:5000/api/rewards?userId=PASTE_USER_ID_HERE"
```

---

#### 5. Get smart insights (no userId needed)
```bash
curl -X POST http://localhost:5000/api/insights \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Priya",
    "city":      "Mumbai",
    "goal":      "Earn cashback on purchases"
  }'
```

---

## API Reference

| Method | Endpoint                    | Body / Query                                   | Description                    |
|--------|-----------------------------|------------------------------------------------|--------------------------------|
| POST   | /api/auth/register          | firstName, lastName, email, phone, city, goal  | Register new user              |
| POST   | /api/transactions/add       | userId, amount, category, date?                | Add transaction + earn cashback|
| GET    | /api/transactions           | ?userId=<id>                                   | Get all user transactions      |
| GET    | /api/rewards                | ?userId=<id>                                   | Get total cashback earned      |
| POST   | /api/insights               | firstName, city, goal                          | Get personalised smart insight |

---

## Cashback Logic

- Every transaction automatically computes **5% cashback** via a Mongoose pre-save hook.
- The cashback is added to `user.totalRewards` after each transaction.
- `/api/rewards` returns a breakdown by category using MongoDB aggregation.

## Smart Insights Logic

- **Metro cities** (Mumbai, Delhi, Bengaluru, Hyderabad, Chennai, Kolkata, Pune): ₹1,200–₹2,800/month
- **Tier-2 cities** (Ahmedabad, Jaipur, Kochi, etc.): ₹700–₹1,500/month
- **Other cities**: ₹400–₹900/month
- Suggestions are tailored to the user's `goal` field.

---

## Connect Frontend (pogo-india.html)

In the frontend `handleSignup()` function, replace the Anthropic API call with:

```javascript
// 1. Register the user
const regRes = await fetch('http://localhost:5000/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ firstName, lastName, email, phone, city, goal })
});
const regData = await regRes.json();

// 2. Get personalised insight
const insRes = await fetch('http://localhost:5000/api/insights', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ firstName, city, goal })
});
const insData = await insRes.json();

// 3. Display the result
const { welcome, estimatedEarnings, suggestions } = insData.insight;
textEl.innerHTML = `
  <p>${welcome}</p>
  <p><strong>Estimated earnings: ${estimatedEarnings.label}</strong></p>
  <p>${suggestions.join(' ')}</p>
`;
```
