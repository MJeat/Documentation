# How to customize a boring Windows powershell terminal into something more appealing

### 🔗 Table of Contents
1. [Guidance](#1-Guidance)
2. [Issues](#2-Issues)
-  [Execution of scripts is disabled on this system](#1-Execution-of-scripts-is-disabled-on-this-system)
-  [Working with OneDrive](#2-Working-with-OneDrive)
-  [$profile outputs nothing](#3-profile-outputs-nothing)_
3. [Credit](#3-Credit)

====================================================================
# 1. Guidance:

When you first open the PS terminal, you can see the boring pitch black background

Before:\
<img width="727" height="339" alt="Image" src="https://github.com/user-attachments/assets/7707aedc-5ae7-4ccd-94e4-97a99a3fd9d9" />
<br>After:<br>
<img width="739" height="332" alt="Image" src="https://github.com/user-attachments/assets/2f710356-e440-4d7c-8148-5db96a054875" />

So let's change that:
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
14. Go to this link and copy the code and paste it in profile.ps1 and don't forget to replace %USERPROFILE% with your computer username.<br>
Code: https://github.com/SleepyCatHey/Ultimate-Win11-Setup/blob/main/PowerShell/Microsoft.PowerShell_profile.ps1


# 2. Issues
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

## 3. $profile outputs nothing
When you run `$profile` and it outputs nothing in Windows PS. This can happens if the CurrentUserAllHosts and CurrentUserCurrentHost are null or empty.<br>
Usually, when you run
```
$PROFILE | Select-Object *
```
It outputs
```
AllUsersAllHosts       : C:\Program Files\PowerShell\7\profile.ps1
AllUsersCurrentHost    : C:\Program Files\PowerShell\7\Microsoft.PowerShell_profile.ps1
CurrentUserAllHosts    : C:\Users\username\Documents\PowerShell\profile.ps1
CurrentUserCurrentHost : C:\Users\username\Documents\PowerShell\Microsoft.PowerShell_profile.ps1
Length                 : 69
```

But in this issue, the CurrentUserAllHosts and CurrentUserCurrentHost are null or empty
Outputs
```
AllUsersAllHosts       : C:\Program Files\PowerShell\7\profile.ps1
AllUsersCurrentHost    : C:\Program Files\PowerShell\7\Microsoft.PowerShell_profile.ps1
CurrentUserAllHosts    : 
CurrentUserCurrentHost : 
Length                 : 0
```

### Diagnosis - $profile outputs nothing
1. Check what PowerShell thinks your Documents folder is
```
[Environment]::GetFolderPath("MyDocuments")
```
If outputs: `C:\Users\username\Documents`, great!
If outputs: Nothing or contains OneDrive, the PowerShell is pointing to nothing or OneDrive directory

2. Check if WindowsPowerShell folder exists
```
Test-Path "$HOME\Documents\WindowsPowerShell"
```
If true, great!
If not, create:
```
New-Item -ItemType Directory -Force -Path "$HOME\Documents\WindowsPowerShell"
```

3. Check if profile files exist
```
Test-Path "$HOME\Documents\WindowsPowerShell\profile.ps1"
Test-Path "$HOME\Documents\WindowsPowerShell\Microsoft.PowerShell_profile.ps1"
```
If both returns True, great!
If False, create:
```
New-Item -Type File -Force -Path "$HOME\Documents\WindowsPowerShell\profile.ps1"
New-Item -Type File -Force -Path "$HOME\Documents\WindowsPowerShell\Microsoft.PowerShell_profile.ps1"
```

4. Check $HOME variable

```
$HOME
```
It must return
```
C:\Users\username
```
If $HOME is wrong, PowerShell cannot build $PROFILE

5. Last but most effective option - Fix via the Registry

- Win key + R
- Type regedit
- In the search bar at the top, type
```
HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Explorer\User Shell Folders
```
- Find the value *Personal*
- If it’s empty, missing, or pointing to OneDrive incorrectly,




- Edit it to:
``C:\Users\username\Documents``



====================================================================
# 3. Credit: 
```
https://www.youtube.com/watch?v=z3NpVq-y6jU
```
