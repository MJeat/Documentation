


Running an autonomous AI agent with shell execution capabilities directly as the `root` user on a cloud VPS is absolute operational suicide—a single prompt injection attack from a scraped web page could immediately grant an attacker full host takeover. [Certain]

I disagree with any approach that uses `root` for agent execution. [Certain] Here's what you must do instead: create a dedicated non-root user (e.g., `agentuser`) with `sudo` privileges, delegate execution to isolated Docker containers, and disable root SSH login completely. [Certain] The risk in running as root is that any unhandled code execution exploit in an automated scraper instantly destroys your host OS. [Certain]

---

## Required DigitalOcean Droplet Specifications

To run Ubuntu 24.04 LTS, Docker, and Hermes Agent with headless browser automation (Playwright/Chromium) without running into Out-Of-Memory (OOM) kernel panics, select these exact options when creating your Droplet today (before your July 31 deadline): [Certain]

| Setting | Recommended Configuration | Reason |
| --- | --- | --- |
| **Image** | Ubuntu 24.04 LTS (x64) | Standard long-term support with modern Python and Docker drivers [Certain] |
| **Droplet Type** | Basic Droplet (Regular or Premium AMD/Intel) | Cost-effective for credit preservation [Certain] |
| **Specs** | **4 GB RAM / 2 vCPUs / 50 GB NVMe SSD** | 2 GB RAM will freeze and fail during headless browser scraping [Certain] |
| **Pricing** | ~$24 / month | Fits comfortably inside your $100 credit for ~4 months [Certain] |
| **Authentication** | **SSH Key** (Do NOT use Password) | Essential security hygiene for public cloud instances [Certain] |

---

## Project Overview: Autonomous Blue Team Threat Intel Digest

Before setting up, here is the mini-project we will build together once Hermes is installed:

* **The Goal:** [Certain] Task Hermes with scraping live security threat feeds (such as CISA Known Exploited Vulnerabilities or NVD Advisories), identifying high-severity CVEs, summarizing mitigations, and generating a structured JSON/Markdown Blue Team security digest.
* **The Learning Proof:** [Certain] We will observe Hermes fail initial raw HTTP requests against protected sites, adapt by writing a Playwright scraper inside its Docker sandbox, synthesize a reusable `SKILL.md`, and execute the same digest on run #2 in a fraction of the time.

---

## The Execution Roadmap

* **Phase 1: VPS Provisioning & OS Hardening** *(Current Step)*
* Create DigitalOcean Droplet.
* Create `agentuser`, configure `sudo`, and disable `root` SSH.
* Configure basic UFW firewall rules.


* **Phase 2: Docker Runtime & Hermes Agent Installation**
* Install Docker Engine & Docker Compose.
* Install Hermes Agent and link your preferred LLM API key.
* Configure Hermes to route terminal tools into isolated Docker containers.


* **Phase 3: Executing the Blue Team Threat Scraper Project**
* Prompt Hermes to execute the threat intelligence gathering task.
* Monitor tool calls, sandbox boundary isolation, and error resolution live.


* **Phase 4: Skill Synthesis & Learning Loop Audit**
* Inspect the generated `SKILL.md` in `~/.hermes/skills/`.
* Trigger a second execution pass to verify speed improvement and token reduction.



---

## Phase 1 Instructions: Provision & Harden Your VPS

### 1. Create the Droplet

Log into DigitalOcean, select **Create > Droplet**, choose **Ubuntu 24.04 LTS**, select the **4GB RAM / 2 vCPU** tier (~$24/mo), add your SSH key, and click **Create Droplet**. [Certain]

### 2. Connect and Create the Non-Root User

SSH into your instance as root:

```bash
ssh root@<YOUR_DROPLET_IP>

```

Run these commands to create your user and restrict system access:

```bash
# 1. Create new user
adduser agentuser

# 2. Grant sudo privileges
usermod -aG sudo agentuser

# 3. Copy SSH keys from root to agentuser
rsync --archive --chown=agentuser:agentuser ~/.ssh /home/agentuser/

# 4. Enable firewall allowing SSH only
ufw allow OpenSSH
ufw --force enable
``` [Certain]

### 3. Log In as `agentuser`
Open a new terminal window on your local computer and verify SSH access:
```bash
ssh agentuser@<YOUR_DROPLET_IP>

```

---

**Please complete Phase 1, or let me know if you hit any setup errors or have questions before we proceed to Phase 2.** Can we move on?
