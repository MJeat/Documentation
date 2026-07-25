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
