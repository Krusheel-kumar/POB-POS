# POP O' BOB - Food & Beverage Point of Sale (POS)

A modern, high-performance Food & Beverage (F&B) Point of Sale system built with React, TypeScript, and Vite. Tailored specifically for cafes, boba tea shops, and QSR restaurants.

---

## 🚀 Key Features

### 1. Cashier POS & Fast Billing
- **Two Flexible Order & Payment Flows**:
  - **Quick Counter / Parcel (Pay First)**: Immediate settlement at counter before food arrives, issues Tax Invoice & KOT.
  - **Dine In (Table Service / Pay Later)**: KOT sent to kitchen first, bill paid after dining at table checkout.
- **Strict Duplicate Protection**:
  - Automatically stamps **Original Tax Invoice** and **Original KOT (Kitchen Copy)** on the 1st print.
  - Any reprints are prominently stamped as **`*** DUPLICATE TAX INVOICE ***`** or **`⚠️ DUPLICATE KOT - DO NOT PREPARE AGAIN! 🛑`** with timestamp and reprint counter to prevent double-cooking in the kitchen.
- **Customer CRM**:
  - Captures Customer Name and Mobile / WhatsApp (+91 with 10-digit validation), printed on thermal tax bills and kitchen tickets.

### 2. Add-on Categories & Modifier Choices
- **Modifier Categories**:
  - **`Choice Of Size`**: `Regular (300ml) [₹0]`, `Medium (500ml) [+₹40]`, `Large (700ml) [+₹70]` (Single Choice / Radio).
  - **`Choice Of Sweetness`**: `100% Sugar`, `70% Sugar`, `50% Sugar`, `0% Sugar-Free` (Single Choice).
  - **`Choice Of Ice Level`**: `Regular Ice`, `Less Ice`, `No Ice` (Single Choice).
  - **`Choice Of Boba & Toppings`**: `Extra Tapioca Boba`, `Mango Popping Boba`, `Velvet Cheese Foam Cap`, `Jelly` (Multiple Choice).
  - **`Choice Of Milk Base`**: `Standard Dairy Milk`, `Oat Milk`, `Almond Milk` (Single Choice).
  - **`Choice Of Dips & Cheeses`**: `Truffle Mayo Dip`, `Melted Mozzarella Top`, `Pickled Jalapenos` (Multiple Choice).
- Ability to create custom categories and add as many choices/items under them as needed from the Admin portal.

### 3. Kitchen Display System (KDS)
- Real-time kitchen tickets with status progression (`QUEUED` → `PREPARING` → `READY`).
- Item-level and ticket-level preparation trackers with item notes and attached customization choices.

### 4. Admin Management Portal
- **Menu Catalog**: Add and manage menu items, base prices, variants, and link add-on categories.
- **Add-on Categories & Choices**: Create independent modifier groups and bulk-assign to products.
- **Real-Time Sales & Billing**: Live revenue calculation, settlement breakdown (Cash, UPI, Card), and order history.

---

## 🛠️ Tech Stack
- **Frontend**: React 18, TypeScript, Vite
- **Testing**: Vitest, React Testing Library
- **Styling**: Pure Modular CSS with thermal printing typography support

---

## 📦 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Installation & Run
```bash
# Navigate to the web app directory
cd pos-web

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit [http://localhost:5173/](http://localhost:5173/) for Cashier POS or [http://localhost:5173/admin](http://localhost:5173/admin) for Admin Portal.

### Running Tests
```bash
cd pos-web
npm test -- --run
```

### Production Build
```bash
cd pos-web
npm run build
```
