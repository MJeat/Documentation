# Project 6 — Bandwidth Monitoring + Traffic Shaping (tc / vnStat) (Explained)

This is the "Advanced Logic" of Linux networking. To understand this, imagine your network card (`eth0`) is a **Post Office**. 

Without these rules, the post office is a chaotic room where everyone just throws packages at the clerk. If someone brings 1,000 heavy boxes (your Rclone backup), your tiny letter (your SSH keystroke) gets stuck at the bottom of the pile.

**HTB (Hierarchical Token Bucket)** turns that chaos into **Sorted Lanes.**

---

### Line-by-Line Breakdown

#### 1. The Clean Slate
```bash
sudo tc qdisc del dev eth0 root 2>/dev/null
```
* **What it does:** Wipes out any existing traffic rules on the `eth0` interface.
* **Why we do it:** `tc` is picky. You can’t build a new hierarchy if one is already running. The `2>/dev/null` just hides the error message if there were no rules to delete in the first place.

#### 2. The Master "Boss" (The Root)
```bash
sudo tc qdisc add dev eth0 root handle 1: htb default 20
```
* **`handle 1:`**: We are naming this root "1". 
* **`htb`**: We are using the "Hierarchical Token Bucket" algorithm. It’s great because it allows "borrowing" (if the fast lane is empty, the slow lane can use its speed).
* **`default 20`**: This is the most important part. It says: *"If a packet arrives and I don't recognize it, put it in Lane #20."* (We define Lane 20 as the "Bulk/Slow" lane).

#### 3. The "Fast Lane" (High Priority)
```bash
sudo tc class add dev eth0 parent 1: classid 1:10 htb rate 100mbit ceil 1gbit prio 1
```
* **`classid 1:10`**: We are naming this lane "10".
* **`rate 100mbit`**: This is the **guaranteed** speed. No matter how busy the server is, this lane will *always* get at least 100Mbps.
* **`ceil 1gbit`**: This is the "Ceiling." If no one else is using the internet, this lane can speed up to the full 1Gbps.
* **`prio 1`**: Priority #1. If Lane 10 and Lane 20 both have a packet ready at the exact same microsecond, **Lane 10 goes first.**

#### 4. The "Slow Lane" (Bulk/Backups)
```bash
sudo tc class add dev eth0 parent 1: classid 1:20 htb rate 10mbit ceil 50mbit prio 2
```
* **`classid 1:20`**: This is the "Default" lane we mentioned in Line 2.
* **`rate 10mbit`**: Guaranteed at least 10Mbps.
* **`ceil 50mbit`**: This is a **Hard Cap.** Even if the server is doing absolutely nothing, this lane is *forbidden* from going faster than 50Mbps. This prevents your backups from ever "eating" the whole pipe.
* **`prio 2`**: Lower priority. It has to wait for Lane 10 to finish.

#### 5. The "Traffic Warden" (The Filter)
```bash
sudo tc filter add dev eth0 protocol ip parent 1:0 prio 1 u32 match ip dport 22 0xffff flowid 1:10
```
* **`match ip dport 22`**: Look at the destination port. Port 22 is **SSH**.
* **`flowid 1:10`**: If you see an SSH packet, put it in the **Fast Lane (1:10)**.
* **The Result:** Because all other traffic (like Nginx or Rclone) doesn't match port 22, it falls into the **Default Lane (1:20)** automatically.

---

### Why is this "Ghost Mode" Approved?
On a 1GB RAM VPS, if you start a massive backup to Cloudflare R2, your CPU and Network will spike. Without these rules, your SSH terminal will start lagging—you type a character, and it takes 2 seconds to appear. 

**With these rules:**
1.  Your SSH packets are tagged as **Priority 1**.
2.  They "jump the line" ahead of the backup data.
3.  Your terminal stays buttery smooth, even while the backup is grinding away in the background.

### Summary Table
| Lane ID | Purpose | Guaranteed Speed | Max Speed | Priority |
| :--- | :--- | :--- | :--- | :--- |
| **1:10** | SSH / VPN | 100Mbps | 1Gbps | 1 (Highest) |
| **1:20** | Backups / Web | 10Mbps | 50Mbps | 2 (Lowest) |


### Question: 
> more bullet points for this and explain each word and its usage and purpose of this line. Can i add more than one dport? like 80 or 443 or 3306, etc:
> sudo tc filter add dev eth0 protocol ip parent 1:0 prio 1 u32 match ip dport 22 0xffff flowid 1:10

This command is the **"Traffic Warden"** of your server. It stands at the entrance of your network interface and points specific packets to their assigned lanes.

Here is the deep-dive breakdown of that specific line:

### 🔍 The Anatomy of the Filter Command

* **`sudo`**: Runs the command with root privileges. Since `tc` modifies the Linux Kernel's networking stack, it requires the highest authority.
* **`tc filter`**: Tells the system we are creating a **classifier**. Think of this as the "sorting logic" for incoming/outgoing mail.
* **`add`**: The action. We are creating a new rule (other options are `del`, `change`, or `replace`).
* **`dev eth0`**: Target **device**. This specifies which physical or virtual network card the rule applies to.
* **`protocol ip`**: Filters based on the **Internet Protocol**. This tells the system to look at IPv4 headers (where port numbers live).
* **`parent 1:0`**: This defines the "hook" point. `1:0` is the address of the **Root Qdisc** we created earlier. This is where the sorting happens before packets exit.
* **`prio 1`**: The **Filter Priority**. If you have 10 different filters, the system checks `prio 1` first. Lower numbers are checked before higher numbers.
* **`u32`**: The **Classifier Engine**. It stands for "Universal 32-bit." It’s a very powerful (but complex) engine that can look at any bit inside a packet header.
* **`match ip dport 22`**: The specific **matching criteria**. 
    * `ip`: Look at the IP header.
    * `dport`: Focus on the **Destination Port**.
    * `22`: The port number (SSH).
* **`0xffff`**: The **Bitmask**. This is a hexadecimal way of saying "Match this exact number and nothing else." (In binary, `0xffff` is all ones, meaning every digit of the port must match exactly).
* **`flowid 1:10`**: The **Destination**. If a packet matches all the criteria above, it is sent to **Class 1:10** (our "High Priority" lane).

---

### 🚦 Can you add more than one port?
**Yes.** However, the `u32` matcher is a bit "old school"—it usually prefers one command per port or specific bitmasks for ranges.

#### Option A: Multiple Lines (The "Safe" Way)
This is the easiest to read and manage. You simply run a new command for each service you want to prioritize.

```bash
# Prioritize HTTP (80)
sudo tc filter add dev eth0 protocol ip parent 1:0 prio 1 u32 match ip dport 80 0xffff flowid 1:10

# Prioritize HTTPS (443)
sudo tc filter add dev eth0 protocol ip parent 1:0 prio 1 u32 match ip dport 443 0xffff flowid 1:10

# Prioritize MySQL (3306)
sudo tc filter add dev eth0 protocol ip parent 1:0 prio 1 u32 match ip dport 3306 0xffff flowid 1:10
```

#### Option B: Port Ranges (The "Math" Way)
If you have a range of ports (e.g., 80 to 88), you can use a bitmask, but the math is complicated. For most "Ghost" setups, Option A is much better because it allows you to easily delete or change one port without affecting the others.

---

### 🛠️ Pro-Tip: Prioritizing your Cloudflare Tunnel
Since you are using `cloudflared` (Cloudflare Tunnel), your traffic is actually wrapped inside an **outbound** connection to Cloudflare's edge. 

If you want to make sure your **website visitors** get fast speeds even during a backup, you should prioritize the port Cloudflare Tunnel uses to talk to the internet (usually **Port 7844** for UDP/QUIC or **443** for HTTPS):

```
# Give the Cloudflare Tunnel priority
sudo tc filter add dev eth0 protocol ip parent 1:0 prio 1 u32 match ip dport 7844 0xffff flowid 1:10
```

### 💡 Summary Table for your Project
| Service | Port | Target Class | Why? |
| :--- | :--- | :--- | :--- |
| **SSH** | 22 | `1:10` | Prevents terminal lag. |
| **HTTPS** | 443 | `1:10` | Keeps website snappy for users. |
| **Backups** | (All else) | `1:20` | Lets it run slow so it doesn't break the server. |

