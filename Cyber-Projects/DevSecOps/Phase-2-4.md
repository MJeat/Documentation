<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/b170d0d7-9795-48d8-9a93-6b567c911ea0" /># Project 03: Cloudflare Tunnel + Zero Trust Access

<img width="840" height="802" alt="image" src="https://github.com/user-attachments/assets/8363df38-f263-4c19-a990-4b1167feeefd" />

The key insight from that diagram: your server never opens a port to the internet. cloudflared dials out to Cloudflare — the connection flows right to left, not left to right. Cloudflare holds the door open and routes traffic back through it.

## Create API Token:


API Token: `cfut_E4baEPFdGAVGpBUhpufLA7vkYvhMhy0LQrLdlHj2541b7d72`

Do not lose this API token. If you lose, you have to update the token again, and you have to renew the token.

# Create CloudFlare Tunnel:

- Name: `digitalOcean-ubuntu-king`
- Environment: Select `Docker` because we want to run the tunneling as a container alongside other containers.
  - You should get a command like this:
```
docker run cloudflare/cloudflared:latest tunnel --no-autoupdate run --token eyJhIjoiMzU2MDI2YWJiYWE3Zjk5N2QxZmJkMmVhZmQyZDg5Y2IiLCJ0IjoiOWE5MTM2YmEtYmZkNC00MjU4LTlhYzgtMjBjYmYwMTk1Yzg0IiwicyI6IlpUQTNaREU0TVdNdE1qSXhZaTAwTldVM0xUZzFaRFl0TXprek0yUTFOR1UwTm1FMCJ9
```
But you don't need to run it immediately. We want to run it in the `docker-compose.yml` so that it will be easier to edit and remember the token.

Keep an eye on the connection status:

<img width="639" height="675" alt="image" src="https://github.com/user-attachments/assets/147a5b51-2570-450c-aa10-7151ff553eb5" />

# Update `docker-compose.yml` & `nginx.conf`

This is the original `docker-compose.yml`:

```
version: '3.8'
services:
  nginx:
    image: nginx:alpine
    container_name: nginx-system
    ports:
      - "80:80"  
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    restart: always
    depends_on:
      - frontend
      - backend

  backend:
    build: ./backend
    container_name: backend-system
    ports:
      - "5001:5000"

  frontend:
    build: ./frontend
    container_name: frontend-system
    ports:
      - "8080:80"
```

This is the updated `docker-compose.yml`:

```
version: '3.8'
services:
  nginx:
    image: nginx:alpine
    container_name: nginx-system
    ports:
      - "80:80"  # # Keeping 80 open for the tunnel to talk to
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro
      # Optional to keep certbot
      # Optional to keep certbot
    restart: always
    depends_on:
      - frontend
      - backend

  backend:
    build: ./backend
    container_name: backend-system
    # No ports needed here! Only Nginx needs to see the backend. 
    restart: always

  frontend:
    build: ./frontend
    container_name: frontend-system
    # No ports needed here too
    restart: always

  cloudflare:      
    image: 
    container_name: cloudflare-tunnel
    restart: always
    command: --no-autoupdate run --token eyJhIjoiMzU2MDI2YWJiYWE3Zjk5N2QxZmJkMmVhZmQyZDg5Y2IiLCJ0IjoiOWE5MTM2YmEtYmZkNC00MjU4LTlhYzgtMjBjYmYwMTk1Yzg0IiwicyI6IlpUQTNaREU0TVdNdE1qSXhZaTAwTldVM0xUZzFaRFl0TXprek0yUTFOR1UwTm1FMCJ9
```

# Update `nginx.conf`

This is the original `nginx.conf`. You can see that I have certbot. But it is optional to use certbot:
```
server {
        listen 80 default_server;
        listen [::]:80 default_server;

        server_name dockerweb.portfoliomkc.tech;

        location /.well-known/acme-challenge/ {
                root /var/www/certbot;
        }
}

server {
        listen 443 ssl;
        listen [::]:443 ssl;

        server_name dockerweb.portfoliomkc.tech;

        ssl_certificate_key /etc/letsencrypt/live/dockerweb.portfoliomkc.tech/privkey.pem;
        ssl_certificate /etc/letsencrypt/live/dockerweb.portfoliomkc.tech/fullchain.pem;

        location / {
                proxy_pass http://frontend:80;
                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
        }

        location /api {
                proxy_pass http://backend:5000;
                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
        }
}
```

This is the updated `nginx.conf`.

```
server {
    listen 80;
    server_name dockerweb.portfoliomkc.tech;

    # Frontend
    location / {
        proxy_pass http://frontend-system:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api {
        proxy_pass http://backend-system:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**What we changed and why:**
- Deleted Certbot Volumes: You don't need them. Cloudflare provides the certificate at their "Edge" (their servers), so your local Nginx doesn't need to hold any .pem files.
- Removed Port 443 from Nginx: The tunnel "calls out" from your server to Cloudflare. When a user visits https://dockerweb..., Cloudflare sends that traffic through the tunnel and hands it to Nginx on Port 80. It’s encrypted the whole way through the tunnel!
- Private Backend/Frontend: By removing 5001:5000 and 8080:80, you’ve made it so a hacker cannot bypass Nginx and hit your apps directly by typing in your IP address. They must go through the tunnel.

Then:

```
docker compose up -d --build
```

<img width="603" height="644" alt="image" src="https://github.com/user-attachments/assets/956f125e-51bc-4ede-8a65-50f50acf40e6" />


# Configure Routing (Public Hostnames)
- Back in the Cloudflare Tunnel dashboard (where you got the token):
- Click the Public Hostname tab > Add a public hostname.
- Hostname: `dockerweb.yourdomain.com`
- Service:
  - Type: ``HTTP``
  - URL: ``nginx-system:80`` (This points the tunnel to your Nginx container).

# 


<img width="1363" height="777" alt="image" src="https://github.com/user-attachments/assets/20666994-7ebd-45ed-9238-a4fdd993e5c6" />

Then click Save. Once you have created this policy, you need to refresh the Application tab so that you can choose policies.


# Result:
URL: `dockerweb.portfoliomkc.tech`

<img width="620" height="680" alt="image" src="https://github.com/user-attachments/assets/270ca2b6-3ed8-4630-8f80-64c0ee4f243e" />



# Project 04: ...

