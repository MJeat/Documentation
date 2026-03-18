# How to add SSH Keypairs
### Scenario:
Imagine you forgot to create an SSH keypair for your instance, or you want to add someone to connect to your instance via SSH public/private keys. 

## To do (assuming your instance is currently running):
On your Local Machine (Win11 Home):
1. Type this command to generate a public key pair
(ed25519 Algorithm)
```
ssh-keygen -t ed25519 -C "your_email@example.com"
```
(Replace "your_email@example.com" with your actual email address, which serves as a comment for the key.

(RSA Algorithm)
```
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
```

2. When prompted for location, just copy the default location they give you, or you could just find your own location, but make sure to add the .pub file at the end.
3. Passphrase is optional and is an additional protection
4. Then, In CMD > ```type C:\Users\User\.ssh\{FILE-NAME}.pub```
- Example: `type C:\Users\User\.ssh\id_ed25519.pub`

Where are they hiding? On your computer, the keys are located in a hidden folder:

- Path: ```C:\Users\User\.ssh```
- Private Key: `id_ed25519` (This is your "password," keep it secret!)
- Public Key: `id_ed25519.pub` (This is what you give to your Instance. Just copy the entire line in the .pub file and paste into your instance .ssh/authorized_keys)

5. If you were in AWS: <br>

5.1. If you create a new keypair and haven't attached it to the instance yet:
- Get and find the .pem you created
- In the AWS Console, go to Instances.
- Select your instance and click the Connect button at the top.
- Choose the EC2 Instance Connect tab.
- Ensure the username is `ubuntu` and click Connect.
- If a black terminal opens: You are in! Now we just need to manually add your key.

5.2. On your local Windows machine: 
- Run this to see your Public Key
```
ssh-keygen -y -f "YOUR-KEY.pem"
```
- Copy that long string it spits out (starts with ssh-rsa or ssh-ed25519).

5.3. In your Instance Terminal: 
- Type:
```
nano ~/.ssh/authorized_keys
```
- Paste your key on a new line, press Ctrl+O (Enter) to save, and Ctrl+X to exit.
- Try your CMD/PowerShell SSH command again.



