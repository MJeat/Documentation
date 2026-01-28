
# Test #1: Hydra SSH Bruteforce
## ServerSide
Adjustment:
We cannot SSH to a server if the server disables root and password login. Go to:
```
sudo nano /etc/ssh/sshd_config
```
<br>
<img width="355" height="87" alt="Screenshot 2026-01-20 200433" src="https://github.com/user-attachments/assets/c4f6a018-17d8-4fae-adfd-5c24bc1627d3" /> 

<img width="621" height="110" alt="Screenshot 2026-01-20 200038" src="https://github.com/user-attachments/assets/1749644b-5fcc-411c-aa3d-419d60262cd8" />

_**Next**_:
**Enable Root Login**:
Find the line ``` #PermitRootLogin prohibit-password ```. Change it to: ```PermitRootLogin yes``` (Make sure to remove the #).
**Enable Passwords**: 
Find the line ``` #PasswordAuthentication yes```. Change it to: ```PasswordAuthentication yes``` (Remove the #).
Save it. Then: 
```
sudo systemctl restart ssh
```
Delete this file:
```
sudo rm /etc/ssh/sshd_config.d/60-cloudimg-settings.conf                                                                                   
sudo systemctl restart ssh  
```
_**Note: Once you do this, you won’t need to authenticate via the .pem file again. You can always change it back to the original**_

**Update password:**
- User: root
- Password: ubuntu

<img width="669" height="129" alt="Screenshot 2026-01-20 201833" src="https://github.com/user-attachments/assets/2202f0cd-5ea7-46de-80e6-4f6dafcff578" />

## 2. AttackerSide
Tool Installation:
```
sudo apt-get update
sudo apt-get install hydra -y
```

Initiate Attack:
```
hydra -l root -P /usr/share/wordlists/rockyou/rockyou.txt ssh://172.31.29.75 -t 4
```
<img width="1064" height="418" alt="Screenshot 2026-01-20 233747" src="https://github.com/user-attachments/assets/18c2a9f8-699e-40da-bd83-2b825062cc70" />

## 3. Defenderside
Before:

<img width="1920" height="1080" alt="Screenshot (496)" src="https://github.com/user-attachments/assets/8e120705-8e30-4ee1-a856-12adb9a34543" />

After:

<img width="1772" height="842" alt="Screenshot 2026-01-20 213747" src="https://github.com/user-attachments/assets/7ac63367-f589-4d04-be65-3ba745bedbb2" />

Detecting SSH successful login:

<img width="1903" height="866" alt="Screenshot 2026-01-20 234339" src="https://github.com/user-attachments/assets/025e4ff2-f58e-4f57-aa9e-0eb4fc986e0b" />


_**This Project is concluded.**_

