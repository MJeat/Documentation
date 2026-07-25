
# Kubernetes (K8s) vs. K3s: Key Differences & Limitations

To put it simply: **K3s IS real Kubernetes**. It passes 100% of the Cloud Native Computing Foundation (CNCF) official conformance tests. Any application or YAML file that runs on standard Kubernetes will run on K3s without changes.

The main difference is that K3s removed non-essential "legacy" features to make it lightweight enough to run on small servers, edge devices, and single-node setups.

## 1. Direct Comparison

| Feature                  | Standard Kubernetes (K8s)                                      | K3s                                                                 |
|--------------------------|----------------------------------------------------------------|---------------------------------------------------------------------|
| **Primary Goal**         | Large, high-scale enterprise cloud clusters                    | Lightweight, edge computing, single-server, and small clusters     |
| **Control Plane RAM**    | ~1.5 GB to 2 GB minimum RAM required                           | ~500 MB RAM required                                               |
| **Installation**         | Complex (requires installing kubeadm, containerd, CNI plugins separately) | Single binary installation (<100MB file, installed in 30 seconds) |
| **Database**             | Strictly requires etcd (heavy on RAM and disk speeds)          | Uses SQLite by default (single-node), but supports etcd, MySQL, or PostgreSQL |
| **In-Tree Cloud Code**   | Contains extra code for AWS, GCP, Azure cloud integrations     | Removed (reduces security surface area and binary size)            |
| **Default Ingress**      | None (you must choose and install one)                         | Bundled with Traefik by default (can be turned off)                |
| **Container Engine**     | Must install separately (containerd / CRI-O)                   | Bundled directly inside the K3s single binary                      |

## 2. Limitations of K3s (What You Lose or Trade Off)

While K3s is production-ready, there are a few trade-offs to keep in mind:

### 1. Extreme Scale Limitations
- **Standard K8s:** Built to support up to 5,000 nodes and 150,000 pods in giant corporate data centers.
- **K3s:** Optimized for single nodes up to several hundred nodes. If you plan to run thousands of servers across global regions, standard K8s is better.

### 2. Default Local Storage Driver
- **K8s:** Expects enterprise network storage (like AWS EBS, GCP Disks, or Ceph).
- **K3s:** Uses a simple `local-path-provisioner` by default. This stores database files directly on your server's local hard drive. While fast and perfect for a single server, if your server dies, you need backups to recover the disk data.

### 3. SQLite vs. etcd for Single-Node
- By default, K3s uses SQLite instead of etcd for storing cluster configuration when running on a single server.
- **Why this is a limitation:** SQLite is great for low memory, but if you want high availability (HA) across multiple servers later, you will need to configure K3s to use an external database or etcd.

### 4. Stripped In-Tree Cloud Drivers
- K3s removed old built-in cloud code (like auto-creating cloud load balancers on AWS/DigitalOcean via Kubernetes services).
- **Workaround:** If you want K3s to automatically create DigitalOcean cloud load balancers, you simply install the official DigitalOcean Cloud Controller Manager plugin.

## 3. Summary: Which One Should You Use?

```
Is your application running on thousands of servers with a huge DevOps team?
  ├── YES ──> Use Standard Kubernetes (K8s) or Managed K8s (EKS, GKE, DigitalOcean K8s).
  └── NO  ──> Use K3s! It gives you 100% K8s functionality using 1/4th of the memory.
```

For your **2 GB RAM DigitalOcean droplet**, K3s is the best choice. Standard Kubernetes would consume almost all 2 GB of RAM just to keep itself alive, leaving no room for your MongoDB database or web application.
