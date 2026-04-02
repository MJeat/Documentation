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
Keep an eye on the connection status:

<img width="639" height="675" alt="image" src="https://github.com/user-attachments/assets/147a5b51-2570-450c-aa10-7151ff553eb5" />

# Update `docker-compose.yml` & `nginx.conf`


# Project 04: ...

