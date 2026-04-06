# Project 03: Cloudflare Tunnel + Zero Trust Access

<img width="840" height="802" alt="image" src="https://github.com/user-attachments/assets/8363df38-f263-4c19-a990-4b1167feeefd" />

The key insight from that diagram: your server never opens a port to the internet. cloudflared dials out to Cloudflare — the connection flows right to left, not left to right. Cloudflare holds the door open and routes traffic back through it.

## Create a Scoped API Token:
Cloudflare needs a "key" to manage your DNS records automatically.

- Log in to your Cloudflare Dashboard.
- Go to My Profile (top right) > API Tokens.
- Click Create Token > Use the Edit zone DNS template.
- Permissions:
Zone | DNS | Edit

Zone | Zone | Read

- Zone Resources:
Include | Specific zone | yourdomain.com

- Copy the token immediately. You will not see it again.
API Token: `cfut_E4baEPFdGAVGpBUhpufLA7vkYvhMhy0LQrLdlHj2541b7d72`

Do not lose this API token. If you lose, you have to update the token again, and you have to renew the token.

# Scoped API Token explain
Think of this **API Token** as a highly specific "Digital Key" that you are giving to your server. 

In the past, people used "Global API Keys," which are dangerous because if a hacker steals one, they can delete your entire Cloudflare account. A **Scoped Token** only has the power to do exactly what you tell it to do.

Here is the breakdown of those specific settings and why they are required:

### 1. Permissions: The "What"

This defines the specific actions your server is allowed to perform.

- **Zone | DNS | Edit**:  
  This is the most important permission. When you create a Cloudflare Tunnel, Cloudflare needs to automatically create a "CNAME" record (like `dockerweb.yourdomain.com`) that points to your tunnel’s unique ID. Without "Edit" permission, your server would tell Cloudflare "I'm ready!", but Cloudflare would reply "I'm not allowed to update your DNS records for you."

- **Zone | Zone | Read**:  
  This is like giving your server a "Map." Before it can edit a DNS record, it needs to be able to "see" your domain settings to verify that the domain actually exists and belongs to you.

### 2. Zone Resources: The "Where"

This limits the reach of the key.

- **Include | Specific zone | yourdomain.com**:  
  If you have 5 different websites on your Cloudflare account, you don’t want your one DigitalOcean server to have power over all of them. By selecting "Specific zone," you are telling Cloudflare:  
  *"This key only works for yourdomain.com. It is useless if someone tries to use it on my other domains."*  
  This is a massive security win.

### 3. Why the "Edit Zone DNS" Template?

Cloudflare provides several templates to make life easier. Using the **"Edit Zone DNS"** template pre-fills the most common settings needed for automated tools like Cloudflare Tunnel.  

It saves you from having to manually hunt through hundreds of possible permissions (like Firewall rules, Workers, or Billing) and accidentally clicking the wrong one.

### 4. The "Copy and Hide" (Security)

Cloudflare uses Secret-based authentication. Once that token is generated, Cloudflare "hashes" it (scrambles it) and stores only the scrambled version. They literally **cannot** show you the original token again because they don’t have it.  

If you lose it, you have to "Roll" the token (generate a new one), which will immediately break your server’s connection until you update the code on your VPS.


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
- Session Duration: 24 Hours `(Note: This is the "how long it remembers your login cache before asking you to give your email verification again")`
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
- Additionally, you have to close ALL ports, except 22/tcp (SSH)
```
# 1. Reset UFW to factory defaults (This will ask for confirmation)
sudo ufw reset

# 2. Set default policies: Block everything coming in, allow everything going out
sudo ufw default deny incoming
sudo ufw default allow outgoing

# 3. CRITICAL: Allow SSH so you don't get kicked out
sudo ufw allow 22/tcp
sudo ufw allow 5678    # if you have other running services, you can allow here.

# 4. Enable the firewall
sudo ufw enable
```
 
- Lastly, go to your registered domain name > SSL/TLS > Configure the SSL/TLS to `Flexible`.

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

# Question 2
> what's the difference between cloudflare tunnelling and VPN? In short

In short, while both create a secure "pipe" for data, they are built for different purposes.

### The Quick Comparison

| Feature          | Cloudflare Tunnel                                      | Traditional VPN                                      |
|------------------|--------------------------------------------------------|-----------------------------------------------------|
| Direction        | Outbound: Your server "calls" Cloudflare               | Inbound: You "call" your server                     |
| Firewall         | Total Lockdown: All ports remain closed                | Open Door: Requires opening a port (like 1194)      |
| Scope            | Surgical: Shares one specific app/website              | Broad: Shares the entire network                    |
| User Setup       | Zero: Users just need a web browser                    | High: Users must install a VPN client app           |

### 1. The "Invisible Man" vs. The "Keyholder"

- **VPN**: You have to poke a hole in your firewall (Port Forwarding) so you can "reach in" from the outside. If a hacker finds that open port, they can try to pick the lock. Once you're "in" via VPN, you can usually see everything on the network (the printer, other PCs, etc.).
- **Tunnel**: Your server reaches out to Cloudflare and stays connected. Because your server started the conversation, your firewall stays **100% closed** to the outside world. It is invisible to port scanners.

### 2. Application vs. Network

- **VPN**: Designed to make your remote laptop feel like it's plugged into the office router. It’s for **Network Access**.
- **Tunnel**: Designed to put a specific app (like your Nginx web or n8n) on the internet securely. It’s for **Application Access**.

### 3. Zero Trust vs. Implicit Trust

- **VPN**: Operates on **"Implicit Trust."** Once you have the VPN password, the network trusts you completely. If a hacker steals your VPN key, they have the "run of the house."
- **Tunnel (with Zero Trust)**: Operates on **"Never Trust, Always Verify."** Every single click is checked against your identity (Email, Google, etc.). You don't just "log in to the network"; you are authorized for that one specific website and nothing else.

### Which one do you need?

- **Use a VPN** if you want to SSH into your server, access local files, or print a document from a different city.
- **Use a Tunnel** if you want to host a website or service (like n8n) so that you (or the public) can access it easily via a URL.


# Project 04: Tailscale VPN Mesh + CoreDNS Internal Resolver

## Set up Tailscale on Ubuntu
Installation: 
```
sudo apt update && curl -fsSL https://tailscale.com/install.sh | sh 
```
Then turn the service up and get the IPv4 (You need to log in via the provided link first): 
```
sudo tailscale up && sudo tailscale ip
```

Next, let's test if it works. On your laptop/PC, try connecting to your Tailscale console network. Then, ping the tailscale IPv4. It should respond. Then, disconnect your laptop from the Tailscale network & ping again. It shouldn't work. 

Let's turn the Tailscale connection back on and try to SSH: 
```
ssh root@{TAILSCALE-IP}
```

It should work, and it won't ask for a password since you already made the authentication as keys-based, not password-based.

Now that we have established a connection that only we can enter, we can test more.

We will allow all traffic from the Tailscale interface. This tells the firewall: `"If the traffic is coming from my private Tailscale network, I trust it completely."`

```
sudo ufw allow in on tailscale0
```

Then, we remove the Public SSH rule. We are going to stop allowing SSH from "Anywhere."

```
sudo ufw delete allow 22/tcp
```
Finally, if you haven't already reset your UFW, let's make it lean:

```
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw enable
```

On your SSH software (Termius, PuTTY, or Tabby):
- Keep your 22 port and SSH keys location
  - Question:
> port 22 is already closed, why have port? Answer: Your network has two adapters now (`eth0` and `tailscale0`). You block everything in `eth0` (no one can scan for the open ports), while your system accepts EVERYTHING coming from your tailscale IP because we allow `tailscale0`. For the ports, it can be any ports. But to keep things simple, since you are using SSH, just keep the 22 port.

- Replace your VPS public IPv4 with Tailscale IPv4
- Connect your laptop/PC to the Tailscale network

Now, we have established a connection that only we can enter.

## Set up CoreDNS

### Why are we using CoreDNS?

Right now, to see Beszel, you have to type `http://100.x.x.x:8090`. Humans are terrible at remembering numbers, but great at remembering names like `monitor.internal`.

Tailscale has a feature called **MagicDNS**, but it only gives you names based on your machine names (like `ubuntu-king.tailnet-name.ts.net`).  

**CoreDNS** gives you total creative freedom. You can make up any domain you want (`.internal`, `.home`, `.cool`) and point it wherever you like. It's also incredibly lightweight, making it perfect for your 1GB Droplet.

### Step 1: Create the Folder Structure

We need a place to store the configuration files so they don't get lost if the Docker container restarts.

```
mkdir -p ~/docker-app/coredns
cd ~/docker-app/coredns
```

- `mkdir -p`: Create directory. The `-p` flag means "create parent folders if they don't exist."
- `cd`: Change directory into the new folder.

### Step 2: Create the "Corefile" (The Brain)

The Corefile tells CoreDNS how to behave. It’s like the "Settings" menu for the DNS server.

Create the file (Location: docker-app/coredns/):

```
nano Corefile
```

Paste the following:

```
internal {
    file /etc/coredns/db.internal
    log
    errors
}

. {
    forward . 1.1.1.1
    cache 30
}
```

**What does this mean?**

- `internal { ... }`: This is a Server Block. It tells CoreDNS: "If anyone asks for a name ending in `.internal`, look inside this block for the answer."
- `file /etc/coredns/db.internal`: Tells it to look at a specific "Map" file (which we will create next). This is inside the container of CoreDNS.
- `log` & `errors`: Prints useful information to the Docker logs — great for troubleshooting.
- `. { ... }`: The "Everything else" block.
- `forward . 1.1.1.1`: Recursive DNS. If you ask for `google.com`, CoreDNS will ask Cloudflare’s DNS (1.1.1.1).
- `cache 30`: Remembers answers for 30 seconds to improve speed.

### Step 3: Create the Zone File (The Map)

This is where we actually define the names (called a Zone File in DNS).

Create the file:

```
nano db.internal
```

Paste this (replace `100.x.x.x` with your actual Tailscale IP):

```
$ORIGIN internal.
@   IN  SOA sns.dns.icann.org. noc.dns.icann.org. 2017042745 7200 3600 1209600 3600
@   IN  NS  localhost.

monitor     IN  A   100.x.x.x
```

**What does this mean?**

- `$ORIGIN internal.`: Sets the base domain. Everything below will end with `.internal`.
- `monitor IN A 100.x.x.x`: The most important line — it maps `monitor.internal` to your VPS’s Tailscale IP.

### Step 4: The Docker Compose Setup

Add this service to your `docker-compose.yml`:

```
  coredns:
    image: coredns/coredns:latest
    container_name: coredns-internal
    restart: always
    volumes:
      - ./coredns:/etc/coredns
    ports:
      - "100.x.x.x:53:53/udp"
      - "100.x.x.x:53:53/tcp"
    command: -conf /etc/coredns/Corefile
```

**Why these settings?**

- `volumes`: Links your local folder to the container so it can read your `Corefile` and `db.internal`.
- `ports`: Binds DNS port 53 **only** to your Tailscale IP. This prevents the public internet from using your VPS as an open DNS resolver (which can lead to attacks).

### Step 5: The "Tailscale Handshake"

Even though the server is running, your laptop doesn’t know about it yet.

1. Go to your **Tailscale Admin Dashboard**.
2. Navigate to **DNS → Nameservers**.
3. Click **Add Nameserver → Custom...**
4. Enter your VPS Tailscale IP (`100.x.x.x`).
5. Make sure your IP appears in the Global Nameservers section.
6. (Recommended / Optional) Enable **Split DNS**:
   - Toggle it on and add `internal` as the domain. This tells your laptop: *"Use normal DNS for everything except names ending in `.internal` — for those, ask the VPS."*

Or you can simply do this and continue the test:

<img width="891" height="195" alt="image" src="https://github.com/user-attachments/assets/f18b305a-00ab-4904-a338-57ef4983ca2c" />


### The Test

Once you run `docker compose up -d`, wait 10 seconds, then on your laptop (with Tailscale ON), run:

```
nslookup monitor.internal
```

## Set up Beszel for Monitoring
Add this to your `docker-compose.yml`:

```
beszel:
    image: henrygd/beszel:latest
    container_name: beszel-hub
    restart: unless-stopped
    ports:
      - "100.x.x.x:8090:8090" # Only accessible via Tailscale
    volumes:
      - ./beszel_data:/beszel_data
```

Then, run: `docker compose up -d beszel`

## Set up Beszel Agent for communicating with Beszel (Hub)

Now that the Hub (your dashboard) is up, you need to install the **Agent** (the worker). The Hub is just a viewer — the Agent is what actually collects the CPU, RAM, and Docker data. Since we’re keeping this server a "Ghost," we’re going to connect the Agent to the Hub internally.

### 1. Get your Public Key

1. Open Beszel in your browser (`http://monitor.internal:8090`).
2. Click the **"Add System"** button in the top right.
3. A window will pop up. You will see a long string starting with `ssh-ed25519 ...`

Or you can just follow step 2 below.

### 2. Update your `docker-compose.yml`

Add the following `beszel-agent` service to your file. For the agent, you should just scroll to the left and click `Edit` > `Copy Docker Compose`

<img width="1267" height="538" alt="image" src="https://github.com/user-attachments/assets/4b03fc22-dc14-46dc-96e4-6037779ddfaf" />

And the `Host/IP` should be your Tailscale IP.

```
  beszel-agent:
    image: henrygd/beszel-agent
    container_name: beszel-agent
    restart: unless-stopped
    network_mode: host
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./beszel_agent_data:/var/lib/beszel-agent
      # monitor other disks / partitions by mounting a folder in /extra-filesystems
      # - /mnt/disk/.beszel:/extra-filesystems/sda1:ro
    environment:
      LISTEN: 45876
      KEY: 'ssh-ed25519 {KEY}'
      TOKEN: {TOKEN}
      HUB_URL: http://monitor.internal:8090
```

**Why these settings?**

- `network_mode: host`: Essential for accurate monitoring. It allows the agent to see the actual Ubuntu hardware stats instead of just the container’s limited view.
- `/var/run/docker.sock`: Gives the agent read-only access to Docker. This lets Beszel show resource usage of your other containers (Nginx, n8n, etc.).
- `PORT=45876`: The default communication port used by Beszel.

### 3. Deploy the Agent

Run this command to start the agent:

```
docker compose up -d beszel-agent
```

### 4. Finalize in the Dashboard

1. Go back to the **"Add System"** popup in your Beszel dashboard.
2. **Name**: Call it `Ubuntu-King` (or whatever you like).
3. **Host/IP**: Enter Tailscale IP (since the agent is on the same machine as the Hub).
4. **Port**: `45876`
5. Click **"Add System"**.

Within about 10–30 seconds, the red dot will turn green. You’ll start seeing:
- Real-time CPU and RAM graphs.
- A **"Docker"** tab showing exactly how many resources your other containers (frontend, backend, n8n, etc.) are using.
- Disk space usage and alerts.

# Phase 4 Conclusions:

This is from using the DNS name from CoreDNS:

<img width="804" height="461" alt="image" src="https://github.com/user-attachments/assets/957c6af4-d308-4173-b0aa-ddc69bab1ff3" />


You can still access the Beszel hub via the Tailscale IP, but:
- It can take time to type
- You might even forget the IP, so you have to open Tailscale to check for its IP, which is more time-consuming
- You expose your Tailscale IP. You expose your IP in general. In general, we use DNS to hide our IP.

<img width="717" height="551" alt="image" src="https://github.com/user-attachments/assets/ffab89a1-f83e-44d6-b71c-596dde3c9500" />


And the main server is now called `monitor.internal`:

<img width="477" height="277" alt="image" src="https://github.com/user-attachments/assets/b1f9778b-9bd8-40d4-93e3-cba56aa93c03" />

However, this can only be accessed via Tailscale. Your CloudFlare subdomain is still out there, even if you disconnect from the Tailscale network:

<img width="506" height="282" alt="image" src="https://github.com/user-attachments/assets/5ed9c780-84f7-4475-abdf-f7253d88ac59" />



