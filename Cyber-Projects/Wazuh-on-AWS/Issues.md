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




