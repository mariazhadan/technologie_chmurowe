# CHECKLIST

## Cache, kolejka albo worker

Projekt zawiera dodatkowy komponent architektury: Redis cache.

Dowod dzialania w Kubernetes:

```bash
kubectl -n xpo-logistics get deploy/redis svc/redis
kubectl -n xpo-logistics port-forward svc/api 3000:3000
curl http://localhost:3000/api/cache-proof
curl http://localhost:3000/api/cache-proof
```

Oczekiwany rezultat: w drugiej odpowiedzi pole `proof.hits` jest wieksze niz w pierwszej, np. `1`, potem `2`. To pokazuje, ze backend zapisuje i odczytuje licznik z Redis.

## Horizontal Pod Autoscaler

Backend API ma skonfigurowany HPA dla Deploymentu `api`.

```bash
kubectl -n xpo-logistics get hpa api-hpa
kubectl -n xpo-logistics describe hpa api-hpa
```

Warunek dzialania: w klastrze musi byc zainstalowany Metrics Server, np. w Minikube:

```bash
minikube addons enable metrics-server
```
