Here's your text cleanly converted to proper Markdown:

```markdown
### The "Legacy" Service Checklist (Continued)

On your **Target Server (VM 2)**, install and intentionally misconfigure the following services:

- **The Web & Database (LAMP Stack):**  
  ```bash
  sudo apt install apache2 mysql-server php libapache2-mod-php php-mysql
  ```
  *Vulnerability:* Keep it on **Port 80 (HTTP)**. **Do not install SSL/HTTPS.**

- **File Transfer (FTP):**  
  ```bash
  sudo apt install vsftpd
  ```
  *Vulnerability:* Enable **anonymous login** in `/etc/vsftpd.conf`.

- **Remote Management (Telnet & SSH):**  
  ```bash
  sudo apt install telnetd openssh-server
  ```
  *Vulnerability:* Telnet is plaintext by default. For SSH, allow **"Password Authentication"** and **"Root Login"** (very weak).

- **Email (SMTP):**  
  ```bash
  sudo apt install postfix
  ```
  *Vulnerability:* Configure it as an **"Internet Site"** but with no encryption requirements.

### 4. Pre-VA Preparation (Stage 0 Completion)

Before you start your **Reconnaissance (Stage 1)**, ensure the "Target" is ready for discovery:

1. **Populate the Database:**  
   Create a `users` table in MySQL. Add a user `admin` with password `admin123` and a user `staff` with password `password`.

2. **Web "Breadcrumbs":**  
   Create a folder at `/var/www/html/backups` and put a fake file inside called `config_backup.txt`.  
   Ensure **Directory Listing** is enabled in the Apache config so `Gobuster` can find it.

3. **The "Insecure" Upload:**  
   Create a simple PHP page that allows users to upload a "Profile Picture" but has **zero** file type checks (this allows you to upload a "Reverse Shell" later).

4. **Firewall Check:**  
   Ensure the firewall is either OFF or only allowing the specific ports you want to test:
   ```bash
   sudo ufw allow 21, 22, 23, 25, 80, 3306/tcp
   ```

### Summary Table for your Report

| VM Name      | Role            | OS              | IP Address (Example) |
|--------------|-----------------|-----------------|----------------------|
| **K-Attack** | Attacker        | Kali Linux      | 192.168.56.10        |
| **Legacy-Srv** | Target        | Ubuntu 18.04    | 192.168.56.20        |
| **Staff-PC** | Victim/Client   | Win10 / Linux   | 192.168.56.30        |

**Once these VMs are running and can ping each other, you are officially ready for Stage 1: Reconnaissance.**

Should I provide the PHP code for the **"Vulnerable Web Portal"** now?
```

This version is clean, consistent with your previous sections, and ready to use in your guide. Just paste it into your `.md` file! Let me know if you want to combine it with the previous parts or need any adjustments.
