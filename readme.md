## Run the Project Locally

### Prerequisites

Install [Git](https://git-scm.com/downloads) and [Docker Desktop](https://www.docker.com/products/docker-desktop/). Ensure Docker Desktop is running before proceeding.

### Step 1: Clone the repository

```bash
git clone git@github.com:BADDEEP007/backend-assignment.git
cd backend-assignment
```

### Step 2: Configure environment variables

Create a `.env` file in the project root and add the environment configuration provided separately.

The configuration must include the database credentials, `DATABASE_URL`, JWT settings, and any other required application variables.

Example:

```env
POSTGRES_DB=amrutam_db
POSTGRES_USER=amrutam_user
POSTGRES_PASSWORD=YOUR_DB_PASSWORD

DATABASE_URL=postgresql://amrutam_user:YOUR_DB_PASSWORD@db:5432/amrutam_db?schema=public

PORT=5000
JWT_SECRET=YOUR_JWT_SECRET
JWT_EXPIRES_IN=15m
```

Use the actual credentials provided for the project. Ensure the PostgreSQL credentials match the `DATABASE_URL`.

**Important:** Use `db` as the database hostname when running through Docker Compose. Do not replace it with `localhost`.

### Step 3: Start the application

Run the following command from the project root:

```bash
docker compose up --build -d
```

Docker Compose builds the backend image, starts PostgreSQL, configures communication between the containers, and starts the backend after the database becomes healthy. Database migrations are applied automatically during backend startup.

### Step 4: Verify the application

Check the container status:

```bash
docker compose ps
```

View backend logs if needed:

```bash
docker compose logs -f backend
```

Ensure the database is healthy and the backend is running before proceeding.

### Step 5: Access the API

The backend is available at:

**Base URL:** http://localhost:5000

### Step 6: View API documentation

Interactive API documentation is available at:

**Swagger UI:** http://localhost:5000/api-docs

Use Swagger UI to inspect available endpoints, review request schemas, and test API requests.


###Prisma Studio
Run the cmd to see the prisma studio
```bash
docker exec {backend-image-name} npm run studio
``` 
now the prisma studio is available on the  http://localhost:5555



###to add admin in data 
Run the cmd to add the admin user 
```bash
docker exec node prisma/seed.js
```

### Stopping the application

To stop the containers while preserving the database volume, run:

```bash
docker compose down
```

The database volume is retained, so persisted data remains available when the application is started again.
