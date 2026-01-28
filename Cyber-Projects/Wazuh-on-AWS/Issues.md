# Issue #1: Incompatible Versions
## Issue #1: Both the agent and the Wazuh manager are in different versions
From ServerSide: <br>
<img width="1311" height="659" alt="Screenshot 2026-01-20 162555" src="https://github.com/user-attachments/assets/d57b715c-eaff-4f85-8494-4b0b541e83c6" />

From DefenderSide: <br>
<img width="1148" height="529" alt="Screenshot 2026-01-20 162650" src="https://github.com/user-attachments/assets/6af4490f-c950-4b3d-99c2-4c0ff9863d3e" />

## Solution #1
From ServerSide (downgrade the agent to match Wazuh manager):
```
sudo systemctl stop wazuh-agent 
sudo apt remove --purge wazuh-agent -y 
sudo rm -rf /var/ossec
```
Followed by:
```
curl -sO https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_4.7.5-1_amd64.deb
sudo WAZUH_MANAGER='172.31.86.103' dpkg -i wazuh-agent_4.7.5-1_amd64.deb
```
_**Note: 172.31.86.103 is the DefenderSide machine private IP.**_

Finally, 
```
sudo systemctl daemon-reload
sudo systemctl enable wazuh-agent
sudo systemctl start wazuh-agent
```

Double-check your agent version on your ServerSide machine:
```
sudo /var/ossec/bin/wazuh-control info -v
```

# Issue #2: The ServerSide IP keeps automatically registering itself inside Wazuh Manager (DefenderSide) <br>
<img width="672" height="129" alt="Screenshot 2026-01-20 182504" src="https://github.com/user-attachments/assets/d3bbbcb4-e79b-4c24-9d0c-a7eca1d75f33" />

You can see the agent ID: 003 does not have a name because it is automatically registered itself. I mean it works and can conclude the project, but the agent itself has no identity or a name. Only IP. 

## Solution #2:
First, on the DefenderSide (Wazuh Manager):
```
sudo rm -rf /var/ossec/queue/rids/*
sudo rm -f /var/ossec/etc/client.keys
sudo /var/ossec/bin/wazuh-control stop authd
```
<br>
<img width="657" height="400" alt="Screenshot 2026-01-20 182417" src="https://github.com/user-attachments/assets/dbffd08d-9889-46b8-bf70-e0b3d1fe0850" />

The problem could be because of the automatic auth function. Turn all to “no”: 
```
sudo nano /var/ossec/etc/ossec.conf
```
<br>
<img width="706" height="397" alt="Screenshot 2026-01-20 184144" src="https://github.com/user-attachments/assets/ab22bad0-a751-48d8-a934-b996927f76d8" />

Then,
```
sudo /var/ossec/bin/manage_agents
```
Then, remove the duplicate IP. 
Export the import key of your preferred host IP:
```
sudo /var/ossec/bin/manage_agents
```
Second, on the ServerSide (Agent):
```
sudo systemctl stop wazuh-agent
```
Wipe the "Auto" key, it just grabbed:
```
sudo rm -f /var/ossec/etc/client.keys
sudo /var/ossec/bin/manage_agents -i {Agent-Key-From-Wazuh-Manager}
sudo systemctl start wazuh-agent
```

Lastly, on the DefenderSide (Wazuh Manager):
```
sudo systemctl restart wazuh-indexer
sudo systemctl restart wazuh-manager
sudo systemctl restart wazuh-dashboard
```









