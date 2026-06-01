# Logistics Management System

A full-stack web application for managing shipments, vehicles, warehouses, and users.

The project includes a React frontend, an Express backend, a PostgreSQL database, Keycloak OAuth 2.0 server, MQTT communication, SSE live updates, and NGINX configuration for deployment.

## Main Features

- CRUD operations for:
  - vehicles
  - shipments
  - users
  - warehouses
- shipment search
- OAuth 2.0 login and logout
- Authorization Code Flow with PKCE
- Bearer access token validation through JWKS
- role-based access control
- `/health` and `/ready` runtime endpoints
- real-time shipment updates with MQTT
- live frontend updates with SSE

## Tech Stack

### Backend

- Node.js
- Express.js
- PostgreSQL
- OAuth 2.0 / OpenID Connect
- JWKS token validation
- MQTT
- Server-Sent Events (SSE)

### DevOps

- NGINX
- Docker
- Docker Compose
- Keycloak

### Frontend

- React
- JavaScript
- Vite
- CSS

## Backend

The backend is built with Node.js and Express.

Main backend structure:

- `backend/src/routes/` — API routes
- `backend/src/middleware/` — auth, roles, validation
- `backend/src/db.js` — PostgreSQL connection
- `backend/src/oauth.js` — OAuth access token validation and user sync
- `backend/src/mqtt.js` — MQTT logic
- `backend/src/server.js` — server entry point

Main API routes:

- `auth.js`
- `shipments.js`
- `users.js`
- `vehicles.js`
- `warehouses.js`
- `events.js`

## Protected API Contract

The public runtime endpoints are:

- `GET /health`
- `GET /ready`

Business endpoints require an OAuth 2.0 Bearer access token. The backend reads
application roles from Keycloak token claims: `realm_access.roles` and
`resource_access.xpo-frontend.roles`.

| Resource | Endpoint base | Methods | Allowed roles |
|---|---|---|---|
| shipments | `/api/shipments` | `GET`, `POST`, `PUT /:id`, `DELETE /:id` | `admin`, `moderator` |
| warehouses | `/api/warehouses` | `GET`, `POST`, `PUT /:id`, `DELETE /:id` | `admin`, `moderator` |
| vehicles | `/api/vehicles` | `GET`, `POST`, `PUT /:id`, `DELETE /:id` | `admin`, `moderator` |
| users | `/api/users` | `GET`, `POST`, `PUT /:id`, `DELETE /:id` | `admin` |

This covers the required minimum of four protected endpoints and one
role-aware endpoint. `users` is intentionally admin-only.

## Database

The application uses PostgreSQL.

Database schema is defined in:

- `sql/init.sql`

Main tables:

- users synced from OAuth tokens
- warehouses
- shipments
- vehicles

## Real-Time Communication

The project uses MQTT and SSE for live updates.

- MQTT is used to publish shipment events
- backend listens for MQTT messages
- events are forwarded to the client with SSE
- frontend receives updates with `EventSource`

## Run the Project

Start all services with Docker Compose:

```bash
docker compose up --build
```

The frontend is built into its own NGINX image during `docker compose up --build`.
The backend image runs as the non-root `node` user and exposes a container
healthcheck on `/health`.

Demo users:

- admin: `admin@xpo-logistics.com` / `admin123`
- moderator: `mod@xpo-logistics.com` / `moderator123`

The frontend uses Keycloak on `http://localhost:8080` and OAuth 2.0 Authorization Code Flow with PKCE. The backend validates access tokens with JWKS and syncs OAuth users into the local `users` table.

Runtime checks:

```bash
curl http://localhost/health
curl http://localhost/ready
```

If you already started the database or Keycloak before these OAuth users were added,
recreate the volumes:

```bash
docker compose down -v
docker compose up --build
```

## Kubernetes

Kubernetes manifests are in `k8s/base` and are managed with Kustomize:

```bash
kubectl apply -k k8s/base
```

The Kubernetes layer contains:

- `Namespace`
- `ConfigMap` and `Secret`
- PostgreSQL `StatefulSet` with `PersistentVolumeClaim`
- backend `Deployment` with 2 replicas and rolling update
- frontend `Deployment`
- MQTT `Deployment`
- Keycloak authorization server with a persistent volume
- internal `Service` objects
- external `Ingress`
- `readinessProbe`, `livenessProbe`, resource requests/limits, and `securityContext`
- API `PodDisruptionBudget`
- Prometheus scrape annotations on the API `Service` and API pod template
- Kustomize overlays for `dev` and `prod`

For local kind/minikube usage, build the images first and load them into the
cluster if needed:

```bash
docker compose build api frontend
kind load docker-image projekt-api:latest projekt-frontend:latest
```

Keycloak is expected on `http://localhost:8080` for the browser OAuth flow. In
a local cluster, keep this port-forward open:

```bash
kubectl -n xpo-logistics port-forward svc/keycloak 8080:8080
```

Apply and verify the base deployment:

```bash
kubectl apply -k k8s/base
kubectl -n xpo-logistics get deploy,sts,svc,ingress,pdb
kubectl -n xpo-logistics rollout status deploy/api
kubectl -n xpo-logistics rollout status deploy/frontend
kubectl -n xpo-logistics rollout status deploy/mqtt
kubectl -n xpo-logistics rollout status deploy/keycloak
kubectl -n xpo-logistics rollout status statefulset/postgres
```

Kustomize overlays are available for separate environments:

```bash
kubectl apply -k k8s/overlays/dev
kubectl -n xpo-logistics-dev rollout status deploy/api
kubectl -n xpo-logistics-dev get deploy,svc,ingress,pdb

kubectl apply -k k8s/overlays/prod
kubectl -n xpo-logistics-prod rollout status deploy/api
kubectl -n xpo-logistics-prod get deploy,svc,ingress,pdb
```

The overlays use environment-specific image tags. For a local kind cluster,
tag and load the images before applying an overlay:

```bash
docker compose build api frontend
docker tag projekt-api:latest projekt-api:dev
docker tag projekt-frontend:latest projekt-frontend:dev
kind load docker-image projekt-api:dev projekt-frontend:dev
```

Use `prod` instead of `dev` in the `docker tag` and `kind load` commands when
checking the production overlay locally.

Observability and logs:

```bash
kubectl -n xpo-logistics get svc api -o jsonpath='{.metadata.annotations}'
kubectl -n xpo-logistics get deploy api -o jsonpath='{.spec.template.metadata.annotations}'
kubectl -n xpo-logistics logs deploy/api --tail=100
kubectl -n xpo-logistics logs deploy/api -f
kubectl -n xpo-logistics logs deploy/frontend --tail=50
```

The API annotations use `prometheus.io/scrape: "true"`,
`prometheus.io/path: /health`, and `prometheus.io/port: "3000"`. They give a
Prometheus-compatible discovery hint for the API availability endpoint while
the application keeps the lightweight `/health` and `/ready` endpoints.

## CI/CD

GitHub Actions workflow:

- `.github/workflows/ci-cd.yml`
- workflow page: <https://github.com/mariazhadan/technologie_chmurowe/actions/workflows/ci-cd.yml>

The workflow runs on `master`, `main`, pull requests, and manual
`workflow_dispatch` runs. Pull requests run validation only. Pushes to
`master` or `main` also build and push Docker images to GHCR and deploy the
`prod` Kustomize overlay.

The backend and frontend `package-lock.json` files must be committed because
the workflow and Docker builds use `npm ci`.

Pipeline steps:

- install backend dependencies and run JavaScript syntax validation
- install frontend dependencies, run `npm run lint`, and run `npm run build`
- validate `k8s/base`, `k8s/overlays/dev`, and `k8s/overlays/prod` with Kustomize
- build and push backend image to `ghcr.io/mariazhadan/technologie_chmurowe/api`
- build and push frontend image to `ghcr.io/mariazhadan/technologie_chmurowe/frontend`
- apply the rendered Kustomize manifests with the pushed image tags
- check rollout status for API, frontend, MQTT, Keycloak, and PostgreSQL

Required GitHub repository secret for deployment:

- `KUBE_CONFIG_DATA` - base64 encoded kubeconfig for the target Kubernetes cluster

Create it locally with:

```bash
cat ~/.kube/config | base64 -w0
```

Then add the value in GitHub: `Settings -> Secrets and variables -> Actions`.

If GHCR images are private, either make the package public or add these
optional repository secrets so the workflow can create a Kubernetes pull
secret:

- `GHCR_PULL_USERNAME` - GitHub username
- `GHCR_PULL_TOKEN` - GitHub token with `read:packages`

GitHub Actions must also have package write access enabled:
`Settings -> Actions -> General -> Workflow permissions -> Read and write permissions`.

If the target cluster is local minikube/kind on your laptop, GitHub-hosted
runners will not be able to reach it. Use a self-hosted GitHub runner on the
same machine/network, or deploy to a reachable Kubernetes cluster.
