# Goals:
- Use DB for metadata and fast searching
- Use S3 mainly for uploaded files or attachments and for data backups.

# 1. Creating DB,
I chose MySQL. 
- Master Username: admin
- Password: CompanyNetwork123

<br><img width="1850" height="782" alt="Screenshot 2026-01-28 214522" src="https://github.com/user-attachments/assets/b2f0f6a5-aef2-471f-bf5a-ef6895e9a99a" />
<br><img width="1911" height="776" alt="Screenshot 2026-01-28 214555" src="https://github.com/user-attachments/assets/c60b05d0-2a14-4ca6-b61f-609ed3e2d647" />
<br><img width="963" height="510" alt="Screenshot 2026-01-28 214633" src="https://github.com/user-attachments/assets/4ec39c87-ad9a-4ceb-b971-4d50078cdc98" />

Initial database name: Give it a name like ```company_site```. If you leave this blank, the database starts empty with no "folder" to put tables in

**Private instance/machine:**
```
sudo apt update
sudo apt install mysql-client -y
```
**Creating subnet group:**
You need to create this new subnet group so that you have another private subnet to store your database and S3 bucket for storage.
<br> <img width="1404" height="623" alt="Screenshot 2026-01-29 221628" src="https://github.com/user-attachments/assets/a1fa6e22-5434-4835-979f-6640a36edd0a" />
<br> <img width="1617" height="763" alt="Screenshot 2026-01-29 221737" src="https://github.com/user-attachments/assets/afbd06b4-cf5b-47cf-8c87-b266cabc75c2" />

Back to creating a database,
<br> <img width="1301" height="294" alt="Screenshot 2026-01-29 223522" src="https://github.com/user-attachments/assets/cc9acc24-3ccf-47e4-8173-0a730ccf310d" />


## 1.1. Database - How to connect to your RDS
Since your mysql-client is already installed, you are ready to go. You just need to tell the client where your RDS "TV" is.
**Get your Endpoint:** 
Go to the AWS RDS Console, click on your database, and look for the Endpoint. It will look something like: ```company-db.xyz.abc.us-east-1.rds.amazonaws.com```

<br> <img width="1863" height="764" alt="Screenshot 2026-01-29 225509" src="https://github.com/user-attachments/assets/f6c53d46-42f5-4005-a6f5-077d72f06a01" />

**Run this command from your Private Instance:**
```
mysql -h [YOUR_RDS_ENDPOINT] -P 3306 -u admin -p
(Replace [YOUR_RDS_ENDPOINT] with your actual link and admin with the username you chose).
```
Enter your Password: When prompted, type the password you set during the RDS creation. (Note: The cursor won't move while you type—this is a security feature).

**🧱 If it hangs (The Connection Test)**
If the command just sits there and never asks for a password, your Security Group is blocking the door.
**Quick Check**: Run this command on your Private Instance to see if the "pipe" is even open:
```
telnet [YOUR_RDS_ENDPOINT] 3306
```
- If it says "Connected": The firewall is fine. You just had a typo in your password or username.
- If it says "Connection timed out": You need to go to the RDS Security Group and add an Inbound Rule for Port 3306 from the IP or Security Group of your Private Instance.

This is on a public instance (reverse proxy):
<br> <img width="966" height="76" alt="Screenshot 2026-01-29 224929" src="https://github.com/user-attachments/assets/9c137409-d941-4f7f-a734-91138f020585" />

It is stuck here cuz the database is only set to connect to the private instance.

This is on a private instance.
<br> <img width="973" height="368" alt="Screenshot 2026-01-29 225107" src="https://github.com/user-attachments/assets/cf6506fd-0cf7-41b5-8686-ca1f62321e22" />

If you want to know where you are while you are inside the database, use this command:
```
SELECT DATABASE();
```
To get out of MySQL:
```
EXIT;
```

# 1.2. DB CLI tips
The moment you see mysql>, type this command to see all folders:
```
SHOW DATABASES;
```
Then, select the first one as it is created when you create the database in the console.
```
USE {Database-Initial-Name};
```
Then, start to create columns:
```
CREATE TABLE uploads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    s3_url VARCHAR(512) NOT NULL,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

To add an extra column, type:
```
ALTER TABLE uploads 
ADD COLUMN file_attachment VARCHAR(512) AFTER filename;
```
Then,
```
SHOW TABLES; 
```
Run this:
```
DESCRIBE uploads;
```
You’ll get this:
<br><img width="762" height="312" alt="Screenshot 2026-01-29 232450" src="https://github.com/user-attachments/assets/b1ace67d-78db-494e-b6f0-dcf80fb796ca" />


















