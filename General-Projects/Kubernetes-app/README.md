
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

1. Helm downloads the blueprint.
2. It overrides the default ports to 8000 and 80 based on your --set flags.
3. Helm translates the blueprint into final Kubernetes instructions and passes them to the cluster.

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

## Phase 2 Explain
> Here is the breakdown of exactly how this flow works, where that repository actually lives, and why Helm is still necessary if Kubernetes is doing the heavy lifting.
------------------------------
## Part 1: Explaining the Flow (Step-by-Step)

   1. helm repo add ...: You are telling the Helm CLI on your computer, "Hey, save the address to Traefik's digital warehouse (https://traefik.github.io/charts) and label it 'traefik' so I can find it later."
   2. helm repo update: Your Helm CLI downloads a fresh catalog (index file) of all available blueprints (charts) from that URL so it knows what versions exist.
   3. kubectl create namespace traefik: You use the Kubernetes CLI (kubectl) to create an isolated room inside your cluster named traefik.
   4. helm install traefik traefik/traefik ...: This is the action step.
   * Helm downloads the blueprint.
      * It overrides the default ports to 8000 and 80 based on your --set flags.
      * Helm translates the blueprint into final Kubernetes instructions and passes them to the cluster.
   5. kubectl get pods -n traefik: You ask Kubernetes directly to show you the running containers inside that room to confirm it worked.

------------------------------
## Part 2: Where is this repo that you "installed"?
When you run helm repo add, nothing is installed inside your Kubernetes cluster yet, and nothing heavy is downloaded to your computer.

* The Remote Repository: The actual blueprints sit on GitHub's servers (``https://traefik.github.io/charts``).
* Your Local Machine: Helm simply saves a tiny text link and an index file in a hidden folder on your laptop/PC (usually inside ``~/.config/helm/`` or ``~/.cache/helm/``).

It acts just like adding a bookmark to your web browser. You only download the actual blueprint files temporarily when you finally hit helm install.

------------------------------
## Part 3: Why use Helm if Kubernetes runs it?
You are 100% correct that Kubernetes is the only one running the app. Helm doesn't run containers. However, you need Helm because Kubernetes is "dumb" about software packages—it only understands raw, individual pieces of infrastructure.
Without Helm, to install Traefik, you would have to:

   1. Go to Traefik's website and manually download 5 to 10 different raw YAML files (Deployments, Services, RBAC Roles, ServiceAccounts, IngressRoutes).
   2. Open those files and manually find and replace the ports to 8000 and 80 by hand.
   3. Run ``kubectl apply -f file1.yaml``, ``kubectl apply -f file2.yaml``, etc.
   4. If you want to delete or upgrade it later, you have to remember exactly which 10 files you ran and manage them manually.

Helm acts as the translator. You give Helm a single command with your custom ports, and Helm writes all 10 complex YAML files flawlessly in milliseconds and hands them to Kubernetes. Kubernetes runs them, but Helm did all the paperwork.

After you run helm install, Helm downloads the chart, processes it, and sends it to Kubernetes in three fast steps:
## 1. What are the files?
The downloaded chart is a folder containing:

* ``values.yaml``: The settings file (e.g., your custom ports).
* ``templates/`` folder: A collection of blank text blueprints for Kubernetes resources (Deployments, Services, ConfigMaps).

## 2. What does Helm do with them?
Helm acts as a compiler. It takes your custom settings from values.yaml and injects them directly into the blank template blueprints, generating completed, raw Kubernetes YAML files in milliseconds.
## 3. How does it give them to Kubernetes?
Helm makes a secure network call (an HTTP POST request) to the Kubernetes API Server. It directly transmits the completed YAML data over this connection. Kubernetes reads the data, stores it in its database (``etcd``), and immediately begins pulling the Docker images to spin up your containers.


# Helm Inspection Commands

## 1. View Raw YAML Before Sending (`helm template`)

To inspect the final raw YAML configuration without sending any data to the Kubernetes cluster, use the `helm template` command. This acts as a compiler preview.

```bash
# Preview the generated YAML for the Traefik deployment
helm template traefik traefik/traefik \
  --set ports.web.port=8000 \
  --set ports.webgateway.port=80
```

**What happens:** Helm locally injects your variables into the templates and prints the final, raw Kubernetes YAML files directly to your screen. Nothing is deployed.

## 2. View YAML of a Live Deployment (`helm get manifest`)

To see the exact YAML configurations Helm previously compiled and delivered to a running cluster, use the `helm get manifest` command.

```bash
# Retrieve the active YAML manifest for the 'traefik' release
helm get manifest traefik --namespace traefik
```

**What happens:** Helm pulls the official blueprint layout currently running inside your cluster database and displays it.

## 3. Track Active Releases (`helm list`)

To see a comprehensive log of every blueprint pack you have ordered Helm to build, use the `helm list` command.

```bash
# List all active Helm releases inside the traefik namespace
helm list --namespace traefik
```

**Expected Output:**

```text
NAME       NAMESPACE   REVISION   UPDATED                    STATUS     CHART           APP VERSION
traefik    traefik     1          2026-07-30 15:10:00 UTC    deployed   traefik-33.0.0  v3.1.2     
```

**What happens:** This acts as your installation receipt tracker. It shows the deployment state (`deployed`), how many changes you have committed (`REVISION`), and the underlying engine versions.

---

# Phase 3: Database Setup (MongoDB & Persistent Storage)

## Why Persistent Storage Matters

By default, containers are ephemeral—meaning if a container restarts or crashes, any files written inside it are deleted. For a database like MongoDB, we need a **Persistent Volume Claim (PVC)**. This forces K3s to store database files directly on your server's host disk, ensuring your database data survives restarts.

## Step 3.1: Create a Secret for Database Credentials

Never write raw passwords directly inside application code or deployments. We store sensitive credentials securely in a Kubernetes Secret.

Run this command to create a secret named `mongo-secret` with your admin username and password (replace `adminpassword123` with a password of your choice):

```bash
kubectl create secret generic mongo-secret \
  --from-literal=mongo-root-username=admin \
  --from-literal=mongo-root-password=adminpassword123
```

## Step 3.2: Create the Persistent Volume Claim (PVC)

Create a file named `mongo-pvc.yaml` on your server:

```bash
nano mongo-pvc.yaml
```

Paste the following content into the file:

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: mongo-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
```

Save and exit (`Ctrl+O`, Enter, `Ctrl+X`).

Apply the PVC to your cluster:

```bash
kubectl apply -f mongo-pvc.yaml
```

## Step 3.3: Create the MongoDB Deployment & Internal Service

Now we create both the MongoDB workload and an internal network Service so other applications inside the cluster can reach MongoDB via the address `mongo-service:27017`.

Create a file named `mongo-deployment.yaml`:

```bash
nano mongo-deployment.yaml
```

Paste the following content:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mongodb
spec:
  replicas: 1
  selector:
    matchLabels:
      app: mongodb
  template:
    metadata:
      labels:
        app: mongodb
    spec:
      containers:
      - name: mongodb
        image: mongo:latest
        ports:
        - containerPort: 27017
        env:
        - name: MONGO_INITDB_ROOT_USERNAME
          valueFrom:
            secretKeyRef:
              name: mongo-secret
              key: mongo-root-username
        - name: MONGO_INITDB_ROOT_PASSWORD
          valueFrom:
            secretKeyRef:
              name: mongo-secret
              key: mongo-root-password
        volumeMounts:
        - name: mongo-storage
          mountPath: /data/db
      volumes:
      - name: mongo-storage
        persistentVolumeClaim:
          claimName: mongo-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: mongo-service
spec:
  selector:
    app: mongodb
  ports:
  - port: 27017
    targetPort: 27017
```

Save and exit (`Ctrl+O`, Enter, `Ctrl+X`).

Apply the MongoDB deployment and service:

```bash
kubectl apply -f mongo-deployment.yaml
```

## Step 3.4: Verify MongoDB and Volume Status

1. Check if the Persistent Volume Claim is bound:

   ```bash
   kubectl get pvc
   ```

   **Expected output:** `mongo-pvc` status should show `Bound`.

2. Check if MongoDB Pod is running:

   ```bash
   kubectl get pods
   ```
**Expected output:** A pod named `mongodb-xxxxx-xxxxx` should show status `Running`.

----

# Phase 4: Full Deployment (Database + Web App + Ingress + HPA)

In this phase, we will deploy MongoDB with persistent storage, deploy the web application, expose it via Traefik on `kubernetes.app.portfoliomkc.tech`, configure auto-scaling, and inspect live logs.

## Complete YAML File Map

| YAML File Name          | What It Controls                                                                 | When to Edit / Purpose                                      |
|-------------------------|----------------------------------------------------------------------------------|-------------------------------------------------------------|
| `mongo-pvc.yaml`        | Requests persistent disk space (5GB) for MongoDB.                                | Defines database storage request.                           |
| `mongo-deployment.yaml` | Runs MongoDB container & internal service (`mongo-service:27017`).               | Defines MongoDB credentials and database pod config.        |
| `webapp-deployment.yaml`| Runs your app containers, environment vars (`MONGO_URI`), & CPU/RAM limits.      | **Most Frequent:** Whenever updating app image or env vars. |
| `webapp-ingress.yaml`   | Directs domain traffic (`kubernetes.app.portfoliomkc.tech`) to your webapp.      | If changing domain names, paths (`/api`), or SSL certs.     |
| `webapp-hpa.yaml`       | Auto-scaling rules (scales webapp between 1 and 5 replicas based on CPU).        | If adjusting CPU targets or max replica counts.             |

## Step 4.1: Create & Apply MongoDB Storage (`mongo-pvc.yaml`)

**File:** `mongo-pvc.yaml`

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: mongo-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
```

Apply the storage claim:

```bash
kubectl apply -f mongo-pvc.yaml
```

## Step 4.2: Create & Apply MongoDB Database (`mongo-deployment.yaml`)

**File:** `mongo-deployment.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mongo-deployment
spec:
  replicas: 1
  selector:
    matchLabels:
      app: mongo
  template:
    metadata:
      labels:
        app: mongo
    spec:
      containers:
      - name: mongo
        image: mongo:6.0
        ports:
        - containerPort: 27017
        env:
        - name: MONGO_INITDB_ROOT_USERNAME
          value: "admin"
        - name: MONGO_INITDB_ROOT_PASSWORD
          value: "adminpassword123"
        volumeMounts:
        - name: mongo-storage
          mountPath: /data/db
      volumes:
      - name: mongo-storage
        persistentVolumeClaim:
          claimName: mongo-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: mongo-service
spec:
  selector:
    app: mongo
  ports:
  - port: 27017
    targetPort: 27017
```

Apply the MongoDB deployment and service:

```bash
kubectl apply -f mongo-deployment.yaml
```

Verify MongoDB is running:

```bash
kubectl get pods -l app=mongo
```

## Step 4.3: How & Where to Change the Web App Container Image

When configuring your web app, the container image is specified on the `image:` line inside `webapp-deployment.yaml`.

### Option A: Using a Specific Public Image (Docker Hub / Registry)

```yaml
spec:
  containers:
  - name: webapp
    image: python:3.10-slim    # <--- Put any Docker Hub image here
```

### Option B: Using a Custom Local Image (Built on Server without Docker Hub)

Import your built Docker image into K3s:

```bash
docker save my-app:v1 | sudo k3s ctr images import -
```

Specify `imagePullPolicy: Never` in `webapp-deployment.yaml`:

```yaml
spec:
  containers:
  - name: webapp
    image: my-app:v1
    imagePullPolicy: Never   # <--- Tells K3s not to look on Docker Hub
```

## Step 4.4: Deploy the Web Application & Service (`webapp-deployment.yaml`)

**File:** `webapp-deployment.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: webapp
spec:
  replicas: 1
  selector:
    matchLabels:
      app: webapp
  template:
    metadata:
      labels:
        app: webapp
    spec:
      containers:
      - name: webapp
        image: nginxdemos/hello:plain-text  # <--- REPLACE WITH YOUR IMAGE WHEN READY
        ports:
        - containerPort: 80
        resources:
          requests:
            cpu: "50m"       # 0.05 CPU core
            memory: "64Mi"
          limits:
            cpu: "100m"      # 0.1 CPU core max
            memory: "128Mi"
        env:
        - name: MONGO_URI
          value: "mongodb://admin:adminpassword123@mongo-service:27017"
---
apiVersion: v1
kind: Service
metadata:
  name: webapp-service
spec:
  selector:
    app: webapp
  ports:
  - port: 80
    targetPort: 80
```

Apply the webapp deployment:

```bash
kubectl apply -f webapp-deployment.yaml
```

## Step 4.5: Expose the Application via Traefik (`webapp-ingress.yaml`)

**File:** `webapp-ingress.yaml`

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: webapp-ingress
  annotations:
    kubernetes.io/ingress.class: traefik
spec:
  rules:
  - host: "kubernetes.app.portfoliomkc.tech"
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: webapp-service
            port:
              number: 80
```

Apply the Ingress rule:

```bash
kubectl apply -f webapp-ingress.yaml
```

## Step 4.6: Configure Horizontal Pod Autoscaler (`webapp-hpa.yaml`)

**File:** `webapp-hpa.yaml`

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: webapp-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: webapp
  minReplicas: 1
  maxReplicas: 5
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 50
```

Apply the HPA rule:

```bash
kubectl apply -f webapp-hpa.yaml
```

## Step 4.7: How to Inspect Logs

### 1. Stream MongoDB Logs

```bash
kubectl logs -f deployment/mongodb
```

### 2. Stream Traefik Ingress Logs (HTTP Traffic)

```bash
kubectl logs -n traefik -l app.kubernetes.io/name=traefik -f
```

### 3. Stream Application Logs

```bash
kubectl logs -f deployment/webapp
```

## Phase 4 Checkpoint

Please execute Steps 4.1 through 4.6 on your server. Then check:

1. Does `kubectl get pods` show both `mongo-deployment` and `webapp` as `Running`?
2. Does `kubectl logs -f deployment/mongo-deployment` output database logs without errors?
3. Does visiting `http://kubernetes.app.portfoliomkc.tech` load your application?

Once verified, we will move to **Phase 5: Traffic Spike Load Testing & Auto-Scaling Verification**!
```
