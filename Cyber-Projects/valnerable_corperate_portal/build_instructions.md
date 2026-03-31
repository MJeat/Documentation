

```markdown
To build the **Legacy Corporate Intranet** project effectively, you need a controlled environment where you can safely perform "attacks" and capture traffic.

Here is your executive guide for the **Lab Setup Phase (Stage 0)**.

### 1. VM Inventory (The Architecture)

I recommend a **3-VM setup**. While 2 VMs work, 3 allows you to simulate a "Victim" user, which makes your Wireshark traffic captures (Stage 3) much more professional.

- **VM 1: The Attacker (Kali Linux)**  
  **Purpose**: Your primary workstation. You will run Nmap, Wireshark, Metasploit, and Gobuster from here.

- **VM 2: The Target Server (Ubuntu Server 18.04 or 20.04)**  
  **Purpose**: This is the "Legacy Intranet." It hosts the website, the database, and the old services (FTP, Telnet, etc.).  
  **Note**: Using an older version like Ubuntu 16.04 or 18.04 is better because it comes with older, more "vulnerable" versions of software by default.

- **VM 3: The Employee/Client (Windows 10 or Linux Mint)**  
  **Purpose**: A regular "Staff" member. You will use this to "log in" to the website and send emails. This generates the "plaintext traffic" for you to "sniff" from the Kali machine.

### 2. Network Configuration (Crucial)

You must isolate these machines so you don't accidentally scan your home router or the school network.

- **VirtualBox**: Go to **Settings > Network** and set all three VMs to **"NAT Network"** (create one in Global Preferences first) or **"Host-Only Adapter."**
- **VMware**: Set all three VMs to the same **"LAN Segment."**

**Goal**: All VMs should be able to ping each other, but they should be on their own private subnet (e.g., `192.168.56.x`).

### 3. The "Legacy" Service Checklist

On your **Target Server (VM 2)**, you need to install and intentionally "misconfigure" these services. Run these commands in the Target's terminal:

- **The Web & Database (LAMP Stack)**:  
  ```bash
  sudo apt install apache2 mysql-server php libapache2-mod-php php-mysql
  ```
  **Vulnerability**: Keep it on Port 80 (HTTP). Do not install SSL/HTTPS.

- **File Transfer (FTP)**:  
  ```bash
  sudo apt install vsftpd
  ```
  **Vulnerability**: Enable anonymous login in `/etc/vsftpd.conf`.

- **Remote Management (Telnet & SSH)**:  
  ```bash
  sudo apt install telnetd openssh-server
  ```
  **Vulnerability**: Telnet is plaintext by default. For SSH, allow "Password Authentication" and "Root Login" (very weak).

- **Email (SMTP)**:  
  ```bash
  sudo apt install postfix
  ```
  **Vulnerability**: Configure it as an "Internet Site" but with no encryption requirements.

### 4. Pre-VA Preparation (Stage 0 Completion)

Before you start your "Reconnaissance" (Stage 1), ensure the "Target" is ready for discovery:

1. **Populate the Database**: Create a `users` table in MySQL. Add a user `admin` with password `admin123` and a user `staff`.
2. **Web "Breadcrumbs"**: Create a folder at `/var/www/html/backups` and put a fake file inside called `config_backup.txt`. Ensure Directory Listing is enabled in the Apache config so Gobuster can find it.
3. **The "Insecure" Upload**: Create a simple PHP page that allows users to upload a "Profile Picture" but has zero file type checks (this allows you to upload a "Reverse Shell" later).
4. **Firewall Check**: Ensure the firewall is either OFF or only allowing the specific ports you want to test:
   ```bash
   sudo ufw allow 21, 22, 23, 25, 80, 3306/tcp
   ```

### Summary Table for your Report

| VM Name      | Role            | OS                  | IP Address (Example) |
|--------------|-----------------|---------------------|----------------------|
| K-Attack     | Attacker        | Kali Linux          | 192.168.56.10        |
| Legacy-Srv   | Target          | Ubuntu 18.04        | 192.168.56.20        |
| Staff-PC     | Victim/Client   | Win10 / Linux Mint  | 192.168.56.30        |

Once these VMs are running and can ping each other, you are officially ready for **Stage 1: Reconnaissance**.

---

**Should I provide the PHP code for the "Vulnerable Web Portal" now?**
```

This version is clean, well-structured, and professional. Ready to save as a `.md` file!
