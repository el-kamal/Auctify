# Auctify V2

Auctify V2 is a comprehensive SaaS platform for managing auction houses. It streamlines the entire auction process, from cataloging lots and managing actors (buyers/sellers) to reconciling sales results and generating invoices.

## 🚀 Features

### 1. Auction Management
- **Create & Manage Sales**: Create auctions with details like name, date, and fee rates (Buyer, Seller, Platform).
- **Auto-Numbering**: Auctions are automatically assigned a unique ID in the format `DD-MM-YYYY-XXXX`.
- **Status Tracking**: Track auction lifecycle (Created, Mapped, Closed).

### 2. Actor Management (CRM)
- **Vendor Management**:
    - CRUD operations for sellers.
    - Fields: Name, Email, Phone, SIREN/SIRET, Address, IBAN, BIC, VAT status.
    - Search functionality.
- **Buyer Management**:
    - Separate management for buyers.
    - Similar CRUD and search capabilities as vendors.

### 3. Lot Management & Mapping
- **Excel Import**: Import auction catalogs from Excel files.
- **Mapping**: Automatically link imported lots to existing sellers or create new ones.
- **Anomalies**: Identify and flag discrepancies in imported data.

### 4. Reconciliation
- **Result Import**: Import sales results via CSV.
- **Smart Matching**:
    - Match buyers by Email or Name.
    - Auto-create missing buyers with full profile (Address, Phone, etc.).
    - Link sold lots to buyers and record hammer prices.
- **Status Updates**: Automatically mark lots as SOLD or UNSOLD.

### 5. Financial Engine (Planned/In Progress)
- **Invoicing**: Generate Factur-X compliant invoices.
- **Settlements**: Manage payouts to sellers.

### 6. Administration & Security
- **RBAC**: Role-Based Access Control (ADMIN vs CLERK).
- **User Management**: Manage system users and permissions.

## 🛠 Technical Architecture

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python)
- **Database**: PostgreSQL (Async)
- **ORM**: SQLAlchemy (Async)
- **Migrations**: Alembic
- **Data Processing**: Pandas (for Excel/CSV handling)

### Frontend
- **Framework**: [React](https://reactjs.org/) (TypeScript)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Icons**: Lucide React

## 📂 Project Structure

```
Auctify_v2/
├── backend/                # FastAPI Application
│   ├── alembic/            # Database Migrations
│   ├── app/
│   │   ├── api/            # API Endpoints & Routes
│   │   ├── core/           # Config & Security
│   │   ├── db/             # Database Connection
│   │   ├── models/         # SQLAlchemy Models
│   │   ├── schemas/        # Pydantic Schemas
│   │   └── services/       # Business Logic (Import, Reconciliation)
│   └── ...
├── frontend/               # React Application
│   ├── src/
│   │   ├── components/     # Reusable UI Components
│   │   ├── context/        # React Context (Auth)
│   │   ├── lib/            # API Client & Utilities
│   │   ├── pages/          # Application Pages
│   │   └── ...
│   └── ...
└── ...
```

## ⚡️ Getting Started

### Prerequisites
- Python 3.9+
- Node.js 16+
- PostgreSQL

### Backend Setup

1.  **Navigate to backend directory:**
    ```bash
    cd backend
    ```

2.  **Create virtual environment:**
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```

3.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Configure Environment:**
    Create a `.env` file in `backend/` based on `.env.example`. Ensure `SQLALCHEMY_DATABASE_URI` points to your PostgreSQL instance.

5.  **Run Migrations:**
    ```bash
    alembic upgrade head
    ```

6.  **Start Server:**
    ```bash
    uvicorn app.main:app --reload
    ```
    The API will be available at `http://127.0.0.1:8000`.

### Frontend Setup

1.  **Navigate to frontend directory:**
    ```bash
    cd frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Start Development Server:**
    ```bash
    npm run dev
    ```
    The app will be available at `http://localhost:5173`.

## 🤝 Contributing

1.  **Branching**: Use feature branches (`feature/my-feature`) for new developments.
2.  **Migrations**: If modifying models, always generate a new migration:
    ```bash
    alembic revision --autogenerate -m "description of changes"
    alembic upgrade head
    ```
3.  **Linting**: Ensure code is clean and follows project standards.

## 📝 License

Proprietary software. All rights reserved.
