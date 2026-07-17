# Phase 3: Create HTTPS Using Let's Encrypt 

[Certain] Moving straight to SSL configuration without first confirming your DNS A-record points to your VPS IP is a recipe for instant Let's Encrypt rate-limiting blocks.

Before writing code, you must create a DNS **A record** in your domain provider’s dashboard (e.g., Namecheap, Cloudflare, GoDaddy).

* **Type:** `A`
* **Name:** `webapp` (and another one for `secure` if you wish, or a wildcard `*` pointing to your VPS)
* **Value/IP:** `159.65.131.93`
* **TTL:** `Automatic` or `3600`

---

## Phase 3: Natively Automated SSL/TLS

* **Objective:** Connect your live subdomain and enable automatic HTTPS encryption.
* **Goal:** Prove Traefik fetches and manages SSL certificates silently in the background without Certbot.

### The Mechanics of the HTTP Challenge

[Certain] To prove you own the domain name, Let's Encrypt needs to run a verification challenge.

[Certain] As illustrated in the diagram:

1. **Request:** Traefik contacts the Let's Encrypt CA server requesting a certificate for your domain name.
2. **Challenge:** Let's Encrypt generates a temporary token and tells Traefik: *"Host this token at `http://<YOUR_DOMAIN>/.well-known/acme-challenge/<TOKEN>`"*.
3. **Verification:** Let's Encrypt calls port 80 of your VPS IP. Traefik intercepts the challenge path automatically, serves the token, and verifies ownership.
4. **Delivery:** Once validated, Let's Encrypt issues the TLS certificate, which Traefik saves inside an internal file named `acme.json`.

---

### Step-by-Step Implementation

[Certain] We need to adjust our Traefik configuration to support secure HTTPS traffic on port 443, set up our certificates file, and pass your dynamic domain as the host rule.

1. **Prepare the certificate storage file:** VPS terminal.
Let's Encrypt certificates contain private keys. Traefik requires the storage file to have highly restrictive access permissions (`chmod 600`) or it will refuse to run. Run this in your project folder:

```bash
touch acme.json
chmod 600 acme.json

```


2. **Write the secure docker-compose.yml:** VPS terminal.
Open `docker-compose.yml` and overwrite it completely with the code below. **REPLACE** `yourdomain.com` with your real domain name, and `your-email@example.com` with your real email address (Let's Encrypt uses this to notify you about domain issues):

```yaml
services:
  traefik:
    image: traefik:v3.6
    command:
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      # Entry points
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      # Automatic HTTP to HTTPS redirection
      - "--entrypoints.web.http.redirections.entrypoint.to=websecure"
      - "--entrypoints.web.http.redirections.entrypoint.scheme=https"
      # Let's Encrypt (ACME) Configuration
      - "--certificatesresolvers.myresolver.acme.email=your-email@example.com"
      - "--certificatesresolvers.myresolver.acme.storage=acme.json"
      - "--certificatesresolvers.myresolver.acme.httpchallenge=true"
      - "--certificatesresolvers.myresolver.acme.httpchallenge.entrypoint=web"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - "/var/run/docker.sock:/var/run/docker.sock:ro"
      - "./acme.json:/acme.json" # Persist SSL certificates on your host

  webapp:
    image: traefik/whoami
    labels:
      - "traefik.enable=true"
      # REPLACE WITH YOUR REAL SUBDOMAIN
      - "traefik.http.routers.webapp.rule=Host(`webapp.yourdomain.com`)"
      - "traefik.http.routers.webapp.entrypoints=websecure"
      - "traefik.http.routers.webapp.tls=true"
      - "traefik.http.routers.webapp.tls.certresolver=myresolver"
      - "traefik.http.services.webapp.loadbalancer.server.port=80"

  secureapp:
    image: traefik/whoami
    labels:
      - "traefik.enable=true"
      # REPLACE WITH YOUR REAL SUBDOMAIN
      - "traefik.http.routers.secureapp.rule=Host(`secure.yourdomain.com`)"
      - "traefik.http.routers.secureapp.entrypoints=websecure"
      - "traefik.http.routers.secureapp.tls=true"
      - "traefik.http.routers.secureapp.tls.certresolver=myresolver"
      - "traefik.http.services.secureapp.loadbalancer.server.port=80"
      
      # MIDDLEWARE
      - "traefik.http.routers.secureapp.middlewares=auth-lock"
      - 'traefik.http.middlewares.auth-lock.basicauth.users=admin:$$apr1$$bQ/4N5xX$$7q7gA3z.tP6WfN6cW24mc/'

```


3. **Deploy and inspect handshake logs:** VPS terminal.
Start the stack. This will pull down standard configuration elements and register ports 80 and 443 on your VPS:

```bash
docker compose up -d

```

Then immediately run this command to watch Traefik talk to Let's Encrypt:

```bash
docker compose logs -f traefik

```

---
# How To Renew and Remove Cert? Disable HTTPS

> i have questions. So it renew my certs automatically? right? how long will it renew? 90 days? what if i wanna modify to 60 days instead? 

Also, what if i wanna remove the cert? do i just delete the acme.json and the 443 commands and volumes?
You are assuming you can manually dictate the renewal interval, but you cannot arbitrarily override the 90-day lifetime of a standard Let's Encrypt certificate because the certificate authority, not Traefik, sets this hard limit.

### How Traefik Handles Certificate Renewal

[Certain] Standard Let's Encrypt certificates are valid for exactly 90 days. [Certain] Traefik automatically manages the renewal of these certificates in the background.

However, [Certain] Traefik's internal logic is designed to trigger the renewal process when a certificate has **30 days** remaining before expiration. Consequently, Traefik already automatically renews your certificates at the 60-day mark of their lifespan. [Likely] This is exactly the timing window you are trying to configure, meaning no manual modifications to the renewal interval are necessary or possible.

---

### Removing a Certificate Safely

I disagree because deleting `acme.json`, the port 443 configurations, and your volumes is a destructive overkill that will completely break HTTPS for all of your services, not just remove a single certificate.

Here's what I'd do instead:

1. **Remove the Router TLS Association:**
[Certain] Traefik only generates and serves certificates for domains bound to routers with a defined Certificate Resolver. If you want to stop securing a specific domain, simply remove the `certresolver` label or configuration block from that specific container or service. For example, delete the label:
`traefik.http.routers.your-router-name.tls.certresolver=your-resolver`
2. **Clean up `acme.json` (Optional):**
If you want to completely purge the old domain's certificate data from Traefik's storage without losing your other certificates or your Let's Encrypt account keys:
* Stop the Traefik container.
* Create a backup of your `acme.json` file.
* Open the original `acme.json` file, find the `"Certificates"` array under your resolver block, and delete the specific JSON object block containing the unwanted domain.
* Save the file and restart Traefik.



The risk in your approach of nuking the entire `acme.json` file, your volumes, and the 443 entrypoint is that you destroy your persistent ACME account keys and globally disable secure traffic. When Traefik restarts, it will be forced to register a brand-new ACME account and request fresh certificates for *every single domain* configured on your server. This can easily trigger Let's Encrypt's strict rate limits (currently 5 duplicate certificates per week), locking your domains out of HTTPS entirely for up to 7 days.



