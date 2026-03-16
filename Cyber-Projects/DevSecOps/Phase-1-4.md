# Creating SSH Key in DigitalOcean

In Tabby (Windows 11):
- Create an SSH key (public & private) via CMD or PowerShell:
`ssh-keygen`
It will ask for the location, just copy-paste the option that it gives you.<br>
Then, if asked for a passphrase, just type Enter. Then, you will see the files and their location.<br>

### Get into the file location
To get the file location, 
1. File Explorer > Search Bar > `%USERPROFILE%\.ssh`
2. In CMD > `type C:\Users\User\.ssh\{FILE-NAME}.pub` <br>
Example: `type C:\Users\User\.ssh\id_ed25519.pub`


