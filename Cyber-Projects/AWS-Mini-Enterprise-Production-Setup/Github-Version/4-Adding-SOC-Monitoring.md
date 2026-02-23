The full-stack development is enough. However, if you want to integrate AWS security monitoring or your very own EC2 to monitor, there might be changes to all instances and services (e.g., reverse proxy, honeypot, private server, S3, and DB).

# About CloudWatch
Source: 
- [Link1](https://www.youtube.com/watch?v=HRJnhzSSFtk)
- [Link2](https://www.youtube.com/watch?v=PBO636_t9n0) <br>
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

[] From ChatGPT & Gemini, finish connecting all AWS services and resources to CloudTrail, CloudWatch, and VPC Flow Logs
[] Test if CloudTrail & CloudWatch logging and monitoring work for each AWS service
[] Create a centralized SOC platform using Elastic and configure its IAM role
[] Connect all logs from CloudTrail and CloudWatch to the SOC platform

==================================================================

# 1. Connecting Resources with CloudWatch, CloudTrail, & Flow Logs
## 1.1. VPC Flow Logs

The entire log is in CloudWatch. 

<img width="1878" height="807" alt="Screenshot 2026-02-18 104005" src="https://github.com/user-attachments/assets/dcf4c97b-35b2-4424-902a-98cfa080f3d3" />

Since the Proxy, Backend, and Database all live inside the VPC subnets, one "Switch" covers them all at the network layer.
VPC Console > Your VPCs > Select your VPC.
Click the Flow Logs tab > Create flow log.
Filter: ALL.
Destination: Send to CloudWatch Logs.
Log Group: Create /aws/vpc/main-flowlogs.
IAM Role: 
Click "Set up permissions." Create a role named VPCFlowLogRole.
Ensure the trust policy allows vpc-flow-logs.amazonaws.com to assume the role.


Confirmation:

Click the destination name link > Click the Logs Stream > If you see ACCEPT, all good.









