<img width="998" height="308" alt="Screenshot 2026-02-03 211652" src="https://github.com/user-attachments/assets/fcd19edb-4799-48d4-b7d7-e51c5cb6b56a" /><img width="731" height="432" alt="Screenshot 2026-02-03 211450" src="https://github.com/user-attachments/assets/688d3f38-bc91-4fc9-a1dd-6b072f782d06" /># Goals:
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

## 1.2. DB CLI tips
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


**NOTE:**
- The id, filename, file_content, s3_url... are columns. 
- Field, Type, Null, Key, etc., are headers for the columns. So if you want to modify columns, choose id, filename, etc. 

To remove a column:
```
ALTER TABLE {table-name} DROP COLUMN {column-name};
```
To add a new column after an existing column:
```
ALTER TABLE {table-name}
ADD COLUMN {column-name} VARCHAR(20) AFTER{previous-column-name};
```
To show the contents of each column:
```
SELECT * FROM {table-name};
```
To show a specific column:
```
SELECT filename,file_content FROM {table-name};
```
To delete a specific row from a column:
```
DELETE FROM {table-name} WHERE id = {row-number};
```
<br> <img width="624" height="358" alt="Screenshot 2026-02-14 112948" src="https://github.com/user-attachments/assets/e5e064ec-3dc0-49fa-93ea-c036011d89e0" />

You may be confused about the DB Subnet Group in the RDS console.
<br> <img width="1881" height="539" alt="Screenshot 2026-01-29 234004" src="https://github.com/user-attachments/assets/a25e01df-ee37-4001-ba2d-6e81b3c7dc51" />

Is it different from other subnets? Is it really a private subnet? How is it private? What if it’s not?
> You can check in VPC/Subnet, you will see this.
<br> <img width="1895" height="661" alt="Screenshot 2026-01-29 233929" src="https://github.com/user-attachments/assets/acfe2897-f174-4cdd-a1b8-1249aee74dfb" />

Meaning, no. It’s the same thing. Just different names from different directories. The DB subnet group still falls under the Subnet from the VPC console. The databases should not talk directly to S3 buckets. We use BLOB (Binary Large Object). <br>
**Note: this is only for testing and will be deleted when we get into the communication.**

<br><img width="795" height="684" alt="Screenshot 2026-02-02 211857" src="https://github.com/user-attachments/assets/f2c3f976-031a-45ec-ad63-ac52ba908727" />


## 1.3. Private Instance Communication with S3 & DB
We need the Web Server / private instance to talk to the Database and S3. S3 and the database should not talk to each other. 
- S3 is for storage.  
- The database is for metadata. 

**Why not S3 talk directly to the database?**
- The database will be slow cuz it will handle user uploads and call the API with the S3 bucket. It’s like 2 works at once.
- SOC will have a hard time knowing what happens. It’s better to know WHO uploads from the Web server, rather than the Database uploads something into the S3.
- If the Database is compromised, the S3 will likely to be compromised as well. 
- A better question, where do the AWS credentials live? Database? Nah. It will be stolen and both the database and S3 will be compromised. 

What about security? We will use an [IAM Role](https://www.youtube.com/watch?v=BSodkwWB-8s) feature and set it up for both the database and S3. The web server will act as a middleman. 

# 2. Creating S3 
For creating S3, it’s easy. Just watch YouTube. Configure S3 bucket: [Link](https://www.youtube.com/watch?v=tfSzEU9xfIQ)

# 3. IAM Roles
IAM Role Console: [Link](https://us-east-1.console.aws.amazon.com/iam#/home)

<br> <img width="1409" height="762" alt="Screenshot 2026-02-03 210251" src="https://github.com/user-attachments/assets/11de8aa0-f9ff-4e27-a27c-66577d3b2bee" />
<img width="1893" height="509" alt="Screenshot 2026-02-03 210344" src="https://github.com/user-attachments/assets/b6c59092-034b-48ea-b3ed-24213b4d9141" />
<img width="1476" height="571" alt="Screenshot 2026-02-03 210448" src="https://github.com/user-attachments/assets/9ac96a47-363b-45b1-8a38-841175299957" />

**Review and click Create Role.**
**🛠️ Next Step: Attach the Role to your EC2 Instance**
- Go to the EC2 Console and click on Instances (running).
- Select your Private Web Instance (the one that will host your website).
- Click Actions (top right) > Security > Modify IAM role.
- In the dropdown, select the role you just created: Private-Web-Server-S3-Role.
- Click Update IAM role.

<br> <img width="1867" height="424" alt="Screenshot 2026-02-03 210613" src="https://github.com/user-attachments/assets/600effbe-a688-4556-98f7-c7b78b3c7576" />
<img width="1905" height="495" alt="Screenshot 2026-02-03 210625" src="https://github.com/user-attachments/assets/1cab473f-572a-477c-9d99-6f42d16999c3" />

- Then click Update IAM Role.
- Go back to Private Server CLI via Public Instance machine.
- Type: ```aws --version```
- We need to use AWS CLI for this because we are using an AWS service (IAM role) to help.
- If not yet installed:
```
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
sudo apt install unzip -y
unzip awscliv2.zip
sudo ./aws/install
```
**Result:**
<br><img width="731" height="432" alt="Screenshot 2026-02-03 211450" src="https://github.com/user-attachments/assets/481e635d-8126-48fe-adc9-d3ea6bbc993a" />

- Check S3 bucket: ```aws s3 ls```
<br> <img width="508" height="104" alt="Screenshot 2026-02-03 211635" src="https://github.com/user-attachments/assets/39f03983-4ca6-44e8-8196-81628dc5ab57" />

- Confirmation from S3 bucket console:
<br><img width="998" height="308" alt="Screenshot 2026-02-03 211652" src="https://github.com/user-attachments/assets/52533261-b1f9-4131-a6d1-c9ab8823baeb" />

## 3.2. What is this IAM Role exactly?
Think of your Private Instance as a person and the IAM Role as a Security Badge.
- **Before the Role:** Your instance was just a "guest." When it tried to talk to S3, S3 asked, "Who are you?" Since the instance had no credentials, S3 slammed the door.
- **With the Role:** You didn't give the instance a username or password. Instead, you told AWS: "This specific EC2 instance is allowed to wear the 'Private-Web-Server-S3-Role' badge."
- **How it works (The Magic):** When you run aws s3 ls, the CLI looks at a hidden local "Metadata Service" ($169.254.169.254$). It pulls a temporary security token. S3 sees this token, recognizes it belongs to your role, and lets you in.

Why is this better? If a hacker steals your code, there are no S3 passwords in it for them to find. The "key" only exists inside the server itself.

## 3.3. S3 Interaction
Now that the "handshake" is working, you can do almost anything from the command line. Here are the most common "Company Network" commands to try:
### A. Upload a test file:
Create a dummy file and push it to the bucket.
```
echo "This is a secret company file" > test.txt
aws s3 cp test.txt s3://YOUR-BUCKET-NAME/
```

### B. List files in the bucket:
```
aws s3 ls s3://YOUR-BUCKET-NAME/
```

### C. Download the file back:
```
aws s3 cp s3://YOUR-BUCKET-NAME/test.txt downloaded_test.txt
```

### D. Delete the file:
```
aws s3 rm s3://YOUR-BUCKET-NAME/test.txt
```

### How does this fit the Website Project
In a few minutes, when we write your HTML/CSS website, the code will look like this:
- User uploads a file to your Web UI.
- Web UI (using the IAM Role) sends that file to S3.
- Web UI then sends a message to MySQL saying: "Hey, John just uploaded 'test.txt'. You can find it at this S3 Link."

# 4.🏛️ The Architecture Summary
You now have a "Trusted Environment":
- MySQL trusts the instance because of the Security Group.
- S3 trusts the instance because of the IAM Role.
- The Internet can't see anything because the instance is Private.
Check if S3 is actually private
- Go to your bucket
<br><img width="998" height="308" alt="Screenshot 2026-02-03 211652" src="https://github.com/user-attachments/assets/5c7a8db8-0b6d-4bf3-bef9-52436005bb44" />

- Click testRole.txt
<img width="1456" height="135" alt="Screenshot 2026-02-04 102721" src="https://github.com/user-attachments/assets/230996f1-224b-4a14-8789-0bb960682b11" />

- Click the URL in the lower right corner
<br><img width="1520" height="675" alt="Screenshot 2026-02-04 102819" src="https://github.com/user-attachments/assets/e4094956-636f-43b3-b9a6-d3ac1d32a005" />

- Result in “Access Denied”. This means only the private instance is allowed to communicate. Currently, I am using a different IP and no role.
<br> <img width="1083" height="233" alt="Screenshot 2026-02-04 102830" src="https://github.com/user-attachments/assets/23838dbd-0141-4bdd-a135-78ee1502b0e2" />

Example:
<br> <img width="1889" height="592" alt="Screenshot 2026-02-03 212612" src="https://github.com/user-attachments/assets/2cf9fe78-91ff-4521-a726-ac0604f374e1" />

# 5. Questions
**Have you ever wondered why there are 2 security groups?**
This is from the security group console.
<br> <img width="1374" height="94" alt="Screenshot 2026-02-04 105003" src="https://github.com/user-attachments/assets/dfe4ce43-700c-4eaa-a763-02e91e56dc2b" />

What you're seeing is the aftermath of the ```AWS "Connect to EC2" Wizard```. When you use that wizard to link a database and a server, AWS doesn't just create one security group; it creates a pair to act as a "handshake."
To answer your question: Yes, there is a big difference in their purpose, even if their names look similar.

🔍 The "rds-ec2" vs. "ec2-rds" Breakdown
The naming convention tells you which way the "arrow" of permission is pointing:

| SG Name Prefix | Where it is attached     | What it does                                                                                           |
|----------------|--------------------------|--------------------------------------------------------------------------------------------------------|
| rds-ec2        | Attached to your RDS Database | **The Lock**<br>It opens port 3306.<br>It says: "I allow traffic from anyone wearing the ec2-rds badge."<br>It has **inbound rules** (allows traffic coming in from outside). |
| ec2-rds        | Attached to your EC2 Instance | **The Badge**<br>It has no inbound rules.<br>It has an **outbound rule** (allows the instance to initiate connections outward).<br>It exists so the RDS can "see" this EC2 as an authorized friend. |

This is from the Private Instance that wears the ec2-rds badge.
<br><img width="1140" height="387" alt="Screenshot 2026-02-04 105342" src="https://github.com/user-attachments/assets/cbdf8bd0-b12c-4732-a575-8a7cc1e7eff2" />

This is from the Company-DB that wears the rds-ec2 badge.
<br><img width="1137" height="608" alt="Screenshot 2026-02-04 105307" src="https://github.com/user-attachments/assets/46d28093-7ada-4052-953c-d0c6a7ce783a" />

# END
