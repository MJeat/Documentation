# How to customize a boring Windows powershell terminal into something more appealing
When you first open the PS terminal, you can see the boring pitch black background, so let's change that:

1. Download JetBrains Font (https://www.jetbrains.com/lp/mono/) or any font you desire
2. Open your windows PS terminal
3. At the top, click the drop-down button -> Settings -> JSON setting on the bottom left
4. Copy paste the code from SleepyCatHey (https://github.com/SleepyCatHey?tab=overview&from=2025-10-01&to=2025-10-29). 
The code file is in another file called fontCodes

5. Change the "face" and replace its value your favorite font name -> Ctrl + S
6. Open the new PS terminal and you will see the difference
7. On the terminal, you need to find the PS profile by typing:

```
$PROFILE
```
### Follow the path and find in Windows Explorer. 
====================================================================

If you don't see anything inside, type this code in the PS terminal: 
```
New-Item -Path $profile.CurrentUserAllHosts -Type File -Force
```

====================================================================

8. Go to https://github.com/fastfetch-cli/fastfetch
Scroll down until you find Windows/winget

9. Go to terminal and paste:
```
winget install fastfetch
```
11. Go to your file explorer -> Users -> {Your hostname} -> Create a folder called .config -> make it a hidden file -> enter the folder and create another folder called fastfetch
12. Go back to the link and download both files
```
https://github.com/SleepyCatHey/Ultimate-Win11-Setup/tree/main/Fastfetch
```
- Paste both files into the fastfetch folder. 
- Go to the config.jsonc and replace %USERPROFILE% with your hostname

14. Go to `C:\Users\{Your hostname}\Documents\WindowsPowerShell\profile.ps1`
16. Go to this link and copy the code and paste it in profile.ps1 and don't forget to replace %USERPROFILE% with your hostname. 
Code: ```https://github.com/SleepyCatHey/Ultimate-Win11-Setup/blob/main/PowerShell/Microsoft.PowerShell_profile.ps1```

18. 

Credit: 
```
https://www.youtube.com/watch?v=z3NpVq-y6jU
```
