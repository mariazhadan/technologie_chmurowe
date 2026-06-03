### Mariia Zhadaniuk
 Aplikacja umożliwia zarządzanie dostawami, magazynami, transportem oraz użytkownikami poprzez frontend. Dane są przechowywane w PostgreSQL, Redis jest używany jako dodatkowy komponent cache z endpointem typu proof, a cały system jest wdrażany w Kubernetes.
Przykład CRUD:
Users / Użytkownicy 
    Plik: backend/src/routes/users.js

    Endpointy:
    - GET /api/users — lista użytkowników
    - POST /api/users — utworzenie użytkownika
    - PUT /api/users/:id — aktualizacja użytkownika
    - DELETE /api/users/:id — usunięcie użytkownika

    Pola:oauthSubject, email, role
    Dostęp tylko dla roli admin.

Podobne operacje istnieją również dla shipments, warehouses, vehicles


1.Manifesty Kubernetes
Projekt zawiera katalog k8s. Manifesty obejmują minimum: Namespace, Deployment, StatefulSet, Service, Ingress, ConfigMap, Secret, PVC.
12%

Folder k8s

2.Deploymenty i rolling update
Frontend/API/worker działają jako Deployment. Backend ma minimum 2 repliki i strategię aktualizacji rolling update. Sprawdzenie: kubectl get deploy i kubectl rollout status.
10%

``` 
kubectl get deploy
    NAME       READY   UP-TO-DATE   AVAILABLE   AGE
    api        2/2     2            2           11h
    frontend   2/2     2            2           11h
    keycloak   1/1     1            1           11h
    redis      1/1     1            1           3h`
```
```
kubectl rollout status deployment api
    deployment "api" successfully rolled out
```
```
kubectl rollout status deployment frontend
    deployment "frontend" successfully rolled out
```

3.Baza danych i trwałość w Kubernetes
Baza danych działa jako StatefulSet. Musi używać PersistentVolumeClaim.
12%

```
kubectl delete pod postgres-0 
```

4.Services, Ingress i izolacja
Komunikacja wewnętrzna odbywa się przez Service. Ruch zewnętrzny przechodzi przez Ingress. Baza danych, cache i worker nie są wystawione na zewnątrz klastra.
10%

Komponenty frontend, api, keycloak, postgres oraz redis maja własny Kubernetes Service typu ClusterIP 

```
kubectl get service
    NAME       TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)    AGE
    api        ClusterIP   10.97.182.195   <none>        3000/TCP   13h
    frontend   ClusterIP   10.109.198.95   <none>        80/TCP     13h
    keycloak   ClusterIP   10.102.47.178   <none>        8080/TCP   13h
    postgres   ClusterIP   10.98.147.150   <none>        5432/TCP   13h
    redis      ClusterIP   10.106.126.71   <none>        6379/TCP   5h35m
```

  Ruch zewnętrzny przechodzi przez Ingress `xpo-logistics` dla hosta
  `xpo.local`.
  Ingress kieruje:
  - `/` do frontend,
  - `/api`, `/health`, `/ready` do backend API,
  - `/realms`, `/resources`, `/admin` do Keycloak.

  Baza danych PostgreSQL oraz cache Redis nie są wystawione na zewnątrz
  klastra. Nie mają Ingress, NodePort ani LoadBalancer, więc są dostępne
  tylko wewnątrz Kubernetes przez Service typu ClusterIP.

- Services: k8s/backend/service.yaml, k8s/frontend/service.yaml, k8s/postgres/service.yaml, k8s/redis/service.yaml
  - Ingress: k8s/ingress/ingress.yaml

5.ConfigMap i Secret
Konfiguracja niepoufna jest w ConfigMap, a dane poufne w Secret. Hasła i tokeny nie mogą być zapisane jawnie w kodzie aplikacji ani w README jako prawdziwe wartości produkcyjne.
8%


  Konfiguracja niepoufna jest przechowywana w ConfigMap:
  - `k8s/backend/configmap.yaml` zawiera PORT, OAUTH_ISSUER_URL,
  OAUTH_JWKS_URL, OAUTH_CLIENT_ID oraz REDIS_URL.
  - `k8s/postgres/configmap.yaml` zawiera POSTGRES_DB, POSTGRES_USER oraz skrypt inicjalizacyjny init.sql.
  
  Dane poufne są przechowywane w Kubernetes Secret:
  - `k8s/backend/secret.yaml` zawiera DATABASE_URL.
  - `k8s/postgres/secret.yaml` zawiera POSTGRES_PASSWORD.

  Deploymenty nie mają haseł wpisanych bezpośrednio w kodzie kontenera.
  Pobierają wartości przez `configMapKeyRef` i `secretKeyRef`.
  Na przykład backend pobiera `DATABASE_URL` z `backend-secret`,
  Postgres pobiera `POSTGRES_PASSWORD` z `postgres-secret`, a `POSTGRES_DB` i
  `POSTGRES_USER` z `postgres-config`

6.Probes i zasoby
Główne kontenery mają readinessProbe i livenessProbe oraz ustawione resources.requests i resources.limits. Sprawdzenie: szybka analiza manifestów i kubectl describe pod `nazwa poda`.
10%
``` 
spelnione 

  Backend API:
  - plik: k8s/backend/deployment.yaml
  - readinessProbe: HTTP GET /ready
  - livenessProbe: HTTP GET /health
  - requests: cpu 100m, memory 128Mi
  - limits: cpu 500m, memory 256Mi

  Frontend:
  - plik: k8s/frontend/deployment.yaml
  - readinessProbe: HTTP GET /nginx-health
  - livenessProbe: HTTP GET /nginx-health
  - requests: cpu 50m, memory 64Mi
  - limits: cpu 250m, memory 128Mi

  PostgreSQL:
  - plik: k8s/postgres/statefulset.yaml
  - readinessProbe: pg_isready
  - livenessProbe: pg_isready
  - requests: cpu 100m, memory 256Mi
  - limits: cpu 500m, memory 512Mi

  Redis:
  - plik: k8s/redis/deployment.yaml
  - readinessProbe: redis-cli ping
  - livenessProbe: redis-cli ping
  - requests: cpu 50m, memory 64Mi
  - limits: cpu 250m, memory 128Mi
```

7.SecurityContext oraz initContainer albo Job
Kontenery aplikacyjne działają jako non-root i mają podstawowy securityContext. Projekt używa initContainer albo Job do migracji bazy, inicjalizacji danych lub oczekiwania na zależności.
8%
```

  Backend API:
  - plik: k8s/backend/deployment.yaml
  - pod securityContext: runAsNonRoot: true, runAsUser: 1000, runAsGroup: 1000,
  fsGroup: 1000
  - container securityContext: allowPrivilegeEscalation: false,
  readOnlyRootFilesystem: true, capabilities drop ALL
  - initContainers:
    - wait-for-postgres - czeka aż PostgreSQL będzie gotowy
    - wait-for-keycloak - czeka aż Keycloak udostępni realm
    - wait-for-redis - czeka aż Redis odpowie PONG
```

8. CI/CD GitHub Actions
Repozytorium zawiera workflow, który buduje obraz, uruchamia testy lub podstawową walidację, publikuje obraz do rejestru i wykonuje deploy przez kubectl, Helm albo Kustomize. Workflow sprawdza rollout po wdrożeniu.
10%


Rzeczy dodatkowe spoza zajęć _BRAk_
Elementy nieomawiane bezpośrednio na zajęciach, ale przydatne przy konfiguracji lub wdrażaniu aplikacji. Suma wag: +10%.


Wymagania specyficzne dla tego projektu

9.Minimalna funkcjonalność aplikacji
Aplikacja ma jeden główny zasób biznesowy i obsługuje co najmniej dodanie danych, odczyt danych oraz endpoint /health lub /ready. Sprawdzenie: 2-3 komendy curl po wdrożeniu.
10%


Trwałość danych aplikacji
10.Dane aplikacji są zapisywane w bazie danych działającej w Kubernetes i pozostają dostępne po restarcie poda bazy. Sprawdzenie: dodać rekord, usunąć pod bazy, odczytać rekord po odtworzeniu poda.
5%


Cache, kolejka albo worker
11.Projekt zawiera dodatkowy komponent architektury, np. Redis, RabbitMQ albo worker. Musi być prosty dowód działania w CHECKLIST.md.
5%

Projekt zawiera dodatkowy komponent architektury: Redis cache.

Dowod dzialania w Kubernetes:

```bash
kubectl -n xpo-logistics get deploy/redis svc/redis
kubectl -n xpo-logistics port-forward svc/api 3000:3000
curl http://localhost:3000/api/cache-proof
curl http://localhost:3000/api/cache-proof
```

Oczekiwany rezultat: w drugiej odpowiedzi pole `proof.hits` jest wieksze niz w pierwszej, np. `1`, potem `2`. To pokazuje, ze backend zapisuje i odczytuje licznik z Redis.


## link do ostatniego udanego workflow GitHub Actions.




