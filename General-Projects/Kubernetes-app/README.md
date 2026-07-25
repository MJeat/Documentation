
# Kubernetes + Traefik + MongoDB Deployment Roadmap

This guide breaks down how to deploy a full-stack web application with a MongoDB database and Traefik router on DigitalOcean using your own self-hosted Kubernetes cluster (K3s).

## Hardware & Architecture Choice

**Server Choice:** Self-Hosted K3s on DigitalOcean

- **Specs:** DigitalOcean Droplet (2 vCPUs / 2 GB RAM / 90 GB Disk)
- **Tool:** K3s (Lightweight Kubernetes)

### Why K3s instead of Minikube?

- Minikube is designed for local testing on your personal computer/laptop. Running Minikube on a remote server requires running Docker inside Docker or Virtual Machines, which consumes huge amounts of memory and CPU.
- K3s is official lightweight Kubernetes made by Rancher. It runs directly on Linux servers, takes under 500 MB of RAM, and is production-ready for single-node setups. It gives you 100% real Kubernetes API with full control over your server.

## Memory Protection (Swap Memory)

Since 2 GB RAM is a bit tight for Kubernetes + MongoDB + App + Traefik, we will enable a 2 GB Swap file (virtual memory on disk) on your server. This acts as a safety net so MongoDB or Kubernetes won't crash if memory surges temporarily.

## Domain Name Requirement

Do you have a domain name? (e.g., `mycoolapp.com`)

- **If YES:** We will point your domain's A Record (`@` and `*`) to your DigitalOcean Droplet IP address.
- **If NO:** We can use a free auto-DNS service like sslip.io (e.g., `app.<YOUR_DROPLET_IP>.sslip.io`).

## The 5-Phase Roadmap Overview

```
+-----------------------------------------------------------------+
|  Phase 1: Infrastructure & K3s Cluster Setup (CURRENT PHASE)     |
|  Phase 2: Traefik Ingress Controller Deployment                 |
|  Phase 3: Database Setup (MongoDB & Persistent Storage)          |
|  Phase 4: Web Application Deployment                            |
|  Phase 5: Security (SSL/HTTPS) & Final Testing                  |
+-----------------------------------------------------------------+
```

## Phase 1: Infrastructure & K3s Cluster Setup

Follow these exact steps on your DigitalOcean Ubuntu server to get your Kubernetes cluster ready.

### Step 1.1: SSH into your DigitalOcean Droplet

Open your terminal on your computer and connect to your server:

```bash
ssh root@<YOUR_DROPLET_IP>
```

### Step 1.2: Enable Swap Memory (Safety Net for 2GB RAM)

Run these commands on your server to create 2 GB of virtual memory:

```bash
# Create 2GB swap file
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make swap permanent after reboot
sudo echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab
```

### Step 1.3: Install K3s (Your Kubernetes Engine)

We will install K3s with default Traefik turned off, so that we can install and configure our own custom Traefik router cleanly in Phase 2.

Run this command on your server:

```bash
curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="--disable traefik" sh -
```

### Step 1.4: Verify your Kubernetes Cluster

Check if your cluster is alive and running:

```bash
kubectl get nodes
```

**Expected output:** You should see 1 node with status Ready:

```
NAME          STATUS   ROLES                  AGE   VERSION
your-droplet   Ready    control-plane,master   1m    v1.x.x
```



Once you reply with confirmation, we will move directly to **Phase 2: Installing Traefik**!
```
