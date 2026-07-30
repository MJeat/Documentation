# Kubernetes Architecture & Request Flow Diagram

This document details the architecture and traffic flow for the web application deployed on K3s Kubernetes hosted on DigitalOcean, featuring automated TLS certificate issuance via Let's Encrypt, Traefik ingress routing, Horizontal Pod Autoscaling (HPA), and MongoDB database persistence.

## 1. System Architecture Diagram (Mermaid)

[System Flow](https://github.com/MJeat/Documentation/blob/main/General-Projects/Kubernetes-app/Diagrams%26Flow/SystemFlow.md)

## 2. Component Sequence & Traffic Flow

### Step-by-Step Execution Sequence



## 3. Key Architecture Highlights

### 1. HTTPS / TLS Termination at Ingress

- Traefik directly offloads SSL using the certificate issued into `webapp-tls-cert` by cert-manager and `letsencrypt-prod`.
- Internal traffic within the cluster routes over optimized HTTP/ClusterIP networks.

### 2. Horizontal Pod Autoscaling (HPA)

- `webapp-hpa` monitors target CPU usage (50% threshold).
- When traffic load increases CPU demands, HPA scales `webapp` replicas dynamically up to 5 instances, distributing incoming traffic seamlessly through `webapp-service`.

### 3. Database Security & Persistence

- MongoDB runs inside an isolated Pod connected via internal service hostnames (`mongo-service:27017`).
- Credentials are kept out of application code using Kubernetes Secrets (`mongo-secret`).
- Disk state persists through a PersistentVolumeClaim backed by local node storage.
```
