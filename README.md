# Syncora - Project & Task Collaboration System

Syncora is a modern full-stack project management platform built for speed, collaboration, and clear workflow tracking. It helps teams manage complex initiatives with role-based access, real-time analytics, and robust task validation.

## Key Features

### 1. Secure Authentication & RBAC
- **Multi-Role Support**: Admin, Project Manager, and Team Member roles.
- **Granular Permissions**:
  - `Admin`: Full system orchestration.
  - `PM`: Create projects, assign tasks, and manage timelines.
  - `Team Member`: Update progress on assigned tasks.
- **Secure Auth**: JWT-based session handling with standard and demo login options.

### 2. Project Management
- **Lifecycle Tracking**: Monitor projects from `Active` to `Completed` or `On Hold`.
- **Progress Insights**: Automatic completion percentage calculation based on task status.
- **Deadline Management**: Real-time countdowns and overdue tracking.

### 3. Task Workflow & Validation
- **Smart Assignment**: Assign tasks to specific team members with priority levels.
- **Integrity Rules**:
  - Prevent duplicate task titles within a single project.
  - Block past dates for task deadlines.
  - Restricted updates for completed tasks to preserve historical data.
- **Quick Status Updates**: Seamlessly move tasks from `Todo` → `In Progress` → `Completed`.

### 4. Interactive Dashboard
- **KPI Hub**: High-level metrics for projects, pending work, and overdue items.
- **Productivity Charts**: Status distribution and priority breakdown visualizations.
- **Activity Log**: Chronological audit trail of all project and task modifications.

---

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4 + Shadcn UI
- **State Management**: Zustand
- **Data Fetching**: SWR
- **Validation**: Zod + React Hook Form
- **Database**: MongoDB (with JSON fallback mechanism)
- **Visuals**: Recharts & Lucide Icons

---

## Quick Start (Local Setup)

### 1. Requirements
- Node.js 20+
- pnpm or npm
- MongoDB URI (Atlas or Local)

### 2. Installation
```bash
# Clone and enter directory
cd syncora
pnpm install
```

### 3. Configuration
Create a `.env` file in the root:
```env
JWT_SECRET=your_jwt_secret_key
MONGODB_URI=mongodb+srv://...
MONGODB_DB_NAME=syncora
JWT_EXPIRES_IN=1d
```

### 4. Development Mode
```bash
# Start the dev server
pnpm dev
```
Access the app at `http://localhost:3000`. Use the **Demo Login** for quick access.

---

## Project Structure
- `src/app`: Routes and API endpoints.
- `src/components`: Reusable UI components and domain blocks.
- `src/hooks`: Custom React hooks for data synchronization.
- `src/lib`: Core utilities, database configuration, and schemas.
- `src/store`: Global client state (Auth).
- `src/types`: Centralized TypeScript interfaces.
- `data/db.json`: Initial state and fallback data.
