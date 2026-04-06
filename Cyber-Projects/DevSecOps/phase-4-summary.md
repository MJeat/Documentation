# 👻 Ghost Mode Server: The Grand Architecture

I’ve built a private, invisible ecosystem where every piece has a specific job.

Think of this VPS as a high-security building. **Tailscale** is the secret underground tunnel to get inside, and **CoreDNS** is the directory in the lobby telling you which room is which.

---

## 🏗️ Phase 1: The Foundation (Tailscale)
Before anything else, Tailscale creates a virtual network interface on your VPS called `tailscale0`.

* **The IP:** Your VPS is assigned a private IP (e.g., `100.x.x.x`).
* **The Security:** UFW (the firewall) is set to `default deny`, but we added `allow in on tailscale0`.
* **The Result:** The public internet sees a brick wall. You, via Tailscale, see an open door.

---

## 🗺️ Phase 2: The GPS (CoreDNS)
Humans hate typing `100.x.x.x:8090`. We want to type `monitor.internal`.

1.  **The Corefile:** This is the "Instructions Manual." It tells CoreDNS: *"If someone asks for something ending in `.internal`, look at my map file (`db.internal`). If they ask for anything else (like `google.com`), go ask Cloudflare (1.1.1.1)."*
2.  **The Zone File (`db.internal`):** This is the "Map." You wrote a line: `monitor IN A 100.x.x.x`. This hard-codes the name to your private IP.
3.  **The Connection:** In your Tailscale Admin settings, you set your VPS IP as the Nameserver. Now, when your laptop or your VPS itself asks "Where is `monitor.internal`?", Tailscale routes that question to your CoreDNS container.

---

## 🧠 Phase 3: The Command Center (Beszel Hub)
The Hub is the "Brain" that stores your data and shows you the pretty graphs.

* **Binding:** In `docker-compose`, we mapped the port as `"100.x.x.x:8090:8090"`.
* **Meaning:** This ensures the dashboard is **only** listening on the Tailscale "Private Road." It is physically impossible for a hacker on the public internet to even see that Port 8090 exists.
* **The Key/Token:** The Hub generates a unique Security Key. This ensures that only *your* agents can send data to *your* hub.

---

## 🕵️ Phase 4: The Spy (Beszel Agent)
The Agent is the "Worker" that sits on the actual hardware to report stats.

1.  **`network_mode: host`:** This is crucial. Normally, Docker containers are "caged" and only see their own tiny bit of RAM. By using `host` mode, the Agent "breaks out" and can see the real Ubuntu CPU, RAM, and Disk usage.
2.  **`HUB_URL` (The Phone Call):** You configured the agent with `http://monitor.internal:8090`.
3.  **The Loop:**
    * The Agent says: "I need to report to `monitor.internal`."
    * It asks the system for the IP.
    * The system asks **CoreDNS**.
    * CoreDNS says: "That's `1100.x.x.x`."
    * The Agent sends the data to that IP, hitting the **Beszel Hub**.

---

## 🔄 How Everything Talks Together (The Flow)

| Step | Component | Action | Path |
| :--- | :--- | :--- | :--- |
| **1** | **CoreDNS** | Listens for name requests | `tailscale0:53` |
| **2** | **Beszel Hub** | Waits for data and user login | `tailscale0:8090` |
| **3** | **Beszel Agent** | Grabs CPU/RAM stats from Host | `/proc` & `/var/run/docker.sock` |
| **4** | **Beszel Agent** | Resolves `monitor.internal` | Via **CoreDNS** |
| **5** | **Beszel Agent** | Delivers data to Hub | Internal Tailscale Network |
| **6** | **You (Laptop)** | Types `monitor.internal:8090` | Through **Tailscale Tunnel** |

---

## 🛡️ Why this setup is "Elite"
Most people just open Port 8090 to the world and hope their password is strong enough. You have:

1.  **Hidden the Port:** Only accessible via Tailscale.
2.  **Custom Branding:** Using your own internal DNS.
3.  **Internal Communication:** The Agent and Hub talk to each other using the same private tunnel you use to manage the server.

> [!IMPORTANT]
> **Final Note on the Firewall:** It only trusts traffic coming through the Tailscale "Tunnel." If the tunnel is off, the server is essentially a black hole to the rest of the internet.







