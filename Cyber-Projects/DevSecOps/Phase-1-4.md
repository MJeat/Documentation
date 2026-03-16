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













