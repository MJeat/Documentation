# Phase 4, Part1: Set Up Nginx to learn how the transitioning works

[Certain] You cannot run a full Nginx setup on your VPS right now because Traefik is currently binding Port 80 and Port 443, meaning your Nginx container will immediately crash with an "address already in use" error.

I disagree with just modifying your active compose file to fit Nginx on random non-standard ports because it ruins the realism of simulating a true port-80 production swap. Here's what I'd do instead: we will gracefully shut down your active Traefik container, create a completely separate, dedicated Nginx baseline environment in its own folder on your VPS, verify that Nginx is routing port-80 traffic correctly to both a web app and an API app, and then plan the dynamic transition back to Traefik. The risk in your approach of not tearing down the active Traefik setup first is that Docker will throw a socket allocation conflict, completely halting your practice before you write a single line of Nginx configuration.

---

## Part 1: The Legacy Nginx Baseline Setup

[Certain] To perform a real transition, we must first establish what we are migrating *from*. We will build a traditional Nginx reverse proxy that routes traffic to a frontend web service and an API service, applying a prefix rewrite to the API service.

1. **Free up your ports:** VPS Terminal.
Run this command inside your current `mentor-traefik-project` folder to safely stop and remove the active Traefik stack:

```bash
docker compose down

```


2. **Create a new isolation folder:** VPS Terminal.
Let's isolate our legacy Nginx baseline so we don't mess up your Traefik files:

```bash
mkdir -p ~/mentor-traefik-project/nginx-legacy
cd ~/mentor-traefik-project/nginx-legacy

```


3. **Write the Nginx Configuration File:** nginx.conf.
Create a file named `nginx.conf` in this new directory. This contains the routing logic and the manual prefix rewrite rules for our API app:

```nginx
events { worker_connections 1024; }

http {
    upstream web_backend {
        server webapp:80;
    }

    upstream api_backend {
        server apiapp:80;
    }

    server {
        listen 80;
        server_name localhost; # In production this would be your IP/domain

        # Route 1: Main public web app
        location / {
            proxy_pass http://web_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # Route 2: API app requiring a path prefix rewrite (removing /api)
        location /api/ {
            # Strip /api from the incoming request before forwarding
            rewrite ^/api/(.*)$ /$1 break;
            
            proxy_pass http://api_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
}

```


4. **Write the Nginx Docker Compose File:** docker-compose.yml.
Create a `docker-compose.yml` file inside the same `nginx-legacy` folder. This maps our custom Nginx config and spins up two backend `whoami` containers:

```yaml
services:
  nginx-proxy:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - webapp
      - apiapp

  webapp:
    image: traefik/whoami
    # No labels! Nginx does not understand them.

  apiapp:
    image: traefik/whoami
    # No labels! Nginx does not understand them.

```


5. **Launch the Legacy Stack:** VPS Terminal.
Spin up your new Nginx baseline proxy:

```bash
docker compose up -d

```


---

## Verification of the Nginx Baseline

[Certain] Once the containers are running, test both paths on your VPS to verify Nginx is actively routing and rewriting traffic:

1. **Test the main webapp route:**
```bash
curl http://159.65.131.93/

```


[Likely] You will see the container details of the `webapp` service.
2. **Test the API route with rewrite:**
```bash
curl http://159.65.131.93/api/

```


[Likely] You will see the container details of the `apiapp` service, with the path evaluated simply as `/` because Nginx stripped the `/api/` prefix.

---
