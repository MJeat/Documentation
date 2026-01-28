
# Part 1: Initials
Installation:
```
sudo apt update && sudo apt upgrade -y
sudo apt install wazuh-agent -y
```
## Step 1: Check versions
Make sure both are the same version. Wazuh manager and agent machines version:
```
sudo /var/ossec/bin/wazuh-control info -v
```
## Step 2: Changing Version 
- If both your agent and manager have the same version, move on to step 3.
- If the versions are not the same, you have to downgrade or upgrade either the agent or the manager. In this document, we will downgrade the agent. Currently, my agent version is 4.14.2, but my manager is 4.7.5. You should go to the [Issue]()
## Step 3: Add the agent key  
Edit/Import key from Wazuh Manager machine to the Agent machine:
```
sudo /var/ossec/bin/manage_agents
```
Example: <br>
<img width="1688" height="778" alt="Screenshot 2026-01-20 170355" src="https://github.com/user-attachments/assets/18a5cbc4-b62f-44f8-b7ff-3cd3cd4948c2" />

## Step 4: Add Manager Private IP
Edit Agent & Manager machine:
```
sudo nano /var/ossec/etc/ossec.conf
```
Make sure this IP here is replaced with the Wazuh manager private IP (e.g., 172.x.x.x) <br>
<img width="633" height="346" alt="Screenshot 2026-01-20 192026" src="https://github.com/user-attachments/assets/2a6f48e8-f50f-4c87-8580-0761023b180e" />

## Step 5: Test Connection – Confirmation
Test the connection status from the Agent machine to test the manager machine:
```
nc -zv {Wazuh-Manager-Private-IP} {Communication-Port}
```
Example: 
```
ubuntu@ip-172-31-29-75:~$ nc -zv 172.31.86.103 1514                                                                                                                                                           
Connection to 172.31.86.103 1514 port [tcp/*] succeeded!
```

# Part 2: Logs
**ServerSide:**
```
sudo tail -f /var/ossec/logs/ossec.log
```

END






