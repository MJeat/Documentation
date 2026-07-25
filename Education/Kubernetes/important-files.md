> okay so right now i already have kubernetes basically so where are the schedullers, api server, etcd, controller manager? i want to see the files

Great question.

In **normal Kubernetes**, those components run as separate processes or pods:

- `kube-apiserver`
- `kube-scheduler`
- `kube-controller-manager`
- `etcd`

In **K3s**, they are all combined into **one single binary** to save memory. That’s why you don’t see them as separate pods or services.

### Where are they?

Everything lives inside the K3s process.

You can see it with these commands:

```bash
# 1. See the main K3s process
ps aux | grep k3s

# 2. See all Kubernetes system pods (this is the closest view)
kubectl get pods -n kube-system

# 3. See more details about the control plane
kubectl get componentstatuses
# (or on newer versions)
kubectl get --raw /livez
```

### Want to see the actual files?

K3s stores its data here:

```bash
# Main K3s data directory
ls -la /var/lib/rancher/k3s/

# Important subfolders:
ls -la /var/lib/rancher/k3s/server/
ls -la /var/lib/rancher/k3s/agent/
```

Especially useful:

```bash
# This is where the cluster database lives (SQLite by default)
ls -la /var/lib/rancher/k3s/server/db/

# Certificates and configuration
ls -la /var/lib/rancher/k3s/server/tls/
```

---

### Summary:

| Component              | Normal Kubernetes          | In your K3s installation      |
|------------------------|----------------------------|-------------------------------|
| API Server             | Separate process/pod       | Inside the `k3s` binary       |
| Scheduler              | Separate process/pod       | Inside the `k3s` binary       |
| Controller Manager     | Separate process/pod       | Inside the `k3s` binary       |
| etcd                   | Separate process           | Replaced by SQLite (default)  |

Would you like me to show you the exact commands to inspect each part?
> yes

Here are the exact commands you can run right now to inspect everything.

### 1. See the main K3s process (this is where everything lives)

```bash
ps aux | grep k3s | grep -v grep
```

### 2. See all system pods (control plane related)

```bash
kubectl get pods -n kube-system -o wide
```

### 3. Check if the control plane is healthy

```bash
kubectl get --raw='/readyz?verbose'
```

### 4. Look at the actual files on disk

```bash
# Main K3s folder
sudo ls -la /var/lib/rancher/k3s/

# Server (control-plane) data
sudo ls -la /var/lib/rancher/k3s/server/

# Database (this is SQLite instead of etcd)
sudo ls -la /var/lib/rancher/k3s/server/db/

# Certificates
sudo ls -la /var/lib/rancher/k3s/server/tls/

# Agent (worker) data
sudo ls -la /var/lib/rancher/k3s/agent/
```

### 5. See what ports the API server is using

```bash
sudo ss -tulnp | grep k3s
```

---

Run them one by one and paste the output if you want me to explain what you’re seeing.
