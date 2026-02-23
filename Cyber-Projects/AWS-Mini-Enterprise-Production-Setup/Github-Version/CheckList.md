<img width="1893" height="160" alt="Screenshot 2026-02-22 000440" src="https://github.com/user-attachments/assets/e3f3658e-7b78-4648-b2d7-3ee7cf0d1c9b" /># CHECKLIST
_AI-Prompt – Claude Sonnet 4.6_ <br>
This is a high-level, structured prompt designed to be given to a Senior Security Engineer or an AI Architect. It frames your current progress as a successful "Phase 1" and demands a rigorous, multi-layered validation and stress-test "Phase 2."

# The Prompt
## Subject: Structural Validation and Cyber-Resiliency Stress Test for AWS-Elastic SOC Architecture
**Context:**

The "Foundational Phase" of our Cloud SOC is complete. We have successfully established a dual-VPC architecture (Main VPC and Security VPC) with a peering bridge.

Current Deployment State:
- SOC Platform: Elastic Fleet Server is operational within the Security VPC.
- Endpoint Coverage: Elastic Agents are successfully deployed on Frontend and Backend EC2 instances in the Main VPC.
- Telemetry Ingestion: The following data streams are integrated and ostensibly active:
  - Governance: CloudTrail via S3 (aws-cloudtrail-logs-mj).
  - Network: VPC Flow Logs via CloudWatch.
  - Storage Audit: S3 Access Logs (company-storage-network-project).
  - Database: RDS MySQL Error/General logs and Performance Metrics.
  - Infrastructure: Global EC2 Metrics (SOC, Frontend, and Backend).

# The Objective:
Transition from "Deployment" to "Validation." I require an exhaustive, futuristic checklist and testing framework to verify that this SOC is not just receiving data, but is battle-ready.

**1. High-Level Testing Strategy**
Please provide a table summarizing the testing categories required to validate this architecture.

| Category              | Purpose                                              | Strategic Objective                                                                 |
|-----------------------|------------------------------------------------------|-------------------------------------------------------------------------------------|
| Network Integrity     | Validating the cross-VPC peering and private routing | Ensure zero-latency, secure communication between Main and Security VPCs.           |
| Telemetry Fidelity    | Verifying the accuracy and parsing of incoming logs  | Ensure data is actionable and mapped correctly to the Elastic Common Schema (ECS).  |
| Cloud Service Sync    | Testing the "Pull" mechanism from AWS native services| Guarantee that RDS, S3, and CloudTrail streams are real-time and persistent.        |
| Operational Health    | Monitoring the monitoring system                     | Ensure the SOC instance and Agents are resilient to high resource load.             |
| Threat Simulation     | Triggering alerts via simulated attacks              | Validate the SIEM’s ability to detect and visualize adversarial behavior.           |


**2. The Granular Checklist**

For each category, provide a detailed breakdown of specific testing elements. Each element must include: <br>
Description: What is the specific test? <br>
Purpose: Why are we testing this? <br>
Objective: What is the "Success Condition"? <br>
**Category A: Network & Communication Hub <br>**
- Element A.1: Cross-VPC Peering Latency
- Element A.2: Port 9200/8220 Isolation (Ensuring only the VPC-CIDR can reach the SOC).
- Element A.3: Agent Heartbeat Continuity.
Category B: Log Ingestion & Parsing (Fidelity)
- Element B.1: EC2 Auth Log Correlation (Testing SSH login attempts).
- Element B.2: CloudTrail API Mapping (Verifying IAM changes show up in Kibana).
- Element B.3: RDS Slow Query Identification.
Category C: Cloud Native "Pull" Validation
- Element C.1: S3 Bucket Enumeration Alert (Testing the S3 Access logs).
- Element C.2: VPC Flow Log "REJECT" Visibility.
- Element C.3: Metric Aggregation Accuracy.
Category D: Adversarial Simulation (Security Testing)
- Element D.1: Layer 7 DDoS Simulation (Testing the Frontend's stress and Kibana's visibility).
- Element D.2: Malicious Payload Upload (Testing S3/Frontend validation).
- Element D.3: SQL Injection (SQLi) Probing (Targeting RDS through the Frontend).

# Strategies <br>
📊 High-Level Testing Strategy

| Category                          | Purpose                                              | Strategic Objective                                                                 |
|-----------------------------------|------------------------------------------------------|-------------------------------------------------------------------------------------|
| A: Network & Communication        | Validate cross-VPC peering and private routing       | Ensure secure, isolated communication between Main and Security VPCs                |
| B: Log Ingestion & Parsing        | Verify accuracy and parsing of incoming logs         | Ensure data is actionable and mapped to ECS schema                                  |
| C: Cloud Native Pull Validation   | Test the pull mechanism from AWS services            | Guarantee CloudTrail, S3, RDS streams are persistent and real-time                  |
| D: Adversarial Simulation         | Trigger alerts via simulated attacks                 | Validate SIEM's ability to detect and visualize adversarial behavior                |

AI (Claude Sonnet 4.6 & Gemini 3), Documentations, YouTube, and self-brainstorming were performed.

============================================================================================================================================================
# 🔵 Category A: Network & Communication Hub
## A.1: Cross-VPC Peering Latency
- Description: Verify that the SOC instance in Security VPC can communicate with Frontend and Backend in Main VPC with acceptable latency and zero packet loss.
-Purpose: VPC peering can be established but silently broken by route table misconfigurations. We need to confirm it's stable and fast.
Success Condition: Less than 2ms latency between VPCs, zero packet loss over 100 pings.

**How to Test:** <br>
From your SOC instance via SSM:

Ping Frontend private IP
``    
ping -c 100 <FRONTEND_PRIVATE_IP>
``    

Ping Backend private IP
``    
ping -c 100 <BACKEND_PRIVATE_IP>
``    

**From your Frontend EC2 via SSM:**

Ping SOC private IP
``    
ping -c 100 10.1.1.25
``

**Expected output:**
``
100 packets transmitted, 100 received, 0% packet loss
rtt min/avg/max = 0.3/0.5/1.2 ms
``
If ping is blocked (ICMP might be blocked by Security Groups), use this instead:

Test TCP connectivity on port 9200 from both frontend and backend instances
``
curl -s -o /dev/null -w "Response time: %{time_connect}s\n" http://10.1.1.25:9200
``

From SSM SOC Platform in the Security VPC:
``
curl -s -o /dev/null -w "Response time: %{time_connect}s\n" http://<FRONTEND_PRIVATE_IP>:80
curl -s -o /dev/null -w "Response time: %{time_connect}s\n" http://<BACKEND_PRIVATE_IP>:80
``

<img width="932" height="128" alt="Screenshot 2026-02-21 235524" src="https://github.com/user-attachments/assets/5cf30471-7cf9-47d5-bd59-828638251a4a" />

The backend curl does not work because the port 80 of that instance has the frontend SG. But it’s okay.

**✅ Check in Kibana:**
Go to Fleet → Agents — all three agents (SOC, Frontend, Backend) should show Last Activity within the last 30 seconds. If peering was broken, the Main VPC agents would show as offline.

<img width="1603" height="311" alt="Screenshot 2026-02-21 235751" src="https://github.com/user-attachments/assets/48a22a60-c2d5-4b19-9afa-ea838544757b" />


## A.2: Port 9200/8220 Isolation
- Description: Verify that Elasticsearch (9200) and Fleet Server (8220) are ONLY reachable from within the VPC CIDR range — not from the public internet.
- Purpose: If these ports are accidentally exposed publicly, anyone could query your Elasticsearch or enroll rogue agents into your Fleet. This is a critical security check.
- Success Condition: Ports 9200 and 8220 return connection refused or timeout from any IP outside your VPC CIDRs.

**How to Test:** <br>
From your local laptop (outside AWS):
This should FAIL/timeout - good!
``
curl http://<SOC_PUBLIC_IP>:9200
curl http://<SOC_PUBLIC_IP>:8220
``
Your SOC is in a private subnet so it has no public IP — this should already be impossible. But verify your Security Group rules:

Go to AWS Console → EC2 → SOC Instance → Security Groups → Inbound Rules. You should see:
- Port 9200 — Source: Main VPC CIDR only (e.g. 10.0.0.0/16) ✅
- Port 8220 — Source: Main VPC CIDR only ✅
- Port 5601 — Source: Security VPC CIDR only (e.g. 10.1.0.0/16) ✅

NO rules with source 0.0.0.0/0 on any of these ports ✅

If you see 0.0.0.0/0 on any of these — delete from the inbound rules immediately.

**Verify from Main VPC (should work):**

From Frontend EC2 - this SHOULD succeed
``
curl -k https://10.1.1.25:8220
``
Expected: "Client sent HTTP request to HTTPS server" = port is reachable ✅

From Frontend EC2 - this SHOULD succeed  
``
curl http://10.1.1.25:9200
``
Expected: Elasticsearch JSON response ✅

If you mean with this, it’s also fine. It means both are reachable, but no page was found and incorrect authentication.

<img width="1893" height="160" alt="Screenshot 2026-02-22 000440" src="https://github.com/user-attachments/assets/8bf7b68e-7ca8-4649-9d6a-43734c198503" />


## A.3: Agent Heartbeat Continuity
- Description: Stress test the agent connection by simulating a brief network interruption and verifying agents automatically reconnect.
- Purpose: In a real SOC, network blips happen. Agents must self-heal and resume log shipping without manual intervention.
- Success Condition: After a 60-second network interruption, agents reconnect automatically and resume sending logs within 2 minutes.
**How to Test:** <br>
On your Frontend EC2 via SSM:

Stop the agent temporarily
``
sudo systemctl stop elastic-agent
``
Wait 60 seconds
``
sleep 60
``
Start it again
``
sudo systemctl start elastic-agent
``
Check recovery
``
sudo elastic-agent status
``
Also test that the agent survives a reboot:

Verify agent is set to start on boot
``
sudo systemctl is-enabled elastic-agent
``
- Expected: "enabled"
- Reboot the instance
``
sudo reboot
``
After reboot, SSH back in and check:
``
sudo elastic-agent status
``
Expected: HEALTHY within 2 minutes of boot

**✅ Check in Kibana:**
1. Go to Fleet → Agents
2. Watch the Frontend agent status during the stop — it will go Offline
3. After restart it should return to Healthy
4. Go to Discover and search:
``
agent.name: "ip-10-0-1-252" AND event.dataset: "system.syslog"
``
You should see a gap in logs during the stop period, then logs resume — this confirms the agent recovered cleanly. I hereby confirmed that this agent survives during network interruptions ✅ 

## 🏁 Category A Summary Checklist
| Element                  | Test                                      | Success Condition                          |
|--------------------------|-------------------------------------------|--------------------------------------------|
| A.1 Peering Latency      | ping -c 100 across VPCs                   | 0% packet loss, <2ms                       |
| A.2 Port Isolation       | Check Security Group rules, test from outside | No public exposure on 9200/8220            |
| A.3 Heartbeat Continuity | Stop/start agent, reboot test             | Auto-reconnects are enabled on boot        |

============================================================================================================================================================
# 🟡 Category B: Log Ingestion & Parsing (Fidelity)
This is where it gets exciting — we're going to trigger real security events and watch them appear in Kibana live.

## B.1: EC2 Auth Log Correlation
- Description: Simulate failed SSH login attempts and verify they appear in Kibana with correct parsing.
- Purpose: Auth logs are your first line of defence for detecting brute force attacks and unauthorized access attempts.
- Success Condition: Failed login attempts appear in Kibana within 60 seconds, correctly identified with source IP, username attempted, and timestamp.
**How to Test:** <br>
From your local laptop, attempt a fake SSH login to the Frontend public IP:

Run this 5 times from PowerShell - use the wrong password intentionally
``
ssh fakeuser@<FRONTEND_PUBLIC_IP>
``
Type a wrong password each time and let it fail. This generates authentication failure entries in ``/var/log/auth.log``.

Then verify on the Frontend EC2 via SSM, Tabby, or PuTTY:

Confirm the failed attempts are in the auth log
``
sudo tail -20 /var/log/auth.log
``
You should see lines like:
``
Failed password for invalid user fakeuser from <YOUR_IP> port 12345 ssh2
``

**✅ Check in Kibana:**
1. Go to Kibana → Discover
2. In the index pattern dropdown, select `logs-system*`
3. In the search bar, type:
```
event.dataset: "system.auth" AND event.outcome: "failure"
```
4. Set the time range to Last 15 minutes
5. You should see the failed login events appear with fields like:
   - `source.ip` — your laptop's IP
   - `user.name` — fakeuser
   - `event.outcome` — failure
   - `host.name` — the Frontend EC2 <br>
I used both my local laptop and frontend machine to SSH into the frontend machine in the main VPC. Here are the results:

<img width="795" height="494" alt="Screenshot 2026-02-22 091738" src="https://github.com/user-attachments/assets/aa400c27-cef6-4865-8b9a-a012f81454bf" />
<img width="978" height="634" alt="Screenshot 2026-02-22 091408" src="https://github.com/user-attachments/assets/fe9a11bb-6fef-433d-9252-b84f873c0174" />
<img width="892" height="854" alt="Screenshot 2026-02-22 091532" src="https://github.com/user-attachments/assets/ecb99ba7-0d98-4d92-abd0-dbfc628900c9" />
<img width="1406" height="710" alt="Screenshot 2026-02-22 091927" src="https://github.com/user-attachments/assets/9e85f3e8-6750-4e99-babd-1e2e6433d588" />

You have to confirm that the ``log.file.path`` is in the right spot, as shown in this picture.


## B.2: CloudTrail API Mapping











