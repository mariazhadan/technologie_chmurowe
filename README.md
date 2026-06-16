## Mariia Zhadaniuk
#### Na ocene 3.0

1. backend (zabezpieczony OAuth 2.0) 
- backend sprawdza tokeny Google OAuth 2.0/OIDC,
- pliki: `backend/src/oauth.js, backend/src/routes/auth.js, backend/src/middleware/auth.js`

2. przynajmniej 1 endpoint uwzględniający role użytkownika
- np. GET /api/shipments tylko dla moderator,
- plik: `backend/src/routes/users.js`

3. przynajmniej 4 zabezpieczone endpointy
- `GET /api/auth/me`
- `GET/POST/PUT/DELETE /api/warehouses`
- `GET/POST/PUT/DELETE /api/shipments`
- `GET/POST/PUT/DELETE /api/vehicles`
- pliki: `backend/src/routes/users.js backend/src/routes/warehouses.js backend/src/routes/shipments.js backend/src/routes/vehicles.js`

4. przynajmniej 1 niezabezpieczony endpoint
- `GET /health`,
- plik: `backend/src/server.js`

5. frontend korzystający z tego backendu
- frontend pobiera dane przez API backendu i loguje przez OAuth flow,
- pliki: `frontend/src/api.js frontend/src/AuthProvider.jsx`

6. bazę danych
- PostgreSQL w Kubernetes,
- pliki: `k8s/postgres/statefulset.yaml backend/src/db.js`

7. skonfigurowany authorization server 
- Google OAuth 2.0/OIDC jako authorization server,
- pliki: `backend/src/oauth.js frontend/src/oauthConfig.js k8s/backend/configmap.yaml k8s/frontend/configmap.yaml`

8. PKCE
- code verifier i code challenge sa generowane w frontendzie,
- backend wymienia authorization code na tokeny,
- plik: frontend/src/AuthProvider.jsx

#### Na wyzsza ocene

1. użycie k8s
- manifesty Kubernetes,
- pliki: `k8s/`

2. rozbudowana logika biznesowa
- shipments, warehouses, vehicles, users,
- pliki: `backend/src/routes/*`

3. inny authorization server niż Keycloak
- projekt korzysta z Google OAuth 2.0/OIDC,
- pliki: `k8s/ingress/ingress.yaml backend/src/oauth.js`

4. testy automatyczne i CI/CD
- backend i frontend maja testy,
- workflow buduje obrazy i wdraza je do kind,
- pliki: `backend/test/oauth.test.js backend/test/server.test.js frontend/test/authTokens.test.js frontend/test/oauthConfig.test.js .github/workflows/ci-cd.yml`

5. `volumen danych dla authorization serwera` - Nie
- Google OAuth 2.0/OIDC jest zewnetrznym authorization serverem, wiec jego danych nie trzymamy w lokalnym PVC,
- w projekcie trzymany jest sekret klienta OAuth w Kubernetes Secret,
- pliki: `k8s/backend/secret.yam k8s/backend/secret.example.yaml`


## Jak uruchomic projekt

1. Wlacz minikube lub inny klaster Kubernetes.
2. Zastosuj manifesty:

```bash
kubectl apply -R -f k8s
```

3. Otworz aplikacje przez:

```text
http://localhost
```

## Google OAuth 2.0

W Google Cloud Console ustaw:

```text
Authorized JavaScript origins:
http://localhost
```

```text
Authorized redirect URIs:
http://localhost/oauth/callback
```

Projekt korzysta z PKCE. Login startuje z /login, a callback trafia na /oauth/callback.


## Jak uruchomic testy

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
