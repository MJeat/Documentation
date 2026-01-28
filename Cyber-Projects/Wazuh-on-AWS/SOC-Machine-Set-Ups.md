
# Part 1: Initials
## Initials:
```
sudo apt update && sudo apt upgrade -y
sudo apt install curl unzip -y
```

Install Wazuh
```
sudo ./wazuh-install.sh -a 
```

If an error says,
```
19/01/2026 16:56:29 ERROR: The recommended systems are: Red Hat Enterprise Linux 7, 8, 9; CentOS 7, 8; Amazon Linux 2; Ubuntu 16.04, 18.04, 20.04, 22.04. The current system does not match this list. Use -i|-
-ignore-check to skip this check.
```
Type this:
```
sudo bash ./wazuh-install.sh -a -i
```
This is the result: <br/>
<img width="866" height="206" alt="Screenshot 2026-01-20 000244" src="https://github.com/user-attachments/assets/76aa298e-561c-4fd1-a4c0-9c5669a13917" />

Confirmation:
```
sudo systemctl status wazuh-manager
sudo systemctl status wazuh-dashboard
sudo systemctl status wazuh-indexer
```

## Browser Login:
- Get your IPv4 Public IP
- Make sure your Security Group has HTTPS, port 443, and "My IP" as an option
- In the firewall inbound edit, your "My IP" option should look like this:
```
{Your-Laptop-Public-IP}/16
```
**_Note: To find your public IP, go to your Ubuntu server (before configuring this security group), then type who am i, and you will see the public IP at the end._**
- This is what you should type in the browser
```
https://{Instance-IPv4-Public-IP}:443
```
Or simply go to this link to find your public IP: [Whatismyip](https://whatismyipaddress.com/)

# Part 2: SOC Machine (Wazuh Manager) – Security Groups
Do this to let the victim machine send the logs to the SOC machine securely. We create communication. 

**_Note_**:
**/16 vs /32?**
- AWS uses CIDR notation to define how many IP addresses are allowed through the "door."
- /32 (The Single Target): This means one exact IP address. If your Victim's Private IP is 172.31.80.20, you enter 172.31.80.20/32. Use this for your 3-day lab to be as strict as possible.
- /16 (The Whole Neighborhood): This covers roughly 65,000 IPs. If you enter 172.31.0.0/16, any machine in your AWS VPC can talk to the SOC. This is easier if you plan on adding 10+ victims later.
- Recommendation: Use /32 for now because it is one specific machine/source.

## Step 1: Security Rules set up: <br/>
<img width="1895" height="767" alt="image" src="https://github.com/user-attachments/assets/a363b4fc-e0a8-4fb9-85c3-93bb21b2000a" />

_**Note**_:
For HTTPS and SSH, we use My IP. But don’t use your real public IP. You just need to type the first 2 octets and add 2 zeros at the end with the subnet of 16. 
Example:
```
83.43.123.43 is my public IP, but I only need to write 83.43.0.0/16
```
Don’t use a subnet of /32 because your public IP can change later. Use /16 gives more room to hope around. Moreover, the other 2 identical IPs are Serverside (Agent) private IP. Make sure it is /32 because we want it to only connect to that specific IP. No hoping around.

## Step 2: Check ServerSide (Agent):
- Make sure the agent instance is active and running.
- Copy its private IP (e.g., 172.x.x.x)

## Step 3: Create Agent:
On the Wazuh manager machine or the SOC machine:
- Add/Remove/Edit agents on the Wazuh Manager machine:
```
sudo /var/ossec/bin/manage_agents
```
You will see this output:
```
Please provide the following:                                                                                                                                                                               
  * A name for the new agent: ServerSide-Attack-Simulation                                                                                                                                                   
  * The IP Address of the new agent: 172.31.29.75                                                                                                                                                            
Confirm adding it?(y/n): y                                                                                                                                                                                    
Agent added with ID 001.                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                                                     
****************************************                                                                                                                                                                      
* Wazuh v4.7.5 Agent manager.          *                                                                                                                                                                      
* The following options are available: *                                                                                                                                                                      
****************************************                                                                                                                                                                      
  (A)dd an agent (A).                                                                                                                                                                                        
  (E)xtract key for an agent (E).                                                                                                                                                                            
  (L)ist already added agents (L).                                                                                                                                                                           
  (R)emove an agent (R).                                                                                                                                                                                     
  (Q)uit.                                                                                                                                                                                                    
Choose your action: A,E,L,R or Q: E                                                                                                                                                                           
                                                                                                                                                                                                             
Available agents:                                                                                                                                                                                             
  ID: 001, Name: ServerSide-Attack-Simulation, IP: 172.31.29.75                                                                                                                                              
Provide the ID of the agent to extract the key (or '\q' to quit): 001                                                                                                                                         
                                                                                                                                                                                                             
Agent key information for '001' is:                                                                                                                                                                           
MDAxIFNlcnZlcnNpZGUtYXR0YWNrLXNpbXVsYXRpb24gMTcyLjMxLjI5Ljc1IDFmZGE3YWQwOTdkMmNlMjkyM2ZlN2ExMzA5NDIxOWYxNTJiZWE3NTg5YzIwYmYxMzk2YTRmZjc0OTZlZjQ0Yjc=
```

## Step 4: Check active agents from DefenderSide – Confirmation
```
sudo /var/ossec/bin/agent_control -lc   
```
You should see active agents here. Look for the name that you 

## Step 5: Check ports
```
sudo ss -tulnp | grep 1514
sudo ss -tulnp | grep 1515
```
If both are LISTEN, everything is all good. You may now go to set up the [ServerSide](https://github.com/MJeat/Documentation/blob/main/Cyber-Projects/Wazuh-on-AWS/ServerSide-Machine-Set-Ups.md) or the victim machine now. 

# Part 3: Logs 
**DefenderSide:**
```
sudo tail -f /var/ossec/logs/ossec.log
```
