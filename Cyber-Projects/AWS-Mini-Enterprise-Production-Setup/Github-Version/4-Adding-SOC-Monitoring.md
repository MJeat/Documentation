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

<img width="1572" height="714" alt="Screenshot 2026-02-18 105654" src="https://github.com/user-attachments/assets/4be76482-9112-4984-80f0-24db19541a8e" />

🛠️ Step 3: Attach the Group to your Database
1. Go to RDS Console > Databases > Select your DB.
2. Click Modify.
3. Scroll down to Additional configuration > Database options.
4. Change DB parameter group from default.mysql... to your new soc-mysql-parameters.
5. Scroll to the bottom, click Continue, select Apply immediately, and click Modify DB Instance.

<img width="1291" height="782" alt="Screenshot 2026-02-18 105709" src="https://github.com/user-attachments/assets/014b37c8-976b-49d6-9467-89abec30ee11" />

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











