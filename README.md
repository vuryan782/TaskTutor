# TaskTutor 



## Requirements

Before you start, make sure you have:

- **Node.js** (v18 or newer)
- **npm** (comes with Node)
- **VS Code** (recommended IDE)
- **Supabase account** with one project created

---

## Project Setup

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/vuryan782/TaskTutor.git
cd TaskTutor
```

### 2️⃣ Install Dependencies
Run this once to install all required packages:
```bash
npm install
```

This installs:

| Package | Purpose |
|----------|----------|
| `@supabase/supabase-js` | Supabase client SDK |
| `dotenv` | Loads environment variables from `.env` |
| `typescript` | TypeScript compiler |
| `ts-node` | Runs TypeScript files directly |
| `@types/node` | Type definitions for Node.js |

---

## Environment Variables

Create a **.env** file in the project root (same level as `package.json`):

```
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=YOUR_ANON_PUBLIC_KEY
```

Only use the **anon** key (never the service role key).

---

## 🗂 Folder Structure

```
TaskTutor/
├── src/
│   ├── demo.ts        # Interactive CLI app (add/list/delete users)
│   └── supabase.ts    # Supabase connection setup
├── .env               # Your environment variables
├── package.json       # Project dependencies and scripts
├── tsconfig.json      # TypeScript compiler settings
└── README.md
```

---

## ▶️ Running the Demo

### Development Mode
To run the interactive CLI demo directly from TypeScript:
```bash
npm run dev
```

If configured correctly, you’ll see:
```
[supabase] using your-project.supabase.co
[check] typeof client.from = function
```

Then a menu will appear:
```
=== Users Demo ===
1) Add user
2) List users
3) Delete user
4) Exit
```

### Build and Run (Optional)
To compile to JavaScript:
```bash
npm run build
```
Then run the compiled version:
```bash
npm start
```

---

## 🧠 Notes

- Ensure your **Supabase table** `users_public` exists:
  ```sql
  create table if not exists public.users_public (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    email text not null unique,
    created_at timestamptz default now()
  );
  ```

- You can run `npm install` again if new dependencies are added later.
- Keep your `.env` private and never commit it to GitHub.

---
