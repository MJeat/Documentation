# Phase 5: Cloudflare R2 + Rclone Backup Automation

**What this project is about:**

Every server setup needs a backup strategy. If your VPS gets corrupted, accidentally wiped, or your DigitalOcean account has an issue, you want your data somewhere else entirely — on a completely separate platform.
This project uses Cloudflare R2 as your backup destination. R2 is Cloudflare's object storage (think Amazon S3 but with zero egress fees — you pay to store data but not to read it back). Rclone is a command-line tool that syncs files between your server and any cloud storage provider — S3, R2, Google Drive, Backblaze, and dozens more.

R2 is S3-compatible, meaning any tool that works with Amazon S3 also works with R2 — including Rclone.

## Step 1 — Create a Cloudflare R2 bucket

- In Cloudflare dashboard → R2 → Create bucket
- Name it something like `ubuntu-king-backup`
- Choose a region (auto is fine for personal use)
- R2 free tier: 10GB storage, 1 million Class A operations/month — likely enough for personal backups

## Step 2 — Generate R2 API credentials

- In R2 dashboard → Manage R2 API tokens → Create API token (See Image. It's at the bottom right.)

<img width="1002" height="435" alt="image" src="https://github.com/user-attachments/assets/bd2aeda9-7331-49f8-ad9f-2d14e3d784bb" />


- Set permissions to "Object Read & Write" scoped to your bucket
- For security purposes, choose `Specify bucket(s)` as `Apply to specific buckets only`. But for personal VPS or production, you can pick `Apply to all buckets in this account (including newly created buckets)`

However, for this project, I picked the secured option.

- Click `Create Account API Token`
- Save the Access Key ID and Secret Access Key — you only see the secret once. Or simply save all tokens in the password manager.
- Note your R2 endpoint URL — format is `https://ACCOUNT_ID.r2.cloudflarestorage.com`

## Step 3 — Install Rclone on your VPS
```
curl https://rclone.org/install.sh | sudo bash
```
## Step 4 — Configure Rclone for R2
```
rclone config
```
Follow these exact inputs:
- `n)` New remote
- name: `ubuntu-king-backup-r2`
- Storage Type: Type `s3` (or find the number for Amazon S3 Compliant Storage)
- provider: Choose `Cloudflare` (should be option 6 or similar)
- env_auth: `false`
- access_key_id: `(Paste your Access Key ID)`
- secret_access_key: `(Paste your Secret Access Key)`
- region: `auto` (or leave blank)
- endpoint: `(Paste that https://... link you copied)`
- location_constraint: `(Leave blank)`
- acl: `private`

This creates a config at `~/.config/rclone/rclone.conf`

Since we chose `Specify bucket(s)` as `Apply to specific buckets only`, we have to add an extra line in the `rclone.conf`
```
~/.config/rclone/rclone.conf
```

Write this like this:

```
[ubuntu-king-backup-r2]
no_check_bucket = true          # This is where you should add
type = s3
provider = Cloudflare
access_key_id = {KEY}
secret_access_key = {KEY}
region = auto
endpoint = {KEY}
```
We add this because we don't want Cloudflare to check for the account-level privilege. No politeness, just get straight to work. It's safe.

## Step 5 — Test the connection
```
rclone config show ubuntu-king-backup-r2
echo "Ghost Mode Backup Test" > test.txt
rclone copy test.txt ubuntu-king-backup-r2:ubuntu-king-backup
```
You shouldn't see any output or error here. Then, go back to the R2 dashboard and find your test.txt.

## Structure Explain

`rclone copy test.txt ubuntu-king-backup-r2:ubuntu-king-backup`
- You upload test.txt from your OS
- `ubuntu-king-backup-r`: this is your rclone name. Can check it out at
```
~/.config/rclone/rclone.conf
```
- `ubuntu-king-backup`: this is your R2 bucket name

## Step 6 - Upload via scripts (Manual) 
Location: `~/`
- Create a bash script called `ubuntu-king-backup.sh` that takes logs from `auth.log`:
```
#!/bin/bash
rclone copy /var/log/auth.log ubuntu-king-backup-r2:ubuntu-king-backup
```
Then:
```
chmod 777 ubuntu-king-backup.sh
./ubuntu-king-backup.sh
```
Lastly, check your R2 dashboard.

<img width="1086" height="196" alt="image" src="https://github.com/user-attachments/assets/78fb0382-8193-4989-b60d-57bf4a431db6" />

## Better version:

```
#!/bin/bash

# Configuration
REMOTE="ubuntu-king-backup-r2:ubuntu-king-backup"
TIMESTAMP=$(date +"%Y-%m-%d")
RETENTION="10d"  # Change to 10d for 10 days

# 1. Copy the logs into a dated folder on R2
rclone copy /var/log/auth.log $REMOTE/logs/$TIMESTAMP/ --no-check-bucket
rclone copy /var/log/access.log $REMOTE/logs/$TIMESTAMP/ --no-check-bucket

# 2. Automation: Delete backups older than your retention period
rclone delete $REMOTE/logs/ --min-age $RETENTION --no-check-bucket
```

## Step 6 - Upload via scripts (Automation) 

We are gonna use crontab for this.
```
sudo crontab -e
```
Add this at the bottom:
`59 11 * * * /root/automation-ubuntu-king-backup.sh`
- So, every single morning at 11:59 AM, my VPS will trigger the backup.

Of this script:
```
# Edit this file to introduce tasks to be run by cron.
# 
# Each task to run has to be defined through a single line
# indicating with different fields when the task will be run
# and what command to run for the task
# 
# To define the time you can provide concrete values for
# minute (m), hour (h), day of month (dom), month (mon),
# and day of week (dow) or use '*' in these fields (for 'any').
# 
# Notice that tasks will be started based on the cron's system
# daemon's notion of time and timezones.
# 
# Output of the crontab jobs (including errors) is sent through
# email to the user the crontab file belongs to (unless redirected).
# 
# For example, you can run a backup of all your user accounts
# at 5 a.m every week with:
# 0 5 * * 1 tar -zcf /var/backups/home.tgz /home/
# 
# For more information see the manual pages of crontab(5) and cron(8)
# 
# m h  dom mon dow   command
59 11 * * * /root/automation-ubuntu-king-backup.sh
```

## Crontab Structure Explain:

Think of it as: "At [Minute] [Hour] [Day of Month] [Month] [Day of Week], do [This Command]."
- `Hour` is a 24-hour clock
- `*` means EVERY
  - `*` in the Month slot means Every month 

# Phase 6: Bandwidth Monitoring + Traffic Shaping (tc / vnStat)
### What this project is

I wanted to understand bandwidth and throughput better — this project is built exactly for that. Rather than just reading theory, you'll use real Linux tools to **observe**, **measure**, and **actively control** network traffic on your VPS.

There are two halves to this project. The first half is **monitoring** — using vnStat to track how much data your server sends and receives over time. The second half is **traffic shaping** — using Linux `tc` (traffic control) to actually limit, delay, or prioritize traffic on your network interface, so I can see firsthand how bandwidth constraints affect throughput.

### Bandwidth vs throughput — the core concept

These two terms get confused constantly. Here's the clearest way to think about them:

- **Bandwidth** is the maximum capacity of a pipe — how wide it is. Your DigitalOcean Droplet has a 1Gbps network interface. That's the bandwidth ceiling.
- **Throughput** is how much data actually flows through the pipe at a given moment — how full it is. If you're transferring a file and seeing 50Mbps, that's your throughput. It's always ≤ bandwidth.

The gap between bandwidth and throughput is caused by things like packet loss, latency, protocol overhead, congestion, and CPU limits. This project lets you manufacture those conditions artificially so you can observe exactly what happens.

## Step 1 — Install vnStat
```
apt install vnstat -y
systemctl enable vnstat
systemctl start vnstat
```
- vnStat passively monitors your network interface and stores historical stats in a database
- It tracks hourly, daily, monthly, and total traffic
- Very lightweight — runs as a daemon, barely uses any resources

## Step 2 — Check which interface to monitor**
```
ip link show
```
- Your main interface is usually `eth0` or `ens3` on DigitalOcean
- vnStat auto-detects it but confirm: `vnstat --iflist`

## Step 3 — Read vnStat reports**
```
vnstat                    # summary
vnstat -d                 # daily breakdown
vnstat -m                 # monthly breakdown
vnstat -h                 # hourly breakdown (last 24h)
vnstat -l                 # live traffic monitor (like top, but for bandwidth)
vnstat --live             # same, with a real-time graph
```

Leave `vnstat -l` running while you do other things on the server — watch the numbers change as traffic flows. This builds intuition for what "normal" traffic looks like on your server.

## Step 4 — Install iproute2 (tc)**
```
apt install iproute2 -y
```
`tc` (traffic control) is part of the Linux kernel's networking stack. It lets you attach queuing disciplines (qdiscs) to network interfaces that control how packets are sent.

## Step 5 — Baseline speed test (before any shaping)
```
apt install speedtest-cli -y
speedtest-cli
```
Record your baseline download/upload speeds. This is your reference point.

### Testing with Ping

- First, try to ping `8.8.8.8` and note the `ms`
- Next, paste this command:

```
sudo tc qdisc add dev eth0 root netem delay 100ms
```
- Then, ping again and see the `ms` difference
- To remove the delay limit:

```
sudo tc qdisc del dev eth0 root
```

## Step 6 — Apply a bandwidth limit with tc

Limit outbound traffic to 10Mbps on your main interface:
```
tc qdisc add dev eth0 root tbf rate 10mbit burst 32kbit latency 400ms
```

Breaking this down:
- `qdisc add dev eth0 root` — attach a queuing discipline to eth0
- `tbf` — Token Bucket Filter — the simplest rate limiter
- `rate 10mbit` — maximum send rate
- `burst 32kbit` — how much can burst above the rate briefly
- `latency 400ms` — max time a packet can wait in the queue

Run speedtest again — you'll see throughput capped at ~10Mbps even though your interface supports 1Gbps. That's bandwidth limiting in action.

## Step 7 — Add artificial latency with netem

`netem` (network emulator) lets you simulate bad network conditions:

```
# Add 100ms delay to all outgoing packets
tc qdisc add dev eth0 root netem delay 100ms

# Add 100ms delay with 20ms jitter (realistic variation)
tc qdisc add dev eth0 root netem delay 100ms 20ms

# Add 10% packet loss
tc qdisc add dev eth0 root netem loss 10%

# Combine delay + packet loss | Can use this structure to add-on multiple limitations such as delay and loss
tc qdisc add dev eth0 root netem delay 100ms loss 5%
```

After applying each rule, ping a remote server and watch the RTT change:
```
ping google.com -c 4
```

Note for the `loss 5%`: it means it has a 5% chance that there will be a packet loss. If you want to see that 5%, you have to ping more: `ping google.com -c 50`

## Step 8 — Remove tc rules
```
tc qdisc del dev eth0 root
```
Always clean up after testing — you don't want a 10Mbps cap running permanently on your production server.

## Step 9 — View current tc rules
```
tc qdisc show dev eth0
tc class show dev eth0
tc filter show dev eth0
```

**Before setting the limitations:**
<img width="999" height="91" alt="image" src="https://github.com/user-attachments/assets/7270ff34-1d30-40d7-aaf7-1e3056e66c49" />

**1. `qdisc fq_codel 0: root`**
- `fq_codel` (Fair Queuing Controlled Delay): This is the "Smart Traffic Guard." Its job is to make sure one single massive download (like your Rclone backup) doesn't "choke" small, fast packets (like your SSH keystrokes). It keeps things snappy.
- `root`: This is the boss rule sitting at the very top of your network interface.

**2. The Technical Stats**
- `limit 10240p`: This is the "Waiting Room." It can hold 10,240 packets before it starts throwing new ones in the trash because it's too full.
- `flows 1024`: It can track 1,024 different "conversations" (connections) at once and try to give them all equal turns.
- `target 5ms / interval 100ms`: This is the "Lag Detector." If a packet stays in the waiting room longer than 5ms over a 100ms window, fq_codel identifies it as a "clog" and starts managing it more aggressively to keep latency low.
- `ecn` (Explicit Congestion Notification): It tries to tell the sender "Hey, slow down!" before it's forced to drop the packet entirely.

**After setting the limitations:**
<img width="592" height="110" alt="image" src="https://github.com/user-attachments/assets/6306cf9f-edc8-4f6d-9187-dae60c64442f" />


## Step 10 — Advanced: prioritize traffic with HTB

HTB (Hierarchical Token Bucket) lets you create traffic classes with different priorities:

```
# 1. Clear existing rules
sudo tc qdisc del dev eth0 root 2>/dev/null

# 2. Add a root HTB (Hierarchical Token Bucket)
sudo tc qdisc add dev eth0 root handle 1: htb default 20

# 3. Create a High-Priority Class (for SSH/VPN) - 100mbps guaranteed
sudo tc class add dev eth0 parent 1: classid 1:10 htb rate 100mbit ceil 1gbit prio 1

# 4. Create a Bulk Class (for Backups/Nginx) - 10mbps limit
sudo tc class add dev eth0 parent 1: classid 1:20 htb rate 10mbit ceil 50mbit prio 2

# 5. Filter traffic into classes (Assign SSH port 22 to High-Priority)
sudo tc filter add dev eth0 protocol ip parent 1:0 prio 1 u32 match ip dport 22 0xffff flowid 1:10
```

This ensures SSH traffic always gets bandwidth, even when your Rclone backup is saturating the connection — a real-world scenario you'll encounter.

### HTB Explanation

Check this file location: [Location]()

## Question
> Does it survive upon reboots? No, so how to make it permanent?

Since Linux doesn't have a built-in `tc-save` command (like `iptables-save`), the "Ghost Mode" way is to create a small **Systemd Service**. This ensures the rules are applied automatically after a reboot, as soon as the network is ready.

### Step 1: Create the Traffic Shaper Script
First, we put all your rules into a clean script.

```
sudo nano /usr/local/bin/set-traffic-shaper.sh
```

**Paste this in (adjusted for your ports):**
```
#!/bin/bash
# 1. Configuration
INTERFACE="eth0"

# 2. Clear existing rules
tc qdisc del dev $INTERFACE root 2>/dev/null

# 3. Define the Root (HTB)
# We set default lane to 20
tc qdisc add dev $INTERFACE root handle 1: htb default 20

# 4. Create High-Priority Class (1:10)
# Guaranteed 100mbit, can burst to 1gbit
tc class add dev $INTERFACE parent 1: classid 1:10 htb rate 100mbit ceil 1gbit prio 1

# 5. Create Bulk Class (1:20)
# Hard cap at 50mbit to prevent server choking
tc class add dev $INTERFACE parent 1: classid 1:20 htb rate 10mbit ceil 50mbit prio 2

# 6. Filters (Assigning Ports to High-Priority)
# SSH
tc filter add dev $INTERFACE protocol ip parent 1:0 prio 1 u32 match ip dport 22 0xffff flowid 1:10
# HTTPS (Web Traffic)
tc filter add dev $INTERFACE protocol ip parent 1:0 prio 1 u32 match ip dport 443 0xffff flowid 1:10
# Cloudflare Tunnel (Standard port)
tc filter add dev $INTERFACE protocol ip parent 1:0 prio 1 u32 match ip dport 7844 0xffff flowid 1:10
```

**Make it executable:**
```
sudo chmod +x /usr/local/bin/set-traffic-shaper.sh
```

---

### Step 2: Create the Systemd Service
This tells Ubuntu to run that script every time the server boots up.

```
sudo nano /etc/systemd/system/traffic-shaper.service
```

**Paste this in:**
```ini
[Unit]
Description=Apply Traffic Shaping tc rules
After=network.target

[Service]
Type=oneshot
ExecStart=/usr/local/bin/set-traffic-shaper.sh
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
```

---

### Step 3: Enable and Start
Run these commands to activate the automation:

```bash
# Reload systemd to see the new file
sudo systemctl daemon-reload

# Enable it so it runs on every boot
sudo systemctl enable traffic-shaper.service

# Start it now for the first time
sudo systemctl start traffic-shaper.service
```

---

### 🛡️ How to manage it going forward

* **To check if it's working:**
    `tc qdisc show dev eth0` (You should see `htb` as the root).
* **To change the rules:**
    Just edit `/usr/local/bin/set-traffic-shaper.sh` and then run `sudo systemctl restart traffic-shaper.service`.
* **To remove it permanently:**
    ```
    sudo systemctl disable traffic-shaper.service
    sudo tc qdisc del dev eth0 root
    ```

### Why this is the "Best" way:
By using `RemainAfterExit=yes`, the service stays in an "active" state in your system status. If you ever wonder if your traffic shaping is on, you can just run `systemctl status traffic-shaper` and see a nice green light.

---

### What I learned

- The precise difference between bandwidth, throughput, latency, and jitter — with hands-on evidence
- How Linux's traffic control subsystem works — qdiscs, classes, filters
- How Token Bucket Filter (TBF) rate limiting works mathematically
- How netem simulates real-world network conditions — used by engineers to test app resilience
- How HTB traffic shaping prioritizes certain traffic over others
- How vnStat collects and presents historical bandwidth data
- Why throughput is almost always less than bandwidth and what causes the gap
- How packet loss disproportionately destroys TCP throughput (you'll see this clearly with netem)

---

### Key concepts you'll understand after this

| Concept | What you'll understand |
|---|---|
| Bandwidth | The pipe capacity — maximum possible rate |
| Throughput | Actual data rate achieved — always ≤ bandwidth |
| Latency | Time for a packet to travel from A to B |
| Jitter | Variation in latency — causes problems for real-time apps |
| Packet loss | Dropped packets — TCP retransmits cause severe throughput drops |
| qdisc | Queuing discipline — the algorithm controlling packet scheduling |
| TBF | Token bucket filter — simplest rate limiter |
| HTB | Hierarchical token bucket — prioritized traffic shaping |
| netem | Network emulator — artificial delay, loss, corruption |
| vnStat | Passive bandwidth logger — historical traffic stats |

---

### Experiments to run

These are the most educational things you can do once the tools are set up:

1. **Latency vs throughput** — add 200ms netem delay, run a file transfer, watch throughput collapse. TCP's congestion window shrinks under high latency.
2. **Packet loss cliff** — add 1% loss, measure throughput. Then 5% loss. Then 10%. The throughput drop is non-linear and dramatic.
3. **Backup vs SSH priority** — start an `rclone sync` (bulk transfer), then SSH in. Without HTB, SSH feels laggy. With HTB priority rules, SSH stays snappy.
4. **Monthly usage tracking** — leave vnStat running for a week and check `vnstat -m`. You'll see exactly how much data your server uses — useful for staying within DigitalOcean's 1TB/mo transfer limit.

---

### Estimated cost

| Item | Cost |
|---|---|
| vnStat | Free, open source |
| iproute2 / tc | Free, built into Linux kernel |
| DigitalOcean Droplet (existing) | $6/mo |
| **Total** | **~$7/mo (no change)** |

---

### Gotchas to watch out for

- **tc rules don't survive reboots** — they're applied in memory only. If you want permanent rules, add them to a startup script or use `tc-persistent` packages.
- **Apply tc to the right interface** — double-check with `ip link show`. Applying to the wrong interface does nothing or breaks things.
- **netem applies to outbound traffic only** — tc shapes egress (outgoing) traffic by default. Incoming traffic shaping requires ingress qdiscs which are more complex.
- **Don't leave rate limits on your production server** — always remove test rules with `tc qdisc del dev eth0 root` after experimenting.
- **vnStat needs time to collect data** — it won't show useful stats immediately. Let it run for at least a few hours before reading reports.
- **DigitalOcean's 1TB/mo transfer limit** — your Basic Droplet includes 1TB outbound transfer/month. vnStat helps you track this so you don't get surprise overage charges ($0.01/GB after 1TB).

---

### How this connects to later projects
Understanding bandwidth and traffic shaping directly feeds into Project 08 (ELK) and Project 09 (Honeypot) — both generate significant log and network data. Knowing how to read traffic patterns with vnStat and shape traffic with tc means you can spot anomalies (a honeypot getting hammered, a backup saturating your connection) and react intelligently. It also builds the mental model for understanding network metrics in Grafana dashboards.













