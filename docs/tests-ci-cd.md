# Testy automatyczne i CI/CD

## Testy lokalne

Backend:

```bash
cd backend
npm test
npm run syntax
```

Frontend:

```bash
cd frontend
npm test
npm run lint
npm run build
```

## Co jest testowane

Backend:
- publiczny endpoint `GET /health`,
- CORS dla `http://localhost`,
- zabezpieczenie `GET /api/auth/me` bez tokenu Bearer,
- wylaczenie starego logowania haslem,
- wymiana OAuth 2.0 Authorization Code + PKCE przez backendowy endpoint tokenow.

Frontend:
- konfiguracja Google OAuth 2.0/OIDC z runtime `config.js`,
- redirect URI `http://localhost/oauth/callback`,
- zapis i czyszczenie tokenow w `sessionStorage`,
- uzycie `api_token`/`id_token` jako Bearer tokenu dla API.

## CI/CD

Workflow znajduje sie w:

```text
.github/workflows/ci-cd.yml
```

Pipeline uruchamia sie dla:
- `push` do `main` albo `master`,
- `pull_request` do `main` albo `master`,
- recznego `workflow_dispatch`.

Etapy:
- `validate-app` - uruchamia testy backendu i frontendu, lint oraz build,
- `validate-k8s` - sprawdza skladnie manifestow Kubernetes,
- `build-images` - buduje i publikuje obrazy Docker do GHCR,
- `deploy-kind` - tworzy testowy klaster kind, wdraza manifesty przez `kubectl`,
- `Smoke test` - sprawdza `/health`, frontend `/` oraz `/config.js`.

## Kryteria na wyzsza ocene

Spelnione:
- Docker i Kubernetes: `Dockerfile`, `docker-compose.yml`, katalog `k8s/`,
- rozbudowana logika biznesowa: shipments, warehouses, vehicles, users,
- authorization server inny niz Keycloak: Google OAuth 2.0/OIDC,
- testy automatyczne: `backend/test`, `frontend/test`,
- CI/CD: `.github/workflows/ci-cd.yml`.

Uwaga o wolumenie danych authorization servera:
Google OAuth 2.0/OIDC jest zewnetrznym authorization serverem, wiec jego dane nie
sa przechowywane w lokalnym Kubernetes PVC. W klastrze przechowywany jest tylko
sekret klienta OAuth w `backend-secret`. Jezeli prowadzacy wymaga doslownie PVC
dla authorization servera, trzeba uzyc self-hosted providera innego niz Keycloak,
np. Dex z PersistentVolumeClaim.
