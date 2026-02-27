# Perago NestJS API — Organizational Hierarchy Management

A production-ready RESTful API for registering and managing an organization's employee position hierarchy. Built with **NestJS 9**, **PostgreSQL**, **TypeORM**, and the **CQRS** pattern, following **Clean Architecture** principles.

```
CEO
├── CTO
│   └── Project Manager
│       └── Product Owner
│           ├── Tech Lead
│           │   ├── Frontend Developer
│           │   ├── Backend Developer
│           │   └── DevOps Engineer
│           ├── QA Engineer
│           └── Scrum Master
├── CFO
│   ├── Chief Accountant
│   │   ├── Financial Analyst
│   │   └── Accounts Payable
│   └── Internal Audit
├── COO
│   ├── Product Manager
│   ├── Operation Manager
│   └── Customer Relation
└── HR
```

---

## Table of Contents

1. [What Is This?](#what-is-this)
2. [Tech Stack](#tech-stack)
3. [Architecture](#architecture)
4. [Project Structure](#project-structure)
5. [Data Model](#data-model)
6. [How It Works](#how-it-works)
7. [API Endpoints](#api-endpoints)
8. [Getting Started](#getting-started)
9. [Running Tests](#running-tests)
10. [Design Decisions](#design-decisions)
11. [References](#references)

---

## What Is This?

This API models an **organizational hierarchy** — a tree of employee positions/roles where every position reports to exactly one parent, except the root (CEO). The system supports:

- **Creating** positions with a name, description, and a reference to the managing position they report to.
- **Updating** any position's details or reassigning it to a new parent at any time.
- **Retrieving** a single position's full details.
- **Listing** the entire organization as a **nested JSON tree** with unlimited depth.
- **Fetching** all children/descendants of any specific position.
- **Deleting** a position, with safety guards to prevent orphaning sub-trees.

---

## Tech Stack

| Technology | Role |
|---|---|
| **NestJS 9** | Application framework (modules, dependency injection, decorators) |
| **TypeORM 0.3** | ORM for PostgreSQL with Tree Entity support |
| **PostgreSQL** | Relational database |
| **@nestjs/cqrs** | Command Query Responsibility Segregation pattern implementation |
| **class-validator** | DTO validation via decorators |
| **class-transformer** | Automatic DTO transformation |
| **@nestjs/swagger** | Auto-generated Swagger/OpenAPI documentation |
| **Jest** | Unit testing framework |

---

## Architecture

The project follows **Clean Architecture** (also known as Hexagonal/Onion Architecture), strictly separating concerns into layers:

```
┌─────────────────────────────────────────────────────┐
│                  Presentation Layer                  │
│          (Controllers, Swagger decorators)           │
│          Handles HTTP routing only — no logic        │
├─────────────────────────────────────────────────────┤
│                  Application Layer                   │
│     Commands + Queries (CQRS) with Handlers          │
│     DTOs (Create, Update, Response)                  │
│     Contains all business/orchestration logic         │
├─────────────────────────────────────────────────────┤
│                    Domain Layer                      │
│          Entity definition (Position)                │
│          Core data model and relationships           │
├─────────────────────────────────────────────────────┤
│                Infrastructure Layer                  │
│     TypeORM repositories, PostgreSQL connection       │
│     (Handled by NestJS TypeORM module integration)    │
└─────────────────────────────────────────────────────┘
```

### CQRS Pattern

The application implements the **Command Query Responsibility Segregation** pattern:

- **Commands** (write operations): `CreatePositionCommand`, `UpdatePositionCommand`, `DeletePositionCommand` — each handled by a dedicated `CommandHandler`.
- **Queries** (read operations): `GetPositionQuery`, `GetPositionTreeQuery`, `GetPositionChildrenQuery` — each handled by a dedicated `QueryHandler`.
- The **Controller** never touches a repository directly. It dispatches commands via `CommandBus` and queries via `QueryBus`.

This separation means read and write paths are independently scalable and testable.

---

## Project Structure

```
src/
├── main.ts                              # Bootstrap: creates app, Swagger, ValidationPipe
├── app.module.ts                        # Root module: TypeORM config, imports PositionModule
├── app.controller.ts                    # Health-check root controller
├── app.service.ts                       # Root service
│
└── position/                            # Feature module (self-contained)
    ├── position.module.ts               # Wires entity, controller, CQRS handlers
    │
    ├── domain/                          # === DOMAIN LAYER ===
    │   └── position.entity.ts           # TypeORM Tree Entity (@Tree, @TreeParent, @TreeChildren)
    │
    ├── application/                     # === APPLICATION LAYER ===
    │   ├── dtos/
    │   │   ├── create-position.dto.ts   # Validated input for creating positions
    │   │   ├── update-position.dto.ts   # Validated input for updating positions
    │   │   ├── position-response.dto.ts # Swagger-documented response shape
    │   │   └── index.ts                 # Barrel export
    │   │
    │   ├── commands/
    │   │   ├── create-position.command.ts
    │   │   ├── update-position.command.ts
    │   │   ├── delete-position.command.ts
    │   │   ├── index.ts                 # Barrel export
    │   │   └── handlers/
    │   │       ├── create-position.handler.ts   # Validates parent, persists position
    │   │       ├── update-position.handler.ts   # Partial update, parent reassignment
    │   │       ├── delete-position.handler.ts   # Guarded deletion (blocks if children exist)
    │   │       └── index.ts
    │   │
    │   └── queries/
    │       ├── get-position.query.ts
    │       ├── get-position-tree.query.ts
    │       ├── get-position-children.query.ts
    │       ├── index.ts                 # Barrel export
    │       └── handlers/
    │           ├── get-position.handler.ts          # Single position lookup with parent
    │           ├── get-position-tree.handler.ts     # Full tree via findTrees()
    │           ├── get-position-children.handler.ts # Descendants via findDescendantsTree()
    │           └── index.ts
    │
    └── presentation/                    # === PRESENTATION LAYER ===
        ├── position.controller.ts       # REST endpoints + full Swagger documentation
        └── position.controller.spec.ts  # 16 unit tests (mocked CommandBus & QueryBus)
```

---

## Data Model

The `Position` entity (`position` table in PostgreSQL):

| Column | Type | Description |
|---|---|---|
| `id` | `UUID` (PK, auto-generated) | Unique identifier |
| `name` | `VARCHAR(255)` | Position/role name (e.g., "CTO") |
| `description` | `TEXT` | Detailed description of the role |
| `parentId` | `UUID` (nullable, FK) | References the parent position. `NULL` for root (CEO) |
| `mpath` | `VARCHAR` (auto-managed) | Materialized path — managed automatically by TypeORM for tree queries |
| `createdAt` | `TIMESTAMP` | Auto-set on creation |
| `updatedAt` | `TIMESTAMP` | Auto-set on every update |

### Tree Strategy: Materialized Path

The entity uses `@Tree('materialized-path')`, which stores the full ancestry path of each node in an `mpath` column (e.g., `ceo-id.cto-id.pm-id.`). This provides:

- **O(1) ancestor lookups** — the path encodes the full lineage.
- **Efficient subtree queries** — a `LIKE 'prefix%'` query finds all descendants.
- **Unlimited depth** — no fixed-depth joins required.

---

## How It Works

### Request Flow

```
HTTP Request
     │
     ▼
┌─────────────────┐
│   Controller     │  Validates params (ParseUUIDPipe), reads DTO (class-validator)
│  (Presentation)  │  Dispatches to CommandBus or QueryBus — NO business logic here
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Command/Query   │  Business logic lives here:
│    Handler       │  - Validates existence (throws NotFoundException)
│  (Application)   │  - Enforces rules (e.g., cannot delete parent with children)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  TreeRepository  │  TypeORM's tree-aware repository
│ (Infrastructure) │  findTrees(), findDescendantsTree(), save(), remove()
└────────┬────────┘
         │
         ▼
    PostgreSQL
```

### Validation Pipeline

Every incoming request passes through a global `ValidationPipe` configured in `main.ts` with:

- **`whitelist: true`** — Strips any properties not defined in the DTO.
- **`forbidNonWhitelisted: true`** — Returns `400 Bad Request` if unknown properties are sent.
- **`transform: true`** — Automatically transforms JSON payloads into DTO class instances.

### Error Handling

| HTTP Status | When |
|---|---|
| `201 Created` | Position successfully created |
| `200 OK` | Successful read or update |
| `204 No Content` | Position successfully deleted |
| `400 Bad Request` | DTO validation fails (missing name, invalid UUID format, etc.) |
| `404 Not Found` | Position or parent position ID doesn't exist in the database |
| `409 Conflict` | Attempting to delete a position that still has children |

---

## API Endpoints

**Base URL:** `http://localhost:3000`  
**Swagger UI:** `http://localhost:3000/api`

### 1. Create a Position

```http
POST /positions
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "CTO",
  "description": "Chief Technology Officer responsible for technology strategy",
  "parentId": "uuid-of-ceo"
}
```

> Omit `parentId` or set it to `null` to create the root position (CEO).

**Response:** `201 Created`
```json
{
  "id": "generated-uuid",
  "name": "CTO",
  "description": "Chief Technology Officer responsible for technology strategy",
  "parentId": "uuid-of-ceo",
  "createdAt": "2026-02-25T20:12:36.762Z",
  "updatedAt": "2026-02-25T20:12:36.762Z"
}
```

---

### 2. Get Full Hierarchy Tree

```http
GET /positions/tree
```

**Response:** `200 OK` — nested JSON array from all roots down to the lowest leaves.

```json
[
  {
    "id": "...",
    "name": "CEO",
    "description": "Chief Executive Officer",
    "parentId": null,
    "children": [
      {
        "id": "...",
        "name": "CTO",
        "description": "Chief Technology Officer",
        "parentId": "...",
        "children": [
          {
            "name": "Project Manager",
            "children": [ "..." ]
          }
        ]
      },
      {
        "name": "CFO",
        "children": []
      }
    ]
  }
]
```

---

### 3. Get Single Position

```http
GET /positions/:id
```

**Response:** `200 OK` — position details including parent information.

**Error:** `404 Not Found` if the UUID doesn't match any position.

---

### 4. Get All Descendants of a Position

```http
GET /positions/:id/children
```

**Response:** `200 OK` — the position and all its children/descendants as a nested tree.

**Error:** `404 Not Found` if the UUID doesn't match any position.

---

### 5. Update a Position

```http
PATCH /positions/:id
Content-Type: application/json
```

**Request Body** (all fields are optional — send only what you want to change):
```json
{
  "name": "Updated Position Name",
  "description": "Updated description",
  "parentId": "uuid-of-new-parent"
}
```

> Set `parentId` to `null` to promote a position to root. Set it to another UUID to reassign its place in the hierarchy.

**Response:** `200 OK` — returns the updated position.

**Error:** `404 Not Found` if the position or new parent doesn't exist.

---

### 6. Delete a Position

```http
DELETE /positions/:id
```

**Response:** `204 No Content` on successful deletion.

**Error:** `404 Not Found` if the position doesn't exist.

**Error:** `409 Conflict` if the position has child positions. You must reassign or remove all children before deleting a parent.

---

## Getting Started

### Prerequisites

- **Node.js** >= 16
- **PostgreSQL** installed and running
- **npm**

### Step 1 — Clone & Install Dependencies

```bash
git clone <repository-url>
cd perago-nestjs-api
npm install
```

### Step 2 — Create the Database

```bash
psql -U postgres -c "CREATE DATABASE orga_structure;"
```

> **Database connection defaults** (configured in `src/app.module.ts`):
>
> | Setting | Value |
> |---|---|
> | Host | `localhost` |
> | Port | `5432` |
> | Username | `postgres` |
> | Password | `root` |
> | Database | `orga_structure` |
>
> Update these values in `app.module.ts` if your PostgreSQL setup differs.

### Step 3 — Start the Application

```bash
# Development mode (auto-restart on file changes)
npm run start:dev

# Or standard start
nest start

# Or production build
npm run build
npm run start:prod
```

### Step 4 — Open Swagger & Test

Open your browser and navigate to:

**http://localhost:3000/api**

You'll see the interactive Swagger UI where you can test every endpoint directly.

---

## Running Tests

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:cov

# Run only the Position controller tests
npx jest --testPathPattern="position.controller.spec" --verbose
```

### Test Summary

**17 tests, 17 passing** across 2 test suites:

| Test Suite | Tests | Description |
|---|---|---|
| `AppController` | 1 | Root health-check endpoint |
| `PositionController` | 16 | All 6 REST endpoints with success and error scenarios |

The Position controller tests **mock** `CommandBus` and `QueryBus` to verify:

- Correct commands/queries are dispatched with the right parameters.
- Successful responses for create, read, update, and delete operations.
- `NotFoundException` propagation when a position or parent is not found.
- `ConflictException` propagation when attempting to delete a position that has children.

---

## Design Decisions

### 1. Why Materialized Path for the Tree?

Four common SQL tree patterns were evaluated:

| Pattern | Read Speed | Write Speed | Depth Limit | Complexity |
|---|---|---|---|---|
| Adjacency List | Slow (recursive CTEs) | Fast | Unlimited | Low |
| Nested Set | Fast | Slow (rebalance on insert) | Unlimited | High |
| **Materialized Path** | **Fast** | **Fast** | **Unlimited** | **Low** |
| Closure Table | Fast | Moderate (extra join table) | Unlimited | Medium |

**Materialized Path** was selected because:
- It offers the best balance of read and write performance for our use case.
- TypeORM provides first-class support via `@Tree('materialized-path')` with built-in methods like `findTrees()` and `findDescendantsTree()`.
- The `mpath` column is automatically maintained — no manual path management required.

### 2. Why Guarded Deletion Instead of Cascade Delete?

When a user tries to delete a position that has children, the API returns **`409 Conflict`** rather than cascading the delete or auto-reassigning children to the grandparent.

**Why not cascade delete?** Cascading would silently remove an entire department (and all its sub-departments). In an organizational structure, this would be catastrophic in production.

**Why not auto-reassign to grandparent?** This makes an implicit structural change the user may not have intended. The CTO's children should not automatically report to the CEO just because someone deleted the CTO.

**Why guarded deletion?** The API consumer retains full control:
- Delete leaf positions (bottom-up) for a clean teardown.
- Or explicitly reassign children to a new parent using `PATCH`, then delete.

**Principle:** Explicit is better than implicit for destructive operations.

### 3. Why CQRS?

- **Separation of concerns** — read logic and write logic live in completely independent handler classes.
- **Testability** — each handler can be tested in isolation; the controller only needs to verify it dispatches the right command/query.
- **Scalability** — if read traffic grows, query handlers can be optimized independently (e.g., caching, read replicas).
- **DDD alignment** — commands represent explicit domain intentions ("Create this position"), queries represent view/reporting needs.

### 4. Why Strict Layer Separation?

```
Controller → knows nothing about databases
Handler    → knows nothing about HTTP
Entity     → knows nothing about either
```

This ensures:
- **Maintainability** — changes to the API contract (e.g., adding a new query parameter) don't affect business logic.
- **Replaceability** — the PostgreSQL layer could be swapped for another database by only changing the infrastructure setup.
- **Testability** — each layer can be tested with appropriate mocks at its boundaries.

---

## References

- [NestJS Documentation](https://docs.nestjs.com/)
- [NestJS CQRS Recipe](https://docs.nestjs.com/recipes/cqrs)
- [TypeORM Tree Entities](https://typeorm.io/tree-entities)
- [Clean Architecture — Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [DDD, Hexagonal, Onion, Clean, CQRS — How I Put It All Together](https://herbertograca.com/2017/11/16/explicit-architecture-01-ddd-hexagonal-onion-clean-cqrs-how-i-put-it-all-together/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
