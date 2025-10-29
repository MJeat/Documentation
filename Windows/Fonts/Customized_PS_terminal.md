# How to customize a boring Windows powershell terminal into something more appealing
====================================================================

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
Follow the path and find in Windows Explorer.
Note:
You must not work in OneDrive folder. Check your file explorer. You need to work with the local desktop directory. If you see something like 
```
C:\Users\alice\OneDrive\Documents\...
```
Then, you should jump to the Issues section number 2.

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
- Go to the config.jsonc and replace %USERPROFILE% with your computer username

13. Go to `C:\Users\{Your hostname}\Documents\WindowsPowerShell\` in File Explorer
14. Go to this link and copy the code and paste it in profile.ps1 and don't forget to replace %USERPROFILE% with your computer username. 
Code:
```
https://github.com/SleepyCatHey/Ultimate-Win11-Setup/blob/main/PowerShell/Microsoft.PowerShell_profile.ps1
```

# Issues
## 1. "Execution of scripts is disabled on this system"
If you see "execution of scripts is disabled on this system", don’t panic! Just open PowerShell as Administrator and run:
```
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
```
Then, rerun the regular Windows PS.

## 2. Working with OneDrive
Working with OneDrive is not ideal, so we need to change that. Our goal is to work with the local desktop. Here are the steps:
1. Find OneDrive folder in File Explorer -> This PC -> Users -> User (or your computer username) -> OneDrive
2. Create a new folder outside of OneDrive
```
New-Item -ItemType Directory -Force -Path "$HOME\Documents\WindowsPowerShell"
```
3. Move your current profile from OneDrive (if it exists)
```
# Check if the OneDrive profile exists
$OneDriveProfile = "$HOME\OneDrive\Documents\WindowsPowerShell\Microsoft.PowerShell_profile.ps1"

if (Test-Path $OneDriveProfile) {
    Move-Item -Path $OneDriveProfile -Destination "$HOME\Documents\WindowsPowerShell\Microsoft.PowerShell_profile.ps1" -Force
}
```
4. Ensures the new profile exists
```
New-Item -ItemType File -Force -Path "$HOME\Documents\WindowsPowerShell\Microsoft.PowerShell_profile.ps1"
```
5. Verify $profile
```
$PROFILE
$PROFILE.CurrentUserAllHosts
```

### Another option
1. Check the automatic object
```
$PROFILE | Get-Member
```

- If it says TypeName: System.String, then yes, it was overwritten.
- If it’s the automatic object, it should have properties like .CurrentUserAllHosts.

2. Restore the automatic $PROFILE object
The easiest way is to close and reopen PowerShell. That will restore $PROFILE to its built-in object.

3. Move your existing profile (if it exists)
```
$OldProfile = "$HOME\OneDrive\Documents\WindowsPowerShell\Microsoft.PowerShell_profile.ps1"
$NewProfile = "C:\Users\kiric\Documents\WindowsPowerShell\Microsoft.PowerShell_profile.ps1"

if (Test-Path $OldProfile) {
    Move-Item -Path $OldProfile -Destination $NewProfile -Force
}
```

4. Edit the current PowerShell session to use the new profile path (without overwriting the automatic object)
```
$MyProfile = $NewProfile
```

5. From now on, you can add scripts to $MyProfile, and PowerShell will load it if you manually dot-source it
```
. $MyProfile
```

💡 Optional: If you want PowerShell to automatically use this profile on startup instead of the OneDrive one, you’ll need to change your Documents folder location in Windows or redirect $PROFILE in your PowerShell shortcut using:
```
powershell.exe -NoProfile -Command ". 'C:\Users\kiric\Documents\WindowsPowerShell\Microsoft.PowerShell_profile.ps1'"
```

====================================================================
Credit: 
```
https://www.youtube.com/watch?v=z3NpVq-y6jU
```
