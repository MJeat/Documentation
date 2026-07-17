# Phase 5 - Hybrid - Nginx Works with Traefik

[Certain] I disagree with chaining Traefik and Nginx together as duplicate proxies because it adds unnecessary network hops and doubles your configuration surface. Here's what I'd do instead: assign Traefik to act exclusively as the dynamic external gateway (handling SSL and container routing) and position Nginx strictly as a specialized, ultra-fast static file asset-server inside the private network. [Likely] The risk in your approach—if you chain them sequentially with overlapping routing responsibilities—is that you will create a troubleshooting nightmare where a simple HTTP header alteration requires debugging two completely different sets of proxy logs.

---

## How This Setup Works (The Co-Existence Model)

[Certain] In high-scale production systems, Nginx and Traefik do not compete; they collaborate by dividing labor based on their strengths:

<img width="437" height="228" alt="image" src="https://github.com/user-attachments/assets/2affa947-9e30-4580-9b6a-c39dfc65884b" />

* **Traefik (The Traffic Cop):** Sits at the absolute edge (Ports 80/443). It monitors the Docker socket, manages SSL certificates, and handles raw routing decisions. It has zero knowledge of your static HTML, CSS, or JS files.
* **Nginx (The High-Speed Engine):** Sits *behind* Traefik in a private virtual network. It is not exposed to the public internet. Its only job is to receive clean, pre-routed requests from Traefik and serve static assets or cached pages with maximum execution speed and disk-caching efficiency.

---

## The Division of Labor

| Feature | Edge Ingress (Traefik) | Private Web Server (Nginx) |
| --- | --- | --- |
| **Port Bindings** | Binds public `80` and `443` | Binds private container port `80` only |
| **SSL/TLS Termination** | Handles certificates natively | Receives plain HTTP from Traefik |
| **Static File Serving** | None | Serves static assets directly from disk |
| **Dynamic Discovery** | Automatically registers new containers | Static file configurations only |

---

## Real Product Setup: The Combined Stack

[Certain] Here is the step-by-step procedure to deploy a hybrid production stack: a high-performance Nginx landing page microservice combined with a dynamic API backend, all routed seamlessly through Traefik.

1. **Prepare the project workspace:** VPS Terminal.
Clean up your workspace and create the target folders for Nginx's static files:

```bash
# From Gemini... Setup workspace
mkdir -p ~/mentor-traefik-project/hybrid-stack/html
cd ~/mentor-traefik-project/hybrid-stack

```


2. **Write the optimized Nginx backend config:** nginx.conf.
Create `nginx.conf`. This is optimized purely to serve static files with fast file-descriptor caching and browser compression:

```nginx
# From Gemini... Optimized Nginx backend config
server {
    listen 80;
    server_name {YOUR-WEBSITE / or use localhost};

    location / {
        root /usr/share/nginx/html;
        index index.html;
        
        # Fast static asset caching
        expires 1d;
        add_header Cache-Control "public, no-transform";
    }
}

```


3. **Create your static product website:** html/index.html.
Create a file named `html/index.html`. This is the high-performance marketing landing page that Nginx will serve:

```html
<!-- From Gemini... Static landing page -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Enterprise Hybrid Product</title>
    <style>
        body { font-family: sans-serif; text-align: center; padding-top: 100px; background: #f4f6f9; color: #1e293b; }
        .badge { background: #3b82f6; color: white; padding: 5px 10px; border-radius: 15px; font-size: 0.8rem; }
    </style>
</head>
<body>
    <h1>Enterprise Core Portal</h1>
    <p>This landing page is served from disk by <span class="badge">Nginx</span>.</p>
    <p>Your API traffic is handled directly by <span class="badge">Traefik</span>.</p>
</body>
</html>

```


4. **Build the hybrid orchestrator stack:** docker-compose.yml.
 
[Certain] Let's Encrypt certificate files must have restricted read/write permissions (chmod 600) or Traefik's security parser will ignore them and refuse to request certificates.

Run these commands in your hybrid-stack directory:
```
# From Gemini... Create persistent certificate storage
touch acme.json
chmod 600 acme.json
```

Create your unified `docker-compose.yml` file. This mounts Nginx as a backend worker, maps Traefik to the front, and mounts your static code volumes:

```yaml
# From Gemini... Hybrid docker-compose configuration with HTTPS
services:
  traefik:
    image: traefik:v3.6
    command:
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      # Define HTTP (80) and HTTPS (443) entrypoints
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      # Global redirection: Automatic HTTP -> HTTPS redirection
      - "--entrypoints.web.http.redirections.entrypoint.to=websecure"
      - "--entrypoints.web.http.redirections.entrypoint.scheme=https"
      # Let's Encrypt Automated Resolution (HTTP-01 Challenge)
      - "--certificatesresolvers.myresolver.acme.email=your-email@example.com"
      - "--certificatesresolvers.myresolver.acme.storage=acme.json"
      - "--certificatesresolvers.myresolver.acme.httpchallenge=true"
      - "--certificatesresolvers.myresolver.acme.httpchallenge.entrypoint=web"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - "/var/run/docker.sock:/var/run/docker.sock:ro"
      - "./acme.json:/acme.json" # Mount the persistent certificate store

  # Nginx serves the root website
  nginx-static:
    image: nginx:alpine
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - ./html:/usr/share/nginx/html:ro
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.static-site.rule=Host(`webapp.portfoliomkc.tech`) && PathPrefix(`/`)"
      - "traefik.http.routers.static-site.entrypoints=websecure" # Use HTTPS entrypoint
      - "traefik.http.routers.static-site.tls=true" # Enable TLS
      - "traefik.http.routers.static-site.tls.certresolver=myresolver" # Assign the resolver
      - "traefik.http.services.static-site.loadbalancer.server.port=80" # Forward HTTP to Nginx internally

  # Dynamic container handles API routes
  api-service:
    image: traefik/whoami
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.api-route.rule=Host(`webapp.portfoliomkc.tech`) && PathPrefix(`/api`)"
      - "traefik.http.routers.api-route.entrypoints=websecure" # Use HTTPS entrypoint
      - "traefik.http.routers.api-route.tls=true" # Enable TLS
      - "traefik.http.routers.api-route.tls.certresolver=myresolver" # Assign the resolver
      - "traefik.http.routers.api-route.middlewares=api-strip"
      - "traefik.http.middlewares.api-strip.stripprefix.prefixes=/api"
      - "traefik.http.services.api-service.loadbalancer.server.port=80"

```


5. **Deploy and verify performance:** VPS Terminal.
Launch the integrated stack:

```bash
# From Gemini... Spin up hybrid stack
docker compose up -d

```


---

## Verifying the Production Results

[Certain] To verify that Traefik is perfectly dividing labor between Nginx and your API container, run these test calls:

1. **Test the root page (served by Nginx):**
```bash
curl webapp.portfoliomkc.tech

```


[Certain] You will see the raw HTML of your landing page, delivered with sub-millisecond file execution speed by Nginx.
2. **Test the `/api` route (served by API container):**
```bash
curl webapp.portfoliomkc.tech/api/

```


[Certain] Traefik intercepts this route, strips `/api`, and sends it straight to the dynamic Go webapp container, completely bypassing Nginx.


### Lastly

Make sure your Cloudflare SSL/TLS encryption mode is set to Full (Strict) in your Cloudflare dashboard. If it is set to "Flexible," Cloudflare will hit an infinite redirection loop with Traefik's port 80 redirection rule.
