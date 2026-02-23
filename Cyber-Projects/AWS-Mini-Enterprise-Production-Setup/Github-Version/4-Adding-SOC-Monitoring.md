The full-stack development is enough. However, if you want to integrate AWS security monitoring or your very own EC2 to monitor, there might be changes to all instances and services (e.g., reverse proxy, honeypot, private server, S3, and DB).

# About CloudWatch
Source: 
- [Link1](https://www.youtube.com/watch?v=HRJnhzSSFtk)
- [Link2](https://www.youtube.com/watch?v=PBO636_t9n0)

Alarm Set Up: 
- [Link](https://www.youtube.com/watch?v=lHWrAAzoxJA)

# About CloudTrial
Source: 
- [Link](https://www.youtube.com/watch?v=CXbdsp9ThvM)

# About VPC Flow Logs
The data is set to CloudWatch anyway.

[CloudWatch Vs. CloudTrial](https://www.youtube.com/watch?v=S5X0PnBwp9I)

**4 services/resources:**
- Reverse proxy/frontend
- backend/private instance
- Database
- S3

# To Do:

- [] From ChatGPT & Gemini, finish connecting all AWS services and resources to CloudTrail, CloudWatch, and VPC Flow Logs
- [] Test if CloudTrail & CloudWatch logging and monitoring work for each AWS service
- [] Create a centralized SOC platform using Elastic and configure its IAM role
- [] Connect all logs from CloudTrail and CloudWatch to the SOC platform

==================================================================

# 1. Connecting Resources with CloudWatch, CloudTrail, & Flow Logs
## 1.1. VPC Flow Logs

The entire log is in CloudWatch. 

<img width="1878" height="807" alt="Screenshot 2026-02-18 104005" src="https://github.com/user-attachments/assets/dcf4c97b-35b2-4424-902a-98cfa080f3d3" />

Since the Proxy, Backend, and Database all live inside the VPC subnets, one "Switch" covers them all at the network layer.
- VPC Console > Your VPCs > Select your VPC.
- Click the Flow Logs tab > Create flow log.
- Filter: ALL.
- Destination: Send to CloudWatch Logs.
- Log Group: Create /aws/vpc/main-flowlogs.
- IAM Role: 
  - Click "Set up permissions." Create a role named VPCFlowLogRole.
  - Ensure the trust policy allows vpc-flow-logs.amazonaws.com to assume the role.

Confirmation:

<img width="1003" height="290" alt="Screenshot 2026-02-18 104730" src="https://github.com/user-attachments/assets/e84ff4af-de58-412b-bff5-dbd70eed3c36" />

Click the destination name link > Click the Logs Stream > If you see ACCEPT, all good.

<img width="1691" height="749" alt="Screenshot 2026-02-18 104815" src="https://github.com/user-attachments/assets/c4324924-0892-4b31-8516-c40522d278be" />

## 1.2. CloudWatch
### Database:
To monitor a database in a SOC, CloudTrail is not enough. CloudTrail only sees "Management" actions (like "Who deleted the database?"). To see the actual SQL queries or failed login attempts, you must use CloudWatch Logs.

Here is how you connect your MySQL Database to CloudWatch Logs:

🛠️ Step 1: Enable Log Exports in RDS
1. Go to the RDS Console > Databases.
2. Select your MySQL instance and click Modify.
3. Scroll down to the Log exports section.
4. Check all four boxes: Audit log, Error log, General log, and Slow query log.
5. Click Continue at the bottom, select Apply immediately, and click Modify DB Instance.

🛠️ Step 2: Configure the Database Parameters
For MySQL to actually generate those logs so they can be sent to CloudWatch, you must tell the database to turn on its "recording" feature.
1. In the RDS Console sidebar, click Parameter groups.
2. Select the Parameter Group your DB is using (if you are using the default group, you must create a "New Parameter Group" first, then associate it with your DB and modify it). Note: You have to create a new custom parameter group, not using the default ones.
3. Search for and change these parameters:
- general_log: Set to 1 (This turns on the general query log).
- log_output: Set to FILE (This is required for CloudWatch exports).
- slow_query_log: Set to 1 (Captures slow queries for performance/security monitoring).
  - Log_error_verbosity: Set its value to 3 (captures logs verbosely)

Click Saves

<img width="1341" height="727" alt="Screenshot 2026-02-18 114301" src="https://github.com/user-attachments/assets/9dee1f60-263f-4791-9c62-cfc9e87dec40" />

🛠️ Step 3: Attach the Group to your Database
1. Go to RDS Console > Databases > Select your DB.
2. Click Modify.
3. Scroll down to Additional configuration > Database options.
4. Change DB parameter group from default.mysql... to your new soc-mysql-parameters.
5. Scroll to the bottom, click Continue, select Apply immediately, and click Modify DB Instance.

<img width="924" height="726" alt="Screenshot 2026-02-18 115528" src="https://github.com/user-attachments/assets/93afe744-b561-40fb-9a7a-4cb440bac48e" />

**Confirmation:**

🧪 How to test if the Database Connection works:
- Wait 5 minutes for the RDS change to complete.
- Generate activity: Go to your website and perform a search or upload. This sends SQL commands to the DB.
- Check CloudWatch: * Go to CloudWatch Console > Log groups.
  - Look for new groups named:
    - /aws/rds/instance/[your-db-name]/error
    - /aws/rds/instance/[your-db-name]/general
- Verification: Click into the general log. If you see your SQL queries (e.g., SELECT * FROM uploads...) appearing in the log stream, the database connection is complete.

<img width="1145" height="686" alt="Screenshot 2026-02-18 115229" src="https://github.com/user-attachments/assets/f201cd6f-8e46-4049-bdec-cb82716117ec" />

### IAM Role for EC2
If you already have a private instance with an IAM role to talk with S3 (which you should already have), just attach this policy: CloudWatchAgentServerPolicy
Then, create a new IAM role for the frontend and only attach the same policy as well. 

### Install Agent for both EC2
```
sudo apt update
wget https://amazoncloudwatch-agent.s3.amazonaws.com/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i -E ./amazon-cloudwatch-agent.deb
```

### Backend / Private Instance– EC2
```
sudo nano /opt/aws/amazoncloudwatch-agent/bin/config.json
```

Then, copy and paste this code: 

```
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/auth.log",
            "log_group_name": "backend-auth",
            "log_stream_name": "{instance_id}",
            "timezone": "UTC"
          },
          {
            "file_path": "/var/log/syslog",
            "log_group_name": "backend-syslog",
            "log_stream_name": "{instance_id}",
            "timezone": "UTC"
          },
          {
            "file_path": "/var/log/app.log",
            "log_group_name": "backend-app",
            "log_stream_name": "{instance_id}",
            "timezone": "UTC"
          }
        ]
      }
    }
  }
}
```

Save & Exit. Then, 
```
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
-a fetch-config \
-m ec2 \
-c file:/opt/aws/amazon-cloudwatch-agent/bin/config.json \
-s
```

<img width="1919" height="519" alt="Screenshot 2026-02-18 122333" src="https://github.com/user-attachments/assets/588143da-195d-4c27-8f35-38a7f7433857" />

**Result in CloudWatch: (Logs have been created)**

<img width="803" height="716" alt="Screenshot 2026-02-18 122548" src="https://github.com/user-attachments/assets/5cb81d6d-0614-49a8-8a72-c3c494537299" />

### Frontend / Public Instance– EC2
```
sudo apt update
wget https://amazoncloudwatch-agent.s3.amazonaws.com/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i -E ./amazon-cloudwatch-agent.deb
```
Then,
```
sudo nano /opt/aws/amazoncloudwatch-agent/bin/config.json
```

Then, copy and paste this code: 

```
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/nginx/access.log",
            "log_group_name": "frontend-access",
            "log_stream_name": "{frontend-instance_id}"
          },
          {
            "file_path": "/var/log/nginx/error.log",
            "log_group_name": "frontend-error",
            "log_stream_name": "{frontend-instance_id}"
          },
          {
            "file_path": "/var/log/auth.log",
            "log_group_name": "frontend-auth",
            "log_stream_name": "{frontend-instance_id}"
          }
        ]
      }
    }
  }
}
```

Save & Exit. Then:

```
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
-a fetch-config \
-m ec2 \
-c file:/opt/aws/amazon-cloudwatch-agent/bin/config.json \
-s
```

<img width="949" height="709" alt="Screenshot 2026-02-18 122821" src="https://github.com/user-attachments/assets/2bdb87f2-2912-4879-b0c7-90d7468dad9f" />

**Result in CloudWatch: (Logs have been created) – Final result**:

<img width="802" height="704" alt="Screenshot 2026-02-18 122913" src="https://github.com/user-attachments/assets/b5028737-7d66-4c03-9223-4929422f60eb" />

## 1.3. CloudTrail
This is for AWS account modification and S3 bucket modifications. 

<img width="1572" height="714" alt="Screenshot 2026-02-18 105654" src="https://github.com/user-attachments/assets/ad556dba-28ea-4d34-a33e-966da9e5ecf6" />

**Note: The bucket name should be unique because it could conflict with other people’s naming conventions. **

<img width="1291" height="782" alt="Screenshot 2026-02-18 105709" src="https://github.com/user-attachments/assets/903c5fc7-e7bd-478e-ad93-4462aaab697f" />
<img width="1264" height="607" alt="Screenshot 2026-02-18 105721" src="https://github.com/user-attachments/assets/1c012d2d-0f93-45e0-a60e-798b8d79964d" />


**Click Next, then at Choose Log Event:**

1. Management events (MUST CHECK)
- What it is: Logs "Control Plane" actions like starting an EC2, changing a Security Group, or deleting a Database.
- Why: This is the core of AWS auditing. If someone hacks your AWS Console, this is where you see it.
- Cost: The first copy is free.
2. Data events (MUST CHECK)
- What it is: Logs "Data Plane" actions inside your resources—specifically S3 object access (who downloaded file.jpg) and RDS API activity.
- Why: Since your app is a File Manager, you need to know if someone is bypasssing your app and accessing the S3 bucket directly.
- Configuration: Once you check this, you must select S3 as the resource type so it monitors your specific bucket.
3. Insights events (OPTIONAL / RECOMMENDED)
- What it is: AWS uses AI to look for "unusual" spikes in API calls. For example, if your "AdminUser" suddenly deletes 1,000 files in 1 minute, Insights will flag it as an anomaly.
- Why: Great for SOC alerts, but it takes about 7 days to "learn" your normal behavior before it starts working.
- Verdict: Check it if you want automated "Anomaly Detection."
4. Network activity events (SKIP FOR NOW)
- What it is: Logs API calls that go through VPC Endpoints.
- Why: Unless you have specifically created "Interface VPC Endpoints" for S3 or EC2 (which costs extra money per hour), you won't have any data here.
- Verdict: Uncheck it to keep your logs clean and save money.
- 
**Management Event:**
  
Enable Read and Write. Then:

<img width="1513" height="676" alt="Screenshot 2026-02-18 110632" src="https://github.com/user-attachments/assets/11656a9e-f672-49a5-b860-ca0d7bed408b" />

You can skip the Aggregated Events step. AWS recently added this to help massive enterprises (think thousands of employees) who generate millions of S3 "Read/Write" events every minute. It summarizes those thousands of events into one single "report" every 5 minutes. Finally, click create.

Bucket Location:

<img width="1357" height="519" alt="Screenshot 2026-02-18 111146" src="https://github.com/user-attachments/assets/f3b474d7-5b94-40c1-8a89-98c04627e28b" />

**Confirmation:**
In S3, you can navigate using the path I gave. You should click the Open button and see a long JSON script.

<img width="1599" height="178" alt="Screenshot 2026-02-18 112511" src="https://github.com/user-attachments/assets/685180bd-b09b-47b0-a429-4397d7dd83f0" />

In CloudWatch, since you enable CloudWatch Logs while creating CloudTrail, go to CloudWatch > Log Management > Log Groups > Find your CloudTrail logs folder. You should see log streams. Check your AWS account ID with the long number in the log and check the time as well. 

<img width="603" height="401" alt="Screenshot 2026-02-18 112739" src="https://github.com/user-attachments/assets/861bdeb6-17da-4878-94ec-7d176635d227" />

**To-do List – Phase 1 & 2: Completed. **
From CloudWatch

<img width="473" height="482" alt="Screenshot 2026-02-18 124005" src="https://github.com/user-attachments/assets/1fce84bc-0de6-4a02-84fe-0028cf483ded" />

From CloudTrail

<img width="1343" height="744" alt="Screenshot 2026-02-18 124055" src="https://github.com/user-attachments/assets/dcba14eb-be1b-45a5-97d9-e13931d2f614" />

==================================================================

# 2. Creating a Centralized SOC Platform
Based on ur opinion, where should the SOC platform be located in the real world (networking and subnets)? I want my project to be as close to the real enterprise SOC platform location as possible. Then, tell me how to set it up in AWS. I'm using the AWS free tier, so the VM selection is limited. 

I want to make a new VPC dedicated to security monitoring that only allow traffics from the selected resources from the main VPC or cloudwatch, cloudtrail, and VPC flow logs. Guide me to this. I can use t2.medium, FYI. Make sure to be as realistic as possible. Guide me from making a new VPC, set it up to only allow from ... idk you tell me im noob. Then, the guide on setting up the instance for this security VPC. Then, configure this VM until finish, then we can get logs from CloudWatch, CloudTrail, and VPC flow logs.

## 2.1. Security VPC – Creating a new VPC

<img width="723" height="668" alt="Screenshot 2026-02-19 162511" src="https://github.com/user-attachments/assets/62a13a52-800e-4d34-9160-1ecda9d5b9ae" />

Make sure the IPv4 CIDR is different from your main company production VPC.

## 2.2. Internet Gateway – Creating a new IGW

Then, look at the top right corner. Attach this IGW to the security VPC. Done.

<img width="1588" height="509" alt="Screenshot 2026-02-19 163255" src="https://github.com/user-attachments/assets/ca58708e-b697-4322-8c44-a3ce1018de4c" />

You should notice that there’s only one VPC (if you have 2 VPCs). That’s because other VPCs, by assumption, already have an IGW. You can’t attach 1 IGW to 2 different VPCs. 

<img width="1002" height="284" alt="Screenshot 2026-02-19 170111" src="https://github.com/user-attachments/assets/021765c2-7832-4fae-8647-0310ee68fbd8" />

You should notice that there’s only one VPC (if you have 2 VPCs). That’s because other VPCs, by assumption, already have an IGW. You can’t attach 1 IGW to 2 different VPCs. 

## 2.3. Private Subnet – Creating a new Private Subnet

This subnet is for hosting our private SOC platform. Make sure to disable auto-assigned public IPv4. Can check in the Action button.

<img width="772" height="595" alt="Screenshot 2026-02-19 162726" src="https://github.com/user-attachments/assets/61df10e7-fe18-48eb-a479-ba86cc4d4a8f" />

### 2.3.1 Private Route Table– Creating a new Private Route Table

<img width="1587" height="389" alt="Screenshot 2026-02-19 171357" src="https://github.com/user-attachments/assets/fdde9159-0eec-4ad1-b5a8-650416b88b8c" />

Make sure it is associated with the private subnet. Go to Action > Edit Subnet Association > Select private subnet.

<img width="922" height="524" alt="Screenshot 2026-02-19 172135" src="https://github.com/user-attachments/assets/7477a8a5-c4ec-4cbd-937c-c2f8c01e993f" />

Save & then Edit Routes:

<img width="1359" height="511" alt="Screenshot 2026-02-19 172306" src="https://github.com/user-attachments/assets/cc9084c0-eb18-4a1a-bc77-ea0983d27978" />

Now traffic flows:
SOC EC2 → NAT → IGW → Internet

## 2.4. Public Subnet – Creating a new Public Subnet

This is for the NAT gateway to connect to the IGW for Internet access.

<img width="825" height="607" alt="Screenshot 2026-02-19 170304" src="https://github.com/user-attachments/assets/2c922162-ff53-413f-b12b-d42d310ff388" />

Then, go to this subnet > Action > Edit subnet setting > Enable Public IPv4

<img width="1212" height="466" alt="Screenshot 2026-02-19 170427" src="https://github.com/user-attachments/assets/684bb1dd-e103-4c58-bbfc-49be6c422740" />

### 2.4.1 Public Route Table– Creating a new Public Route Table

<img width="796" height="507" alt="Screenshot 2026-02-19 170613" src="https://github.com/user-attachments/assets/50eb5e72-67e6-4d07-b28e-85bcdbee8215" />

Then, edit routes:

<img width="1569" height="435" alt="Screenshot 2026-02-19 170738" src="https://github.com/user-attachments/assets/df6df7e0-9cff-4400-8f61-2d77aa28c861" />

This would make this subnet to have access to the Internet because we added an Internet Gateway. 

## 2.5. NAT Gateway– Creating a new NAT Gateway

This is to place this gateway in the public subnet. 

<img width="1274" height="735" alt="Screenshot 2026-02-19 170956" src="https://github.com/user-attachments/assets/1ab71af1-3512-41a4-9945-afb8c2eafcee" />

Then, wait until the NAT gateway finishes creating. Then, you should check its Elastic IP. It should be automatically created for the NAT gateway. Just rename it. 

<img width="1589" height="343" alt="Screenshot 2026-02-19 171751" src="https://github.com/user-attachments/assets/ca255cbd-0420-45a9-bd99-582e507293b9" />

## 2.6. Private Instance – Creating a private instance for the SOC platform

<img width="493" height="249" alt="Screenshot 2026-02-19 173053" src="https://github.com/user-attachments/assets/a562a028-3d9b-4625-a867-1e04bb0543cd" />

- Private IP: 10.1.1.25
- No Public IP. If you see, remove it. 

For security group rules:

**Outbound** 
- Allow all types, source: 0.0.0.0/0
- WARNING (LAB ONLY): In a "Military Grade" enterprise, they might restrict outbound traffic (Egress) to only specific AWS IP ranges to prevent "Data Exfiltration" (a hacker sending your data to their own server).

However, for the project:
- The Elastic Installer: Needs to reach the internet to download gigabytes of software.
- AWS APIs: The instance needs to reach the global CloudWatch and S3 endpoints to pull your logs.
- Verdict: Use one rule: All Traffic | All Ports | Destination: 0.0.0.0/0. This is the standard "default" for a reason; it ensures your tools don't break because they can't "call home."

**Inbound:**

| Type       | Port Range | Source              | Purpose                                                                 |
|------------|------------|---------------------|-------------------------------------------------------------------------|
| Custom TCP | 9200       | SOC-SG              | Allows the SOC agent to talk to the SOC database                        |
| Custom TCP | 5601       | Your-Home-IP/32 or /24 | Kibana UI. Accessing the dashboard from your browser.                |
| Custom TCP | 9200       | 10.0.0.0/16         | Elasticsearch API. Allows your Main VPC instances (Frontend/Backend) to send logs. |
| Custom TCP | 8220       | 10.0.0.0/16         | Fleet Server. Required if you use Elastic Agents to manage logs from your other servers. |


## 2.7. Security VPC – Resource Map Guide

It should look like this

<img width="1896" height="688" alt="Screenshot 2026-02-19 191207" src="https://github.com/user-attachments/assets/02e43ef8-91a0-42bc-81ed-5256c295c6b5" />


## 2.8. IAM Role Set Up

We need to create an IAM role.

<img width="1387" height="530" alt="Screenshot 2026-02-19 191623" src="https://github.com/user-attachments/assets/8b6aba09-e08d-4cf2-bdbb-6c6fdde01d60" />

Trusted entity: 
```AWS Service```

Use case: 
```EC2```

Attach these policies:
```
AmazonSSMManagedInstanceCore
CloudWatchReadOnlyAccess
AmazonS3ReadOnlyAccess
AWSCloudTrail_ReadOnlyAccess
```

Name: ```SOC-Private-Instance-Role```

Then, create a role. Next, attach it to the SOC instance.
```
Attach to Instance: EC2 Console > Select SOC Instance > Actions > Security > Modify IAM Role > Select SOC-Private-Instance-Role
```

## 2.9. SSM – AWS System Manager
Source: [Link](https://www.youtube.com/watch?v=BHUC1WGlR00)

Since our SOC instance is in the private subnet with no public IP, we can’t SSH from our PC. Thus, we use SSM. You can search for System Manager > Session Manager in the AWS search bar. <br>
**✅ BEST METHOD: AWS Session Manager (Enterprise Standard)**
Do NOT:
- ❌ Add public IP
- ❌ Create bastion host (cost + complexity)
- ❌ Open SSH to 0.0.0.0/0

**Real enterprises use:** <br>
🔐 AWS Systems Manager (SSM) Session Manager

It allows:
- Shell access
- No public IP
- No inbound ports needed
- Fully logged access

We will use this.

**How to "SSH" without an IP**
- Go to the EC2 Console > Instances.
- Select your SOC Platform instance.
- Click the Connect button at the top.
- Choose the Session Manager tab and click Connect.
  - Note: If the "Connect" button is greyed out, wait 5 minutes for the SSM Agent (pre-installed on Ubuntu) to check in with the new IAM role.
- A terminal will open in your browser. You are now "inside" your private SOC instance!

From the SOC instance:

<img width="1867" height="692" alt="Screenshot 2026-02-19 192452" src="https://github.com/user-attachments/assets/b89779f4-031f-4484-a32e-b48a1ffa0b76" />


From Session Manager:

<img width="1889" height="709" alt="Screenshot 2026-02-19 192513" src="https://github.com/user-attachments/assets/bb756322-af37-47ff-b848-38475fed29a5" />


After you click Connect in the EC2 console or Start Session from the Session Manager, you should see a browser pop up and show this:

<img width="1901" height="677" alt="Screenshot 2026-02-19 192610" src="https://github.com/user-attachments/assets/3c319da4-54d3-489e-8542-768ae3fc95d0" />

Ping connection test:

<img width="1055" height="413" alt="Screenshot 2026-02-19 194433" src="https://github.com/user-attachments/assets/8b605861-48bb-4c6a-a43f-7147cd2d61c0" />

The downside is that you can’t scroll up to the previous command, nor can you copy and paste any code or CLI inside. You need to type manually. Actually, you can. Just type: `bash`


## 2.10. VPC Peering/Tunneling Connection
Source: [Link](https://www.youtube.com/watch?v=ZFe70EZqU18&pp=ugUHEgVlbi1VU9IHCQmHCgGHKiGM7w%3D%3D)

For the main VPC to connect to the security VPC, each VPC’s route table has to have each other’s IP address.
- 10.0.0.0/16 – Main VPC
- 10.1.0.0/16 – Security VPC

First, test the connection using an instance from the public subnet of any of the VPCs and curl another public instance of another VPC. See if you can curl it. 
Configuration & setup for both EC2 instances (you can just follow the link above):
- Create 1 public instance in the public subnet of the main VPC
- Create 1 public instance in the public subnet of the security VPC
- Each instance has Amazon Linux
- Configure their VPC and subnet carefully
- Scroll at the end > Click on Advanced Detail > Find the writing box > Paste this code (will create HTTP web):

```
#!/bin/bash
# User data for new EC2 instances
# install httpd (Linux 2 version)
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1> Hello! This private IP is from $(hostname -f)</h1>" > /var/www/html/index.html
```

Instance from the main VPC – public subnet:

<img width="1083" height="371" alt="Screenshot 2026-02-20 221843" src="https://github.com/user-attachments/assets/83152d7c-27e8-43c7-aa3e-7a45a6707237" />

Instance from the Security VPC – public subnet: <br>
{I deleted the image, but it resulted in the same Failed to connect error as shown in the above image}

Second, create a VPC peering connection.
### 2.10.1. Creating Peering Connection

<img width="988" height="735" alt="Screenshot 2026-02-20 212920" src="https://github.com/user-attachments/assets/cc08974f-d54f-496b-b90b-97ba86f87c96" />

<img width="1266" height="537" alt="Screenshot 2026-02-20 212950" src="https://github.com/user-attachments/assets/02b15c48-9770-448c-81f5-81733dbf639d" />\


**Note: Any VPC can be an accepter/requester or the other way around. It doesn’t matter. It’s just a Point-to-point connection. **

Accept Request: 

<img width="1527" height="648" alt="Screenshot 2026-02-20 213240" src="https://github.com/user-attachments/assets/de4c0164-e7a2-45c9-b627-53c710148c9f" />

### 2.10.2. Peering Routable
Next,  go to the route table for each VPC and add the IP range of the other VPC. For the main VPC to connect to the security VPC, each VPC’s route table has to have each other’s IP address.

<img width="1248" height="519" alt="Screenshot 2026-02-20 221432" src="https://github.com/user-attachments/assets/982b3551-f917-48f0-8cc0-b11d16a0f8a2" />

Both SOCs' route tables (public & private) can follow the same setup from the public routable below. Add the main VPC’s IP inside:

<img width="1600" height="550" alt="Screenshot 2026-02-20 221358" src="https://github.com/user-attachments/assets/adb1883b-7372-4ab2-bf89-43a11d058988" />

Both main VPCs’ route tables (public & private) can follow the same setup from the public routable below. Add the main VPC’s IP inside:

**Testing if the VPC peering connection works** <br>
Instance from the Main VPC – public subnet:

<img width="635" height="343" alt="Screenshot 2026-02-20 222143" src="https://github.com/user-attachments/assets/2ca3549d-49e3-4cff-8386-5b30db405275" />

Instance from the Security VPC – public subnet: <br>
You can curl from the public security instance and should have a similar result as the instance above.


## 2.11. Elastic Setup

Set up Elastic on the instance in the private subnet of the Security VPC. <br>
Source (didn’t use): [Link](https://www.youtube.com/watch?v=BpLDDuCaOTA)

**Initialization** <br>
First, get into the SOC platform via SSM. Then follow the CLIs below.
```
sudo apt-get update && sudo apt-get upgrade -y
sudo apt install openjdk-21-jdk (Note that 21 is the version. Stay updated)
```
**Install Docker**
```
sudo apt-get install -y docker.io 
```
**Start Docker and ensure it runs on boot**
```
sudo systemctl start docker 
sudo systemctl enable docker
```
**Switch to root**
```
sudo -i 
```
**Add ssm-user to the docker group**
```
usermod -aG docker ssm-user
```
**Verify**
```
id ssm-user    # Should show: groups=...,docker
docker ps  # Should return an empty list, not a permission error
```

**Installation**
```
cd ~
curl -fsSL https://elastic.co/start-local | sh
```
This will spin up Elasticsearch + Kibana via Docker Compose and print out something like:
```
🔐 Kibana is up!
   URL: http://localhost:5601
   Username: elastic
   Password: <SAVE_THIS_PASSWORD>
```

**Elastic Credentials**

<img width="895" height="788" alt="Screenshot 2026-02-21 095646" src="https://github.com/user-attachments/assets/005a8cec-c549-46a9-aca5-d9dac9e02e8a" />

🎉 Congrats, Elasticsearch and Kibana are installed and running in Docker!
- 🌐 Open your browser at http://localhost:5601
- Username: `elastic` (Example)
- Password: ```jZQ7Ve7F``` (Example)
- 🔌 Elasticsearch API endpoint: ```http://localhost:9200```
- 🔑 API key: ```X3pZY2Zwd0JBT3IwNFQtcVoyWUc6QUxfVUV2OFBOZlVqVnhPWFdXcTl4UQ==```

Check if both containers are healthy and active:
`
docker ps
`

Should show elasticsearch and kibana containers with status "healthy"


### 2.11.1. AWS CLI
- Source: [Link](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- Additional: [Link](https://www.youtube.com/watch?v=nt6NTWQ-h6o)

On your OWN laptop, open CMD as admin and install both AWS CLI and SSM plugin. <br>
Verification: `aws --version`

### 2.11.2. Session Manager CLI – SSM Plugin

On your OWN laptop, open CMD as admin:
- Installation: [Link](https://docs.aws.amazon.com/systems-manager/latest/userguide/install-plugin-windows.html)
- Verification: [Link](https://docs.aws.amazon.com/systems-manager/latest/userguide/install-plugin-verify.html)
- Verification: `session-manager-plugin`

### 2.11.3. AWS Login

In the same terminal, type: `aws login` <br>
This will give you a secure tunnel to access 

Then, open PowerShell,

```
aws ssm start-session `
  --target <YOUR_SOC_INSTANCE_ID> `
  --document-name AWS-StartPortForwardingSession `
  --parameters "portNumber=5601,localPortNumber=5601" `
  --region <YOUR_REGION>
```

You should see something like this after running the script above:

<img width="338" height="190" alt="Screenshot 2026-02-21 120618" src="https://github.com/user-attachments/assets/ae039617-f6d0-4b9e-b232-13415646adac" />


Next, go to your favorite browser and type:
```http://localhost:5601```

Enter your credentials from the Elastic Setup – Elastic Credential part at the top of this document.
Result:

<img width="1822" height="969" alt="Screenshot 2026-02-21 120529" src="https://github.com/user-attachments/assets/9f2a71e1-3128-469c-a9ca-00d7c20cd8c1" />

You can double-check in the SSM console:

<img width="1462" height="309" alt="Screenshot 2026-02-22 115134" src="https://github.com/user-attachments/assets/18361ea8-e395-44fe-aa4d-ceb3adf67e8f" />

## 2.12. WebUI Elastic Setup
### 2.12.1. Add Fleet Server

We need to add a fleet server to our own SOC platform instance. Go to the search bar of the web and search for Fleet. Go to Settings.

**🛠️ Step 1: Add the Fleet Server**
1. Click that "Add Fleet Server" button.
2. Name: Type SOC-Fleet-Server.
3. URL: This is where you must use your SOC Instance's Private IP (the 10.x.x.x one from your AWS console).
  4. Type: https://<YOUR-SOC-PRIVATE-IP>:8220
5. Click "Generate Service Token" or “Generate Policy”.
6. Check your SOC instance machine’s spec because you need to choose the machine type:
  7. In your SSM SOC instance, type: hostnamectl
  8. Look at the Architecture row.

<img width="610" height="396" alt="Screenshot 2026-02-21 123658" src="https://github.com/user-attachments/assets/1bad06cd-58ec-4a7f-99a4-433f05d8d60e" />

The Command: Elastic will give you a long command that looks like a curl and sudo ./elastic-agent install. Copy this command.

<img width="1901" height="884" alt="Screenshot 2026-02-21 123510" src="https://github.com/user-attachments/assets/a7127cd4-687a-457e-928c-db415b2e26d9" />

**Example: **
```
curl -L -O https://artifacts.elastic.co/downloads/beats/elastic-agent/elastic-agent-9.3.0-linux-x86_64.tar.gz
tar xzvf elastic-agent-9.3.0-linux-x86_64.tar.gz
cd elastic-agent-9.3.0-linux-x86_64
sudo ./elastic-agent install \
  --fleet-server-es=http://localhost:9200 \
  --fleet-server-service-token=AAEAAWVsYXN0aWMvZmxlZXQtc2VydmVyL3Rva2VuLTE3NzE2NTE5MDY0MTM6NnBscDRIZzZUS09FVGNiTGV2c1V6UQ \
  --fleet-server-policy=fleet-server-policy \
  --fleet-server-port=8220 \
  --install-servers
```

### 2.12.2. Add Fleet Agent to the SOC instance

Go back to your SSM SOC instance, make sure you are in the ssm-user or simply type: ``cd ~``
Then, paste the CLI from the example above. 

What this does: It installs the Elastic Agent on the SOC itself and tells it to act as the "Fleet Server" (the manager). It will take about 1–2 minutes. When it's done, the Kibana screen will display ``"Fleet Server connected successfully"`` or ``“Elastic Agent has been successfully installed”``. 

**Note: Don’t forget to type: Y for Yes. You will be prompted after entering the script**

<img width="1382" height="634" alt="Screenshot 2026-02-21 124131" src="https://github.com/user-attachments/assets/5175df6a-e5ae-42f8-9c97-d609ad3f6111" />

Once you see  ``"Fleet Server connected successfully"`` or ``“Elastic Agent has been successfully installed”`` in the SSM SOC terminal, go back to the Elastic WebUI and confirm the connection:

<img width="943" height="824" alt="Screenshot 2026-02-21 124823" src="https://github.com/user-attachments/assets/f78449a7-b8da-4854-a29b-bf7dd4a4d656" />

**⚙️ Next Step: Update Global Settings (The "Private" Fix)** <br>
Now that the server exists, we need to make sure every future agent knows to look for it at the right address.
- In Fleet, go to the Settings tab (top right).
- Fleet Server hosts: Click the pencil/edit icon. Make sure it is your private IP: https://<YOUR-SOC-PRIVATE-IP>:8220.
- Outputs (Elasticsearch): Click the pencil/edit icon on the "Default" output.
- Change http://localhost:9200 to https://<YOUR-SOC-PRIVATE-IP>:9200.
- Click Save.

<img width="1782" height="581" alt="Screenshot 2026-02-21 125123" src="https://github.com/user-attachments/assets/6f1f3c95-2584-4dd5-a70c-f7dffda54130" />

Check status:
``
sudo systemctl status elastic-agent
sudo elastic-agent status
``

- Verify the "Gate" is open (Should see 0.0.0.0 or :::9200) 
``
sudo netstat -tulpn | grep 9200
``

### 2.12.3. Modify Docker Network

It is expected that you get an error saying ``DEGRADE`` or ``127.0.0.1:9200`` from the netstat command. In the WebUI, Fleet – Add Agent page, you are expected to see something like ``“Unhealthy”`` and ``“Add Fleet Server”``. 

The reason behind this is that the Docker ElasticSearch network is only allowing ``localhost`` or ``127.0.0.1:9200`` of the SOC instance, and cannot send data to the WebUI. Don’t forget that the SOC instance inbound rule should have 2 sources that have the same port of 9200, the SOC Instance Security Group, and the production/main VPC’s IP range. Now, let’s fix this issue.

Next, we configure the Docker network in the SOC instance.
``
pwd 
cd /home/ssm-user/elastic-start-local 
docker compose down
nano docker-compose.yml
``

Then, in service/elasticsearch, change:

<img width="853" height="275" alt="Screenshot 2026-02-21 134140" src="https://github.com/user-attachments/assets/80bceb20-8490-43af-b5f1-509e7d94d3a6" />

Follow by:
``
docker compose up -d
sudo systemctl status elastic-agent
sudo elastic-agent status
sudo netstat -tulpn | grep 9200
docker ps
``
These are the results you want:

<img width="1119" height="373" alt="Screenshot 2026-02-21 134211" src="https://github.com/user-attachments/assets/14468bed-2105-4abb-97db-79d51f83323f" />
<img width="1902" height="168" alt="Screenshot 2026-02-21 140317" src="https://github.com/user-attachments/assets/1b80b068-aca8-4c89-bdd2-58eb4c6ee151" />
<img width="1792" height="675" alt="Screenshot 2026-02-21 134225" src="https://github.com/user-attachments/assets/3a684111-9bb3-447e-a54e-105f24975ae7" />


## 2.13. Configure Logs

Now, it is time to add agents. Remember, I have CloudWatch, CloudTrail, 2 EC2 machines, RDS - MySQL, and S3. What we do is hybrid. We use both Agents and AWS Integration in Kibana.
- Agents – For both frontend and backend EC2 machines
- AWS Integration – For CloudWatch, CloudTrail, RDS - MySQL, and S3

### 2.13.1. Elastic Agents

If your frontend and backend storage volume is 8GB, increase them to at least 10-12 GB storage. <br>
**Increase Volume/Storage in EC2 instances:**
- Source: [Link](https://www.youtube.com/watch?v=jVffXZc4tf8)
- Official Documentation: [Link](https://docs.aws.amazon.com/ebs/latest/userguide/recognize-expanded-volume-linux.html)

- First, go to your EC2 and find its volume. Click on the volume and modify volume (Action Button at the top right corner). Adjust the storage > Save.
- Second, go to your instance and follow along:

**Step 1: Free up space immediately**

See what's eating space
``
sudo du -sh /* 2>/dev/null | sort -rh | head -20
``
Clean up the elastic agent tarball you downloaded (it's huge)
``
cd ~
rm -f elastic-agent-*.tar.gz
``
Clean apt cache
``
sudo apt-get clean
``
Check again
``
df -h
``

**Step 2: Fix the partition resize**

1. Resize the partition to use the full disk
``
sudo growpart /dev/nvme0n1 1
``
2. Then resize the filesystem to fill the partition
``
sudo resize2fs /dev/nvme0n1p1
``
3. Verify
``
df -h  # should now show ~11GB
``

**Step 3: Go to AWS Console**
Also check if this EC2's EBS volume was recently resized — if the volume was resized in AWS but the OS wasn't notified, a reboot might be needed first: ``sudo reboot`` <br>
Then retry the growpart after reboot. Now both machines storage shouldn’t be a problem right now. 

# NEXT:

- Go to this path in the browser URL: ``http://localhost:5601/app/fleet/agents``. Make sure the server is Healthy. If not, go back to the ``WebUI Elastic Setup – Modify Docker Network`` above in this document.
- Then, click Add Agent. 
- Policy Name: Main-VPC-EC2-Policy
- Click Next or whatever button is next.
- Pick the right Linux specs. And copy the script.

Before running, verify that the Frontend/Backend can reach the SOC Fleet server:
``
curl http://<SOC-PRIVATE-IP>:8220
``
If it times out, add an inbound rule to the SOC Security Group allowing TCP 8220 from the Main VPC CIDR. If successful, you should see something like ``“Client sent an HTTP request to an HTTPS server”``.

Next, for each of the EC2 instances, follow these CLI:
``
cd ~
{Paste-your-script-from-kibana-add-agents}
``
**Example script:**
``
curl -L -O https://artifacts.elastic.co/downloads/beats/elastic-agent/elastic-agent-9.3.0+build202602051825-linux-x86_64.tar.gz 
tar xzvf elastic-agent-9.3.0+build202602051825-linux-x86_64.tar.gz
cd elastic-agent-9.3.0+build202602051825-linux-x86_64
sudo ./elastic-agent install --url=https://10.1.1.25:8220 --enrollment-token=SnQ3LWZwd0JONTVuX1RGOEViOUc6YndTYzI3dS1tSkRWWlktZUZ2SFFlQQ== --insecure
``
**Note: Don’t forget to type: Y for Yes. You will be prompted after entering the script**

From Frontend:

<img width="1393" height="574" alt="Screenshot 2026-02-21 141335" src="https://github.com/user-attachments/assets/8f45d6d6-0a39-442f-a106-3a072453fdff" />

``Elastic Agent has been successfully installed.``

**From Backend:**

<img width="1381" height="513" alt="Screenshot 2026-02-21 141425" src="https://github.com/user-attachments/assets/e5c3029f-814f-49d5-a7df-609d7cfea552" />

``Elastic Agent has been successfully installed.``

**Confirmation – EC2 Agents Results**

<img width="1554" height="689" alt="Screenshot 2026-02-21 163220" src="https://github.com/user-attachments/assets/c9b4536d-fc18-4b00-abaf-a7fc266e2202" />


For confirmation, you should look at the left side of the WebUI. Look for Discover and look at it. Before you configure agents, this page is empty. Since we already configured agents on both EC2 machines from the Main VPC, we should be able to see logs here. You can read JSON logs within each packet and try to find the machine.

<img width="1914" height="880" alt="Screenshot 2026-02-21 163617" src="https://github.com/user-attachments/assets/12c8d2cb-4365-47f4-ab09-3c62759b72e9" />

## 2.14. AWS Integration <br>
In this URL: ``http://localhost:5601/app/fleet/policies/fleet-server-policy``

You should filter for AWS only. 

5 things you should find. Scroll through the list and toggle ON only these specific items:
- Collect CloudTrail logs from S3 (For your aws-cloudtrail-logs-mj bucket)
- Collect VPC flow logs from CloudWatch
- Collect S3 access logs from S3 (For your company-storage-network-project bucket)
- Collect logs from CloudWatch (For your RDS MySQL Error/Slow logs)
- Collect RDS metrics (To see database CPU/Memory usage)
- Collect EC2 metrics (To monitor your SOC/Frontend/Backend hardware health)

**NOTE: ONLY USE “Fleet Server Policy” when creating any integration. Do not use your non-security platform agent (e.g., from EC2 instances). Example: Main-VPC-EC2-Instance**

==============================================

### 2.14.1. About Policies
- **Fleet Server Policy** – Is the policy for the agent inside the SOC platform
- Main-VPC-EC2-Instance – Is the policy for agents in EC2 hosts. This policy has ‘System Integration’ automatically installed after creation. The ‘System Integration’ is used to track each host’s (including SOC) system metric, such as cpu, ram, storage, etc.

==============================================

### 2.14.2. SOC IAM Role - Updated <br>
The purpose of this new IAM role is to make sure the SOC Platform instance is pulling logs from the right place. More importantly, it is supposed to have the right privilege to do so. The code below has *, meaning access to all resources.

However, for"Read-Only" or "Discovery" actions, AWS often requires a wildcard (e.g., ec2:DescribeInstances). The only time it is dangerous is when it is paired with Write or Access actions. (e.g., s3:GetObject on Resource: "*"). Now, we go to the IAM role of the SOC-Private-Instance-Role. We create a new incline policy or modify the old one call ``“SOC-S3-AccessLogs-Read”``. Paste this script below. 

``
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "RestrictedDataAccess",
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:ListBucket",
                "s3:GetBucketLocation"
            ],
            "Resource": [
                "arn:aws:s3:::aws-cloudtrail-logs-mj",
                "arn:aws:s3:::aws-cloudtrail-logs-mj/*",
                "arn:aws:s3:::company-storage-network-project",
                "arn:aws:s3:::company-storage-network-project/*",
                "arn:aws:s3:::company-storage-access-logs",
                "arn:aws:s3:::company-storage-access-logs/*"
            ]
        },
        {
            "Sid": "MandatoryWildcardDiscovery",
            "Effect": "Allow",
            "Action": [
                "ec2:DescribeInstances",
                "ec2:DescribeRegions",
                "cloudwatch:GetMetricData",
                "cloudwatch:ListMetrics",
                "logs:DescribeLogStreams",
                "rds:DescribeDBInstances",
                "logs:DescribeLogGroups",
                "logs:GetLogEvents",
                "logs:FilterLogEvents"
            ],
            "Resource": "*"
        }
    ]
}
``
Save.

==============================================

### 2.14.3. CloudTrail
1. Open Kibana.
2. Click the Search Bar at the top and type "Fleet". Click it.
3. Click the Agent Policies tab.
4. IMPORTANT: Click on your Fleet Server Policy (The one your SOC instance uses).
  - Do NOT click "Main-VPC-EC2". If you add it there, the web servers will try to run it again.

**Configuration page:** <br>
Under "Configure integration":
- Integration name: cloudtrail-soc (or anything you like)
- 
Under "Collect CloudTrail logs from S3":
- Toggle this ON
- Queue URL: Leave blank for now
- Bucket ARN or name: type SOC-Trail-Audit (your bucket name)
- Access Key ID: Leave blank
- Secret Access Key: Leave blank
- Session Token: Leave blank
- Region: us-east-1 (or whatever your region is)
- Leaving credentials blank is intentional — it will automatically use your SOC-Final-Role IAM role attached to the instance.
- Then click "Add Integration". 

For confirmation, you should run this command on 4 places. Make sure it shows HEALTHY.
- Main VPC: Public & Private Instances
- Security VPC: SOC Platform

<img width="468" height="159" alt="Screenshot 2026-02-21 202414" src="https://github.com/user-attachments/assets/e79c424d-5a45-4b59-a906-3f7ccb11eabd" />
<img width="717" height="227" alt="Screenshot 2026-02-21 202452" src="https://github.com/user-attachments/assets/59b70082-eaed-45a6-88df-7be748ff0625" />


Regardless of the IP or location, just look for the word HEALTHY from the related agents. Should run this every time you set up each integration to see what failed to avoid a huge headache in the future.

==============================================

### 2.14.4. VPC Flow Logs
- Find the Toggle: Scroll down to "Collect VPC flow logs from CloudWatch".
- Toggle it: ON.
- Click "Change defaults" and fill in these exact boxes:
  - Log Group Name: Enter the name of the log group you created in AWS (e.g., vpc-flow-logs or /aws/vpc/main).
  - Region: Your AWS region (e.g., us-east-1).
  - You don’t necessarily need to fill in other boxes besides what are shown in this document. Done.
- Additional Info – Scroll down to "Collect logs from CloudWatch" (the general one):
  - Note: You can actually use either the specific "VPC flow logs" toggle OR the general "Collect logs" toggle. I recommend using the "Collect VPC flow logs from CloudWatch" one because it has a built-in "parser" that knows how to read the VPC columns (Source IP, Port, Action) automatically.
  - Also, choosing Collect Logs from S3 is better because flow logs output A LOT of data. Plus, CloudWatch increases in price as the volume/storage increases.
  
==============================================

### 2.14.5. S3 Access Logs

This is a two-part setup. Many beginners make the mistake of thinking the Elastic Agent reads the production bucket directly. In reality, S3 Access Logging is a feature you turn on in AWS that "writes" text files about what’s happening. Then, the Elastic Agent reads those text files. 

First, you need to make another bucket to store logs from S3 Access Logs. You can name it: ``company-storage-access-logs``

**Phase 1: The AWS Side (Generate the Logs)**

AWS does not log S3 access by default because it costs a tiny bit of storage money. You have to turn the ``"recorder"`` on.
- Go to the S3 Console and click on your production bucket: company-storage-network-project.
- Click the Properties tab.
- Scroll down to Server access logging and click Edit.
- Select Enable.
- Target Bucket: Choose a bucket to store the logs. (Earlier, you mentioned company-storage-access-logs. Use that one).
- Prefix: Type logs/
- Why? This keeps the log files in a neat folder so they don't clutter the root of your bucket.
- Click Save changes. <br>
**Note: It can take up to one hour for AWS to start delivering the first log files to that bucket. Don't panic if Elastic doesn't see anything immediately.**

**Phase 2: The IAM Side (The Keys)**

Your SOC agent needs to be able to "reach into" the access logs bucket, not just the production bucket. Go to your SOC-Private-Instance-Role in IAM. <br>
Update your custom policy to ensure the Resource includes the destination bucket where the logs are being written:
``
{
    "Effect": "Allow",
    "Action": [
        "s3:GetObject",
        "s3:ListBucket",
        "s3:GetBucketLocation"
    ],
    "Resource": [
        "arn:aws:s3:::company-storage-access-logs",
        "arn:aws:s3:::company-storage-access-logs/*"
    ]
}
``

**Phase 3: The Kibana Side (The Toggle)**

Now we tell the Elastic Agent to go and fetch those files.
- Go to Fleet > Agent Policies and click your Fleet Server Policy (SOC).
- Find your AWS Integration and click Edit.
- Scroll down to the toggle: Collect S3 access logs from S3.
- Toggle it ON.
- Click Change defaults (the blue text) and fill in these three boxes:
- Bucket Name: company-storage-access-logs (This is the bucket containing the logs).
- Prefix: logs/ (Matches what you typed in Phase 1).
- Region: Your AWS region (e.g., us-east-1).
- Scroll to the bottom and click Save and Deploy.

==============================================

### 2.14.6. RDS Logs – MySQL

RDS is the only service that does not send logs to CloudWatch by default. We have to tell AWS to start "exporting" them.

**🛠️ Step 1: The AWS Side (Enable RDS Log Exports)**

- Log in to the AWS Console and go to RDS > Databases.
- Click on your Database Name.
- Click the Modify button at the top right.
- Scroll down to the Log exports section.
- Check the boxes for:
  - Error log
  - General log
- Scroll to the bottom and click Continue.
- Select Apply immediately and click Modify DB Instance. <br>
**Note: This does not reboot your database, but it tells AWS to start creating the Log Groups in CloudWatch.**
  
**🛠️ Step 2: Configure RDS Logs in Kibana**

Go to Management > Fleet > Agent Policies > Fleet Server Policy and click Edit on your AWS integration. Find the Toggle: Scroll to Collect logs from CloudWatch.
- Toggle it: ON.
- Click "Change defaults".
- Add Error Logs:
  - Log Group Name (not ARN): /aws/rds/instance/<YOUR_DB_NAME>/error
  - Region: Your region (e.g., us-east-1).
- Add General Logs:
  - Since you want both, look for an "Add row" or "+" button (depending on your Kibana version).
  - If you don't see one, you can simply add the AWS Integration a second time to the same policy specifically for General logs, which I did make a new one called “aws-rds-general-logs-monitor”.
  - Log Group Name: /aws/rds/instance/<YOUR_DB_NAME>/general
  - Region: Your region. <br>
⚠️ Warning for Beginners: "General logs" record every single SQL query. If your app is busy, this will generate a lot of data (and cost). Keep an eye on it!

**🛠️ Step 3: Enable Metrics (The "Easy" Switches)**

While still editing that same AWS integration, look for these two specific toggles:

### 2.14.7. RDS Metrics (CPU/Memory/Connections)
- Find the Toggle: Collect RDS metrics.
- Toggle it: ON.
- Region: us-east-1a or find it yourself in the RDS console
- Config: Leave everything at default. Your IAM role's rds:DescribeDBInstances permission allows the agent to find the database and pull performance data automatically.

### 2.14.8. EC2 Metrics (Frontend/Backend/SOC Health)
- Find the Toggle: Collect EC2 metrics.
- Toggle it: ON.
- Config: Leave at default.
- The Magic: Because your SOC instance has ec2:DescribeInstances on Resource: "*", this one agent will now "look" at all three of your servers and report their CPU and RAM usage to Kibana. You do not need to enable this on the Frontend/Backend policies.

**🛠️ Step 4: Final Save**
- Scroll to the bottom.
- Ensure AWS Credentials (Access Key/Secret) are still EMPTY.
- Click Save and Deploy.

==============================================
## 2.15. Confirmation – AWS Integration Results:
These are the policies to be made. The ``aws-soc-monitor`` is our main integration using the Fleet Server as its Policy. 
The ``aws-rds-general-logs-monitor`` is using the same concepts as the aws-soc-monitor. However, it has only 1 selected log, which is Collect logs from CloudWatch – this is to collect logs from MySQL Database – General Logs.

<img width="1747" height="637" alt="Screenshot 2026-02-21 231201" src="https://github.com/user-attachments/assets/d886bcd1-45ca-402a-bf8f-64804b7146f4" />






