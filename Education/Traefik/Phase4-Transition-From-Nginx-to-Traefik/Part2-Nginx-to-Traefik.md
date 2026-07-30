# Phase 4, Part1: Set up Nginx to learn how the transition works

[Certain] Your baseline Nginx test succeeded, but you are completely blind to the fact that Cloudflare is proxying your traffic, which will silently break your Traefik Let's Encrypt HTTP-01 SSL challenge if you leave Cloudflare's proxy (orange cloud) active.

[Likely] Because Cloudflare is intercepting the requests (as seen by your `Cf-Ray` and `Cf-Connecting-Ip` headers), it acts as an intermediary SSL gateway. If you try to run Let's Encrypt HTTP validation behind a proxied Cloudflare DNS record, the validation request will fail because Cloudflare will try to answer with its own SSL certificate before the request ever reaches Traefik.

I disagree with attempting a transition while keeping Nginx's configuration on disk. Here's what I'd do instead: we will perform a total transition by deleting Nginx, writing the Traefik rules directly onto your containers using labels, and using a Traefik middleware to handle the `/api` path strip. The risk in keeping Nginx around is that you will experience port allocation conflicts on your VPS.

---

## Part 2: The Port-80 Transition (Nginx to Traefik)

[Certain] We will now translate your running Nginx config into a declarative Traefik setup. We will map Nginx's path matching and regex rewrites to Traefik **Routers** and **Middlewares**.

### Translating the Logic

* **Legacy Nginx Route 1 (`/` to webapp):**
Translates to a Traefik router with a rule: `Host("webapp.portfoliomkc.tech") && PathPrefix("/")`
* **Legacy Nginx Route 2 (`/api/` with rewrite to apiapp):**
Translates to a Traefik router with a rule: `Host("webapp.portfoliomkc.tech") && PathPrefix("/api")` paired with a `stripprefix` middleware targeting `/api`.

---

## Step-by-Step Transition

1. **Teardown Nginx:** VPS Terminal.
Stop the active Nginx baseline proxy completely to free up port 80:

```bash
docker compose down

```


2. **Create the transition directory:** VPS Terminal.
Move back to your main project folder:

```bash
cd ~/mentor-traefik-project

```


3. **Write the translated Traefik structure:** docker-compose.yml.
Overwrite your `docker-compose.yml` in this folder with the newly translated, Nginx-free configuration:

```yaml
# From Gemini: Dynamic infrastructure configuration representing a clean migration from Nginx
services:
  traefik:
    image: traefik:v3.6
    command:
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
    ports:
      - "80:80"
    volumes:
      - "/var/run/docker.sock:/var/run/docker.sock:ro"

  webapp:
    image: traefik/whoami
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.webapp.rule=Host(`webapp.portfoliomkc.tech`) && PathPrefix(`/`)"
      - "traefik.http.routers.webapp.entrypoints=web"
      - "traefik.http.services.webapp.loadbalancer.server.port=80"

  apiapp:
    image: traefik/whoami
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.apiapp.rule=Host(`webapp.portfoliomkc.tech`) && PathPrefix(`/api`)"
      - "traefik.http.routers.apiapp.entrypoints=web"
      # TRANSLATION SHIFT: Create and attach the path stripping middleware
      - "traefik.http.routers.apiapp.middlewares=api-strip"
      - "traefik.http.middlewares.api-strip.stripprefix.prefixes=/api"
      - "traefik.http.services.apiapp.loadbalancer.server.port=80"

```


4. **Launch Traefik:** VPS Terminal.
Spin up your fully translated Traefik routing ecosystem:

```bash
docker compose up -d

```


---

## Verify the Transition

[Certain] Now test your domain routes. You should see that Traefik resolves your endpoints and strips the `/api` prefix exactly like Nginx did, but without a single static proxy server configuration file.

1. **Test your webapp route:**
```bash
curl webapp.portfoliomkc.tech

```


[Likely] You will hit the `webapp` container.
2. **Test your apiapp route:**
```bash
curl webapp.portfoliomkc.tech/api/

```


[Likely] You will hit the `apiapp` container. The output `GET / HTTP/1.1` confirms the `/api` prefix was cleanly stripped before hitting the backend container.

---
