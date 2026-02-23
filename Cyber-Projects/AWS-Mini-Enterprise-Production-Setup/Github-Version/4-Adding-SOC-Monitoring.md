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






