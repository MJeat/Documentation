
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
Example:







