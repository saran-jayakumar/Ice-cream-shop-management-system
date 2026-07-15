# 🍨 One Scoop - Ice Cream Shop Management System

Welcome to **One Scoop**, a complete Full Stack Web Application designed for managing a multi-role Ice Cream Shop. It features role-based dashboards, table ordering, automated billing, and detailed financial reports.

---

## 🚀 Tech Stack

The application is built using a modern and secure stack:

*   **Frontend:** React.js (Vite, React Router DOM, Tailwind CSS/Vanilla CSS, Lucide icons)
*   **Backend:** Spring Boot (Java 17, JPA Hibernate, Spring Security)
*   **Database:** MySQL
*   **Authentication:** JSON Web Tokens (JWT) + Role-Based Access Control (RBAC)
*   **Architecture:** Clean layered architecture (`Controller` → `Service` → `Repository` → `Database`)

---

## 🛡️ Role-Based Access Control & Dashboards

The system supports four distinct user roles, each with their own protected routes and functional dashboard:

| Role | Core Responsibilities & Features |
| :--- | :--- |
| **👑 Owner** | View dashboard statistics (Daily, Monthly, Yearly Profit, Total Revenue, Order Count), manage employee details (Salaries, Shifts, Attendance), track Server performance, and manage flavors (CRUD). |
| **💼 Assistant Manager** | View employee details, manage basic employee metrics, view profit reports, manage flavors, and track daily orders. |
| **🍳 Server** | Select table number (1-8), take customer orders, add flavors and quantities, submit orders to cashier, and track order status. |
| **💳 Cashier** | View completed table orders, generate bills, print invoices, update payment status (Paid/Pending), and search order history. |

---

## 📂 Project Directory Structure

```text
ONE SCOOP/
├── backend/                  # Spring Boot API
│   ├── src/main/java/        # Core Java Source Code
│   │   └── com/onescoop/
│   │       ├── config/       # Security & CORS configuration
│   │       ├── controller/   # REST Controllers (API Endpoints)
│   │       ├── dto/          # Data Transfer Objects
│   │       ├── entity/       # JPA Entities (User, Employee, Table, Order, Flavour, Bill)
│   │       ├── repository/   # Spring Data JPA Repositories
│   │       ├── security/     # JWT Token Filters & Services
│   │       └── service/      # Business Logic Services
│   ├── src/main/resources/   # App Configuration
│   │   ├── application.properties
│   │   └── application-mysql.properties
│   ├── Dockerfile            # Multi-stage Docker build config
│   └── pom.xml               # Maven Dependencies & Plugins
├── frontend/                 # React SPA (Vite)
│   ├── src/
│   │   ├── components/       # Reusable UI Elements (Modals, Spinners, Sidebars)
│   │   ├── pages/            # Role-Specific Dashboard Pages
│   │   ├── routes/           # AppRoutes and ProtectedRoute definitions
│   │   ├── services/         # Axios API service callers
│   │   └── index.css         # Global Styles
│   ├── package.json          # Node Dependencies & Scripts
│   └── vite.config.js        # Vite Build configuration
└── mysql-data/               # Mounted MySQL database storage (if running in Docker)
```

---

## 🛠️ Getting Started & Setup

Follow these steps to run the application locally on your machine.

### Prerequisites
Make sure you have the following installed:
*   [Node.js](https://nodejs.org/) (v16+ recommended)
*   [Java Development Kit (JDK 17)](https://adoptium.net/)
*   [Maven](https://maven.apache.org/)
*   [MySQL Server](https://www.mysql.com/)

---

### 1. Database Configuration
1. Open your MySQL client and create a database named `onescoopdb`:
   ```sql
   CREATE DATABASE onescoopdb;
   ```
2. Open `backend/src/main/resources/application-mysql.properties` and verify your credentials. Update the username and password if necessary:
   ```properties
   spring.datasource.username=root
   spring.datasource.password=your_mysql_password
   ```

---

### 2. Run the Backend (Spring Boot)
1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Build and run the project using Maven:
   ```bash
   mvn clean package -DskipTests
   mvn spring-boot:run
   ```
   *The backend server will start running on port `8080` (e.g., `http://localhost:8080`).*

---

### 3. Run the Frontend (React Vite)
1. Open a new terminal and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend will run on `http://localhost:5173`.*

---

## 🔑 Seeding & Default Login Credentials

On backend startup, `OneScoopDataLoader.java` automatically seeds the database with initial users, employees, table numbers, and ice cream flavours. 

Use these credentials to log in and test different dashboard interfaces:

### Seeded Users
| Role | Email | Password |
| :--- | :--- | :--- |
| **Owner (Alice)** | `owner@onescoop.com` | `owner123` |
| **Assistant Manager (Emma)** | `manager@onescoop.com` | `manager123` |
| **Cashier (Charlie)** | `cashier@onescoop.com` | `cashier123` |
| **Server 1 (David)** | `server@onescoop.com` | `server123` |
| **Server 2 (John)** | `john@onescoop.com` | `john123` |

### Default Flavours Seeding
The database is pre-filled with the following flavours:
*   🍨 Vanilla Supreme
*   🍫 Double Chocolate
*   🍓 Fresh Strawberry
*   🍃 Mint Chocolate Chip
*   🥜 Butter Pecan
*   🍪 Classic Cookie Dough
*   🥭 Mango Sorbet
*   🛣️ Rocky Road (Marked unavailable by default)

---

## 🐳 Docker Deployment (Optional)

You can run the backend and DB in containers. A custom multi-stage Docker build is available in `backend/Dockerfile` to package and run the Spring Boot API:

```bash
cd backend
docker build -t onescoop-backend .
docker run -p 8080:8080 -e SPRING_PROFILES_ACTIVE=mysql onescoop-backend
```

---

## 🎨 UI Features Included
*   **Modern Dashboards:** Responsive cards for metrics and clean data-tables.
*   **Protected Routing:** Automatically blocks unauthorized users from accessing role-specific dashboards.
*   **Toast Notifications:** Real-time feedback on logins, order updates, and actions.
*   **Loading State:** Clean spinners to handle async API waiting times.
