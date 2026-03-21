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

<img width="391" height="129" alt="image" src="https://github.com/user-attachments/assets/c08c1082-46da-4e98-82cd-2aa0199202d5" />


**This is what the `Secure` web looks like using:**
```
curl -I {DOMAIN-NAME}
```
The `Secure` sites have HTTP/2



### 2.?. Nginx - Internal Server Files
using Docker containers ...






