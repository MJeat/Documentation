
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
This is the result:
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


