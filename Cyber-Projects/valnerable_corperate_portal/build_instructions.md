# Legacy Corporate Intranet Project – Lab Setup Phase (Stage 0)

To build the **Legacy Corporate Intranet** project effectively, you need a controlled environment where you can safely perform "attacks" and capture traffic.  

This is your executive guide for the **Lab Setup Phase (Stage 0)**.

---

## 1. VM Inventory (The Architecture)

I recommend a **3-VM setup**. While 2 VMs work, 3 allows you to simulate a "Victim" user, which makes your Wireshark traffic captures (Stage 3) much more professional.

### VM 1: The Attacker (Kali Linux)
- **Purpose:** Your primary workstation.  
- You will run:
  - Nmap
  - Wireshark
  - Metasploit
  - Gobuster

### VM 2: The Target Server (Ubuntu Server 18.04 or 20.04)
- **Purpose:** This is the "Legacy Intranet."  
- Hosts:
  - Website
  - Database
  - Old services (FTP, Telnet, etc.)

- **Note:**  
  Using an older version like **Ubuntu 16.04 or 18.04** is better because it includes more "vulnerable" software by default.

### VM 3: The Employee/Client (Windows 10 or Linux Mint)
- **Purpose:** A regular "Staff" machine.  
- Used to:
  - Log into the website
  - Send emails  
- This generates **plaintext traffic** for sniffing from the Kali machine.

---

## 2. Network Configuration (Crucial)

You must isolate these machines to avoid scanning your real network.

### VirtualBox
- Go to: `Settings > Network`
- Set all VMs to:
  - **NAT Network** *(create in Global Preferences)*  
  **OR**
  - **Host-Only Adapter**

### VMware
- Set all VMs to the same:
  - **LAN Segment**

### Goal
- All VMs can `ping` each other  
- Must be on a private subnet (e.g., `192.168.56.x`)

---

## 3. The "Legacy" Service Checklist

On your **Target Server (VM 2)**, install and intentionally misconfigure these services:

### Web & Database (LAMP Stack)
```bash
sudo apt install apache2 mysql-server php libapache2-mod-php php-mysql

````markdown
## Vulnerability
- Use Port 80 (HTTP)
- ❌ Do NOT install SSL/HTTPS

---

## File Transfer (FTP)
```bash
sudo apt install vsftpd
````

**Vulnerability:**

* Enable anonymous login in `/etc/vsftpd.conf`

---

## Remote Management (Telnet & SSH)

```bash
sudo apt install telnetd openssh-server
```

**Vulnerabilities:**

* Telnet is plaintext
* SSH:

  * Enable Password Authentication
  * Allow Root Login (weak)

---

## Email (SMTP)

```bash
sudo apt install postfix
```

**Vulnerability:**

* Configure as "Internet Site"
* No encryption required

---

## 4. Pre-VA Preparation (Stage 0 Completion)

Before starting **Stage 1: Reconnaissance**, prepare the target:

### 1. Populate the Database

* Create a `users` table in MySQL
* Add:

  * `admin / admin123`
  * `staff / password`

---

### 2. Web "Breadcrumbs"

```bash
/var/www/html/backups
```

* Add file:

  * `config_backup.txt`
* Enable **Directory Listing** in Apache

---

### 3. Insecure File Upload

* Create a PHP page for "Profile Picture" upload

**Vulnerability:**

* No file type validation
* Allows reverse shell upload later

---

### 4. Firewall Configuration

```bash
sudo ufw allow 21, 22, 23, 25, 80, 3306/tcp
```

* Ensure firewall is:

  * OFF
    **OR**
  * Only allows required ports

---

## Summary Table for Report

| VM Name    | Role          | OS                 | IP Address (Example) |
| ---------- | ------------- | ------------------ | -------------------- |
| K-Attack   | Attacker      | Kali Linux         | 192.168.56.10        |
| Legacy-Srv | Target        | Ubuntu 18.04       | 192.168.56.20        |
| Staff-PC   | Victim/Client | Windows 10 / Linux | 192.168.56.30        |

```
```

