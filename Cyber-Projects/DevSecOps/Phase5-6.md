# Phase 5: Cloudflare R2 + Rclone Backup Automation

**What this project is about:**

Every server setup needs a backup strategy. If your VPS gets corrupted, accidentally wiped, or your DigitalOcean account has an issue, you want your data somewhere else entirely — on a completely separate platform.
This project uses Cloudflare R2 as your backup destination. R2 is Cloudflare's object storage (think Amazon S3 but with zero egress fees — you pay to store data but not to read it back). Rclone is a command-line tool that syncs files between your server and any cloud storage provider — S3, R2, Google Drive, Backblaze, and dozens more.

R2 is S3-compatible, meaning any tool that works with Amazon S3 also works with R2 — including Rclone.

## Step 1 — Create a Cloudflare R2 bucket

- In Cloudflare dashboard → R2 → Create bucket
- Name it something like `ubuntu-king-backup`
- Choose a region (auto is fine for personal use)
- R2 free tier: 10GB storage, 1 million Class A operations/month — likely enough for personal backups

## Step 2 — Generate R2 API credentials

- In R2 dashboard → Manage R2 API tokens → Create API token (See Image. It's at the bottom right.)

<img width="1002" height="435" alt="image" src="https://github.com/user-attachments/assets/bd2aeda9-7331-49f8-ad9f-2d14e3d784bb" />


- Set permissions to "Object Read & Write" scoped to your bucket
- For security purposes, choose `Specify bucket(s)` as `Apply to specific buckets only`. But for personal VPS or production, you can pick `Apply to all buckets in this account (including newly created buckets)`

However, for this project, I picked the secured option.

- Click `Create Account API Token`
- Save the Access Key ID and Secret Access Key — you only see the secret once. Or simply save all tokens in the password manager.
- Note your R2 endpoint URL — format is `https://ACCOUNT_ID.r2.cloudflarestorage.com`

## Step 3 — Install Rclone on your VPS
```
curl https://rclone.org/install.sh | sudo bash
```
## Step 4 — Configure Rclone for R2
```
rclone config
```
Follow these exact inputs:
- `n)` New remote
- name: `ubuntu-king-backup-r2`
- Storage Type: Type `s3` (or find the number for Amazon S3 Compliant Storage)
- provider: Choose `Cloudflare` (should be option 6 or similar)
- env_auth: `false`
- access_key_id: `(Paste your Access Key ID)`
- secret_access_key: `(Paste your Secret Access Key)`
- region: `auto` (or leave blank)
- endpoint: `(Paste that https://... link you copied)`
- location_constraint: `(Leave blank)`
- acl: `private`

This creates a config at `~/.config/rclone/rclone.conf`

Since we chose `Specify bucket(s)` as `Apply to specific buckets only`, we have to add an extra line in the `rclone.conf`
```
~/.config/rclone/rclone.conf
```

Write this like this:

```
[ubuntu-king-backup-r2]
no_check_bucket = true          # This is where you should add
type = s3
provider = Cloudflare
access_key_id = {KEY}
secret_access_key = {KEY}
region = auto
endpoint = {KEY}
```
We add this because we don't want Cloudflare to check for the account-level privilege. No politeness, just get straight to work. It's safe.

## Step 5 — Test the connection
```
rclone config show ubuntu-king-backup-r2
echo "Ghost Mode Backup Test" > test.txt
rclone copy test.txt ubuntu-king-backup-r2:ubuntu-king-backup
```
You shouldn't see any output or error here. Then, go back to the R2 dashboard and find your test.txt.

## Step 6 - Upload via scripts (Manual) 
Location: `~/`
- Create a bash script called `ubuntu-king-backup.sh` that takes logs from `auth.log`:
```
#!/bin/bash
rclone copy /var/log/auth.log ubuntu-king-backup-r2:ubuntu-king-backup
```
Then:
```
chmod 777 ubuntu-king-backup.sh
./ubuntu-king-backup.sh
```
Lastly, check your R2 dashboard.

<img width="1086" height="196" alt="image" src="https://github.com/user-attachments/assets/78fb0382-8193-4989-b60d-57bf4a431db6" />




# Phase 6: 







