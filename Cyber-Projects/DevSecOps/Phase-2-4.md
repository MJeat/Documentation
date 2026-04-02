# Project 03: Cloudflare Tunnel + Zero Trust Access

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

# Set up Zero Trust Access (The Identity Wall) in CloudFlare One
Now, let's make it so you have to log in via email before even seeing the n8n/app screen.

- Go to Zero Trust > Access > Applications.
  - You have an issue, go to your URL and replace `/home/overview` with `/one/overview`.
  - Then, go to `Access Control` > `Applications`
- Click Add an Application > Self-hosted.
- Application Name: My Secure App.
- Add Public Hostname:
  - Default
  - Subdomain: `dockerweb`
  - Domain name: `portfoliomkc.tech`
  - Path: (Leave it as empty)
- Policies: (If you have policies, select existing. If you do not, create below)
  - Policy Name: `Allow Me`
  - Action: `Allow`
  - Include: `Emails` > Enter your email address.

<img width="663" height="677" alt="image" src="https://github.com/user-attachments/assets/20666994-7ebd-45ed-9238-a4fdd993e5c6" />

Then click Save. Once you have created this policy, you need to refresh the Application tab so that you can choose policies.

- Disable the `Accept all available identity providers` if you don't want to log in with other sites (e.g., GitHub)
- Authentication: Cloudflare will handle the "One-Time Pin" (OTP) to your email by default. No need to touch anything else.
- Keep going next, and you will be asked to choose a plan.
  - Select the `Free Plan` & enter your credit card info to prevent fraud.
  - Once done, you can refresh all pages

<img width="661" height="503" alt="image" src="https://github.com/user-attachments/assets/8d8767f5-a8cb-4513-a229-c57a8a7f6d93" />


# Result:
URL: `dockerweb.portfoliomkc.tech`

<img width="620" height="680" alt="image" src="https://github.com/user-attachments/assets/270ca2b6-3ed8-4630-8f80-64c0ee4f243e" />

- Even if you put other emails, it won't send the code to that email. The OTP code only sends to the given email during the application send up.
- Additionally, go to your registered domain name > SSL/TLS > Configure the SSL/TLS to `Flexible`.

# Explanation on why we use Flexible:

Switching to **Flexible** fixed it because it resolved a major communication mismatch between Cloudflare’s "brain" and your server's "ears."

Here is exactly what was happening behind the scenes and why that switch was the final piece of the puzzle.

### 1. The "Handshake" Breakdown

Think of the connection to your website in two distinct segments:

- **Segment A**: The Visitor ↔ Cloudflare (The Internet)
- **Segment B**: Cloudflare ↔ Your Server (The Tunnel)

When your setting was on **Full** or **Full (Strict)**, Cloudflare was trying to be "extra secure." It was telling your server: *"I will only talk to you if you speak HTTPS (Port 443)."*

But remember what we did in your `nginx.conf`? We deleted the SSL certificates and the Port 443 block. Your Nginx was only listening on **Port 80 (HTTP)**. So Cloudflare would knock on the door for Port 443, find no one home, and show **"Web Server Down."**

### 2. How "Flexible" Fixed It

By switching to **Flexible**, you changed Cloudflare’s instructions. You told it:

- "When a visitor comes to me, keep the connection secure (**HTTPS**)."
- "But when I talk to the server through the Tunnel, it’s okay to use plain **HTTP** (Port 80)."

Now, Cloudflare sends the traffic to the tunnel, the tunnel hands it to Nginx on Port 80, and Nginx says: *"Finally! I know exactly what to do with this."*

### 3. The "Security Paradox": Is Flexible actually safe?

Usually, security experts say **"Never use Flexible mode!"** This is because, on the traditional internet, Flexible mode sends data from Cloudflare to your server in plain text over the public web, where hackers could sniff it.

However, you are using a **Cloudflare Tunnel**. The Tunnel itself is a pre-encrypted, private pipe. Even though Nginx is receiving "HTTP" traffic, that traffic is inside a secure "Virtual Private Data Network.". In short, it is safe. Adding Certbot again if you are tech gaints or really need a strong security because the extra certificates setup is more complicated.  

It’s like sending a plain-text letter inside a titanium-armored briefcase. The letter is unlocked, but no one can see it because the briefcase is indestructible.

### 4. Comparison of the Modes

| SSL Mode          | Visitor ↔ Cloudflare     | Cloudflare ↔ Server      | Requirement                          |
|-------------------|--------------------------|--------------------------|--------------------------------------|
| Full (Strict)     | HTTPS (Secure)           | HTTPS (Secure)           | Valid Certbot/SSL on VPS             |
| Full              | HTTPS (Secure)           | HTTPS (Secure)           | Self-signed SSL on VPS               |
| Flexible          | HTTPS (Secure)           | HTTP (Clear)             | No SSL needed on VPS                 |

By staying on **Flexible** with a Tunnel, you get the best of both worlds:

1. **Zero Maintenance**: You never have to run Certbot again.
2. **Resource Savings**: Your Droplet doesn't have to waste CPU power encrypting and decrypting SSL packets locally. Cloudflare’s massive data centers do that heavy lifting for you.
3. **Maximum Security**: Since your DigitalOcean firewall has Port 80 and 443 closed to the public, the only way into your server is through that private, authenticated tunnel.

# Questions
> Do i need the zero trust? Let's say i want people to access my web too as public. What dont i need 

Whether you "need" Zero Trust depends entirely on who the website is for.

If you want your portfolio to be a **public website** that anyone (recruiters, friends, the internet) can visit, then **Zero Trust Access** is actually your enemy. It acts like a "Bouncer" at the door — if a recruiter clicks your link and sees a "Please Log In with your Email" screen, they will likely just close the tab.

### 🟢 What you DON'T need (For a Public Web)

If your goal is a public portfolio, you should **remove the Access Application** but keep the Tunnel.

- **Remove "Access Applications"**: In the Cloudflare Zero Trust dashboard, go to **Access > Applications** and delete (or disable) the policy for `dockerweb.portfoliomkc.tech`. This "fires the bouncer."
- **Remove "Identity Providers"**: You don't need to configure Google or Email OTP logins for the public part of your site.
- **Remove "Certbot"**: You still don't need this! The Tunnel provides the "Green Lock" for the public, so your site stays secure without the headache.

### 🛡️ What you SHOULD keep (The Tunnel)

You should definitely keep the **Cloudflare Tunnel**. Even for a public site, the Tunnel is superior to the "Old Way" because:

- Your DigitalOcean IP address stays hidden.
- Your Firewall ports (80/443) stay closed.
- Cloudflare handles the SSL (HTTPS) for the public automatically.

### 💡 The "Hybrid" Strategy (Best of Both Worlds)

Most developers use a "Split" setup. You can have both public and private areas on the same server:

1. **Public** (`portfolio.tech`): You set up a Tunnel hostname for this, but **NO** Zero Trust Access policy. Anyone can see your work.
2. **Private** (`n8n.portfolio.tech` or `admin.portfolio.tech`): You set up a Tunnel hostname for these and **DO** apply a Zero Trust Access policy. Only you can log in to manage your automation or backend.

### 🏗️ Summary: To make your site public right now

1. Keep the Tunnel running in Docker (don't change your `docker-compose.yml`).
2. Keep the Hostname in the Tunnel settings (`dockerweb.portfoliomkc.tech` → `nginx-system:80`).
3. Delete the Application in **Zero Trust > Access > Applications**.

As soon as you delete that Access Application, anyone who types in your URL will land directly on your Nginx/Frontend without being asked for an email code.

# Project 04: ...

