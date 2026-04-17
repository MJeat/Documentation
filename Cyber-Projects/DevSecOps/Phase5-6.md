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

- In R2 dashboard → Manage R2 API tokens → Create API token
- Set permissions to "Object Read & Write" scoped to your bucket
- Save the Access Key ID and Secret Access Key — you only see the secret once
- Note your R2 endpoint URL — format is `https://ACCOUNT_ID.r2.cloudflarestorage.com`

## Step 3 — Install Rclone on your VPS
```
curl https://rclone.org/install.sh | sudo bash
```
## Step 4 — Configure Rclone for R2
```
rclone config
```
- Choose `n` for new remote
- Name it: r2
- Storage type: s3 (R2 is S3-compatible)
- Provider: Cloudflarw
- Enter your Access Key ID and Secret Access Key
- Endpoint: your R2 endpoint URL
- Leave region blank

This creates a config at ~/.config/rclone/rclone.conf

## Step 5 — Test the connection
```
rclone ls r2:vps-backups
rclone copy /etc r2:vps-backups/test/ --progress
```
- `rclone ls` - lists the bucket contents
- `rclone` - copies uploads a directory
- `--progress` - shows you transfer speed and file counts in real time

# Phase 6: 







