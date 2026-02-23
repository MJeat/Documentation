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
[] From ChatGPT & Gemini, finish connecting all AWS services and resources to CloudTrail, CloudWatch, and VPC Flow Logs
[] Test if CloudTrail & CloudWatch logging and monitoring work for each AWS service
[] Create a centralized SOC platform using Elastic and configure its IAM role
[] Connect all logs from CloudTrail and CloudWatch to the SOC platform
==================================================================

# 1. Connecting Resources with CloudWatch, CloudTrail, & Flow Logs
## 1.1. VPC Flow Logs










