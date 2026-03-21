# Project 01 — Personal VPS + Static IP + Domain Setup
# Initializations:
## 1. Creating SSH Key in DigitalOcean
In Tabby (Windows 11):
- Create an SSH key (public & private) via CMD or PowerShell: ```ssh-keygen```
- It will ask for the location, just copy-paste the option that it gives you.<br>
- Then, if asked for a passphrase, just type Enter. Then, you will see the files and their location.<br>

### Get into the file location
To get the file location, 
1. File Explorer > Search Bar > ```%USERPROFILE%\.ssh```
2. In CMD > ```type C:\Users\User\.ssh\{FILE-NAME}.pub``` <br>
Example: ```type C:\Users\User\.ssh\id_ed25519.pub```

### Big Picture Example:
**Where are they hiding**
On your computer, the keys are located in a hidden folder:

- Path: ```C:\Users\User\.ssh```
- Private Key: ```id_ed25519``` (This is your "password," keep it secret!)
- Public Key: ```id_ed25519.pub``` (This is what you give to DigitalOcean. Just copy the entire line in the .pub file)


## 2. Creating a Droplet

### Reserved IP
- A Reserved IP is a static public IP address that you can move between servers (Droplets). <br>
- Normally, when you create a server in DigitalOcean, it receives a public IP. If that server is destroyed, the IP disappears. A Reserved IP solves this by detaching the IP from the server.
- It allows fast failover and high availability.
- If the primary server crashes, you simply reassign the Reserved IP to the backup server.
- Traffic immediately switches to the backup.

### Anchor IP
- An Anchor IP is a static IP assigned to a Droplet's private network interface.
- It acts as a permanent IP anchor for services running inside the server.
- It allows services to bind to a stable IP inside the droplet.
- Sometimes applications require a dedicated IP address for routing or networking purposes. Especially for:
  - container networking
  - virtualization
  - load balancing
  - advanced routing

## 3. Pointing Subdomain
- Go to CloudFlare Domain > Choose your root domain > DNS Record > Create A record > Name (This is your subdomain name), Target (Paste your reserved IP), Allow Proxied
- Next, go to DigitalOcean [Domain](https://cloud.digitalocean.com/networking/domains?i=5655de) > Add Domain > Type your Subdomain name from CloudFlare > Done.
  - You don't need to take DigitalOcean nameservers unless you want to use DigitalOcean’s "App Platform" or certain automated "Load Balancer" features where DO needs to create DNS records for you automatically. For a standard Ubuntu Droplet with a Reserved IP, Cloudflare is the superior choice.


# Project 02 — Nginx Reverse Proxy + HTTPS via Let's Encrypt

## 1. tasks.html
Vibe coded via Claude AI. It is stored in the `/var/www/html/`

## 2. Nginx
I tested using the default version in the /etc/nginx/sites-available/default. It works fine. But, what if I want to create a new file in the future from scratch?
You should never delete the default file. It’s the ultimate "cheat sheet"—if you ever forget how to write a specific line, you can just cat the default file to see how it's done.

1. Create .html file
- Go to /var/www/html/
- ```nano my-learning.html```
- Paste your .html code here & CTRL+S & CTRL+X


2. "Deactivate" the default site (Without deleting)
Nginx only runs files that are inside sites-enabled. To turn off the default site, just remove the shortcut (symlink), not the actual file.

### Remove the shortcut to deactivate the default site
```
sudo rm /etc/nginx/sites-enabled/default
```

Note: The original file still lives safely in `/etc/nginx/sites-available/default`.

3. Create your new config from scratch

Now, create a brand new file in sites-available. Let’s call it my-learning.conf.

```
sudo nano /etc/nginx/sites-available/my-learning.conf
```

Then, go write something you want in that file.

4. "Activate" your new site

To tell Nginx to start using this file, you create a Symbolic Link (a shortcut) from sites-available to sites-enabled.

```
sudo ln -s /etc/nginx/sites-available/my-learning.conf /etc/nginx/sites-enabled/
```
5. The "Safety Check" (Don't skip this!)

Before you apply the changes, always ask Nginx if you made a typo.

```
sudo nginx -t
```
If it says "syntax is ok" and "test is successful," you are golden.

6. Reload Nginx
Instead of restart, use reload. This keeps the server running but swaps out the "brain" (the config).
```
sudo systemctl reload nginx
```

### 2.1. Nginx - Index File
There's a difference when you store the file in ``/var/www/html``versus in other internal servers, such as Docker containers. You have to write the sites-available/ differently. In this point, we will talk about when storing in `/var/www/html`

This is how you need to write in the `my-learning.conf` file:
```
server {
        listen 80 default_server;
        listen [::]:80 default_server;  # tells the server to accept IPv6 HTTP traffic on port 80
        server_name _;  # This you’ve told Nginx: "I don't have a domain yet, so just show this to anyone who types my Server IP into their browser."

        root /var/www/html;  # This is the point   
        index my-learning.html;    # This is the point

        location / {
                try_files $uri $uri/ =404;
        }
}
```

### 2.2. Nginx - Subdomain/Domain Name
To set up a domain name:
- Go to your preferred CloudFlare Domain Records
- Create (Record: A, Name: {YOUR-SUBDOMAIN-NAME}, Proxies ON) > Save <br>
Next, you should have this in your my-learning.conf:
```
server {
        listen 80 default_server;
        listen [::]:80 default_server; # IPv6
        server_name YOUR-SUBDOMAIN-NAME;       

        root /var/www/html;     
        index tasks.html;

        location / {
                add_header Content-Security-Policy "upgrade-insecure-requests";   # Add a special header that tells the browser to automatically treat every request as secure. This often solves the "Unsafe attempt" error.
                try_files $uri $uri/ =404;
        }
}
```

In a standard setup, Cloudflare acts as a translator. If your server only speaks HTTP (Port 80) but Cloudflare is trying to speak HTTPS (Port 443), the translation fails, and your browser gets confused (hence the "Unsafe attempt" and "Host Error").

Since your Nginx is only listening on Port 80, this will be an expected error

<img width="800" height="300" alt="image" src="https://github.com/user-attachments/assets/fe4ebfb6-39b8-41c6-a3c9-2f55b0254723" />

You must tell Cloudflare not to look for an SSL certificate on your server.
- Log in to Cloudflare.
- Go to SSL/TLS -> Overview.
- Change the encryption mode to Flexible.

<img width="637" height="332" alt="image" src="https://github.com/user-attachments/assets/1f8fc225-1ebb-4bd9-9a70-a282f7be0381" />

- This means: `Browser -> (HTTPS) -> Cloudflare -> (HTTP) -> Your Server.`
- Wait 60 seconds.
- Try your domain again. It should now render perfectly!

However, you should eventually move to Port 443. While "Flexible" works, it's not the "Pro" way because the data between Cloudflare and your server is unencrypted. To go "Full Strict" (the gold standard), you need Nginx to listen on Port 443.

**This is what the `Not Secure` web looks like using:**
```
curl -I {PUBLIC-IP} 
```
The `Not Secure` sites have HTTP/1.1

<img width="391" height="180" alt="image" src="https://github.com/user-attachments/assets/c08c1082-46da-4e98-82cd-2aa0199202d5" />

<br>

**This is what the `Secure` web looks like using:**
```
curl -I {DOMAIN-NAME}
```
The `Secure` sites have HTTP/2

<img width="794" height="286" alt="image" src="https://github.com/user-attachments/assets/731464ce-d8a2-44d7-92f8-b966e6518396" />



### 2.3. Nginx - Adding Letsencrypt & CloudFlare Full SSL/TLS

To get your server ready for Cloudflare Full (Strict) mode, you need a "legit" certificate on your origin server (your DigitalOcean droplet).

Here is the breakdown of the tools and the step-by-step guide to setting them up.

1. What are these things? <br>
Let's Encrypt: This is a non-profit Certificate Authority (CA). They are like a digital "Notary" that issues SSL certificates for free so the whole world can use HTTPS.

**Certbot**: This is the Software Client. Since you don't want to manually copy-paste long encryption keys every 90 days, Certbot sits on your server and automatically talks to Let's Encrypt to fetch, install, and renew your certificates.

2. Preparation: Open the Gates <br>
Before running Certbot, make sure your firewall allows HTTPS traffic (Port 443).
```
sudo ufw allow 443/tcp
sudo ufw reload
```
3. Install Certbot
On Ubuntu, the most reliable way to install Certbot is using apt.

```
sudo apt update
sudo apt install certbot python3-certbot-nginx -y
```
4. Run Certbot (The Magic Part)
Certbot has a specific plugin for Nginx. It will read your /etc/nginx/sites-available/tasks.conf file, look for your server_name, and ask Let's Encrypt for a certificate for that specific domain.

Run this command:

```
sudo certbot --nginx -d tasks.portfoliomkc.tech
```
(Replace tasks.portfoliomkc.tech with your actual subdomain)

What happens next:
- Email: It will ask for an email (for renewal warnings).
- Terms: Press A to agree.
- The Challenge: Certbot will put a temporary file on your server. Let's Encrypt will try to "ping" it. If it works, it proves you own the server.
- The Config: Certbot will ask if you want to Redirect HTTP to HTTPS. Choose "2" (Redirect). This automatically updates your tasks.conf with all the SSL code.

This is the output from setting up Certbot and LetsEncrypt:

<img width="784" height="350" alt="image" src="https://github.com/user-attachments/assets/8222e12c-3566-489f-9d2c-b086a2fda246" />

Check your tasks.conf (updated version):
```
server { # IPv6
        server_name {DOMAIN-NAME};       

        root /var/www/html;     
        index tasks.html;

        location / {
                add_header Content-Security-Policy "upgrade-insecure-requests";
#               try_files $uri $uri/ =404;

        }

    listen [::]:443 ssl ipv6only=on; # managed by Certbot
    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/lovertasks.portfoliomkc.tech/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/lovertasks.portfoliomkc.tech/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot

}



server {
    if ($host = {DOMAIN-NAME}) {
        return 301 https://$host$request_uri;
    } # managed by Certbot


        listen 80 default_server;
        listen [::]:80 default_server;
        server_name {DOMAIN-NAME};
    return 404; # managed by Certbot
}
```

Let's Encrypt certificates expire every 90 days. The good news? Certbot added a "timer" to your system the moment you installed it. You can test that the automatic renewal works by running:
```
sudo certbot renew --dry-run
```
If that says "Congratulations, all renewals succeeded," you never have to touch SSL again. It’s set-and-forget.

#### When want to Change Old domain to New domain:

1. Identify what you have <br>
Before deleting anything, see exactly what Certbot is managing:
```
sudo certbot certificates
```
This will show you the Certificate Name (usually the domain itself). Note this down.

2. The "Clean" Deletion
Don't just delete files manually with rm. Certbot has a built-in command that cleans up the certificate, the renewal settings, and the archive files all at once.
```
sudo certbot delete --cert-name old.subdomain.com
```
Where are the files? Certbot stores them in /etc/letsencrypt/.
- /live/: Active symlinks.
- /archive/: The actual keys.
- /renewal/: The configuration for auto-renewing. <br>
Running the delete command wipes all of these safely.

3. Update Nginx
Now, you need to tell Nginx about the new name.
- Open your config: sudo nano /etc/nginx/sites-available/tasks.conf
- Change server_name: Update it to new.subdomain.com.
- Remove the SSL lines: Since the old SSL files are gone, Nginx will fail to start if it tries to look for them. Delete (or comment out with #) the lines starting with listen 443, ssl_certificate, and include /etc/letsencrypt/....
- Save and Reload: sudo nginx -t && sudo systemctl reload nginx

4. Create the New Certificate
Now that Nginx is "clean" and listening for the new name on Port 80, run Certbot again for the new subdomain:
```
sudo certbot --nginx -d new.subdomain.com
```

### 2.?. Nginx - Internal Server Files
using Docker containers ...






