
# Kubernetes + Traefik + MongoDB Deployment Roadmap

This guide breaks down how to deploy a full-stack web application with a MongoDB database, Traefik router, and Automated Load Scaling (HPA) on DigitalOcean using your own self-hosted Kubernetes cluster (K3s).

## Hardware & Architecture Choice

**Server Choice:** Self-Hosted K3s on DigitalOcean

- **Specs:** DigitalOcean Droplet (2 vCPUs / 2 GB RAM / 90 GB Disk)
- **Tool:** K3s (Lightweight Kubernetes)

### Why K3s instead of Minikube?

- Minikube is designed for local testing on your personal computer/laptop. Running Minikube on a remote server requires running Docker inside Docker or Virtual Machines, which consumes huge amounts of memory and CPU.
- K3s is official lightweight Kubernetes made by Rancher. It runs directly on Linux servers, takes under 500 MB of RAM, and is production-ready for single-node setups. It gives you 100% real Kubernetes API with full control over your server.

## Memory Protection (Swap Memory)

Since 2 GB RAM is a bit tight for Kubernetes + MongoDB + App + Traefik, we will enable a 2 GB Swap file (virtual memory on disk) on your server. This acts as a safety net so MongoDB or Kubernetes won't crash if memory surges temporarily or when auto-scaling creates temporary extra containers under heavy load.
 
## Domain Name Requirement

Do you have a domain name? (e.g., `mycoolapp.com`)

- **If YES:** We will point your domain's A Record (`@` and `*`) to your DigitalOcean Droplet IP address.
- **If NO:** We can use a free auto-DNS service like sslip.io (e.g., `app.<YOUR_DROPLET_IP>.sslip.io`).

## The 5-Phase Roadmap Overview

```
+------------------------------------------------------------------+
|  Phase 1: Infrastructure & K3s Cluster Setup (CURRENT PHASE)     |
|  Phase 2: Traefik Ingress Controller Deployment                  |
|  Phase 3: Database Setup (MongoDB & Persistent Storage)          |
|  Phase 4: Web Application & Auto-Scaling (HPA) Setup             |
|  Phase 5: Traffic Spike Testing, Security (SSL) & Verification   |
+------------------------------------------------------------------+
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
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

Confirm with:
```
free -h
```
See if the Swap is now 2Gi

### Step 1.3: Install K3s (Your Kubernetes Engine)

We will install K3s with default Traefik turned off, so that we can install and configure our own custom Traefik router cleanly in Phase 2.

Run this command on your server:

```bash
curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="--disable traefik" sh -
```

### Step 1.4: Verify your Kubernetes Cluster & change the permission to the user, not root

Check if your cluster is alive and running:

```
# Create the .kube directory if it doesn't exist
mkdir -p ~/.kube

# Copy the kubeconfig to your home directory
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config

# Give ownership to your user
sudo chown $(id -u):$(id -g) ~/.kube/config

# Optional but recommended: restrict permissions
chmod 600 ~/.kube/config

echo 'export KUBECONFIG=~/.kube/config' >> ~/.bashrc
source ~/.bashrc

kubectl get nodes
```

**Expected output:** You should see 1 node with status Ready:

```
NAME          STATUS   ROLES                  AGE   VERSION
your-droplet   Ready    control-plane,master   1m    v1.x.x
```



Once you reply with confirmation, we will move directly to **Phase 2: Installing Traefik**!


# Phase 2: Traefik Ingress Controller Deployment

## What is Traefik?

Think of Traefik as the main receptionist or traffic cop at the front door of your cluster. When requests come from the internet (port 80 / 443), Traefik receives them and routes them to the correct internal application container.

## Step 2.1: Install Helm (Kubernetes Package Manager)

Helm is like `apt` or `npm`, but for Kubernetes. It allows us to install software like Traefik cleanly using single commands.

Run this command on your server:

```bash
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

Verify Helm installation:

```bash
helm version
```

## Step 2.2: Add the Traefik Repository

Add Traefik's official chart repository to Helm and update your local chart index:

```bash
helm repo add traefik https://traefik.github.io/charts
helm repo update
```

## Step 2.3: Create a Dedicated Namespace for Traefik

Namespaces help keep cluster components organized and isolated.

```bash
kubectl create namespace traefik
```

## Step 2.4: Install Traefik using Helm

Run this command to deploy Traefik into the `traefik` namespace:

```bash
helm install traefik traefik/traefik \
  --namespace traefik \
  --set ports.web.port=8000 \
  --set ports.webgateway.port=80
```

## Step 2.5: Verify Traefik is Running

Check the status of the Traefik Pod in its namespace:

```bash
kubectl get pods -n traefik
```

**Expected output:** You should see 1 pod with status `Running`:

```
NAME                       READY   STATUS    RESTARTS   AGE
traefik-xxxxxxxxxx-xxxxx   1/1     Running   0          30s
```

Also check that the Traefik Service is bound to your server's ports:

```bash
kubectl get svc -n traefik
```

## Phase 2 Checkpoint

Please run the commands above on your server and confirm:

1. Did `helm version` work?
2. Does `kubectl get pods -n traefik` show Traefik as `Running`?

Once you confirm, we will move to **Phase 3: Setting up MongoDB with Persistent Storage**!




