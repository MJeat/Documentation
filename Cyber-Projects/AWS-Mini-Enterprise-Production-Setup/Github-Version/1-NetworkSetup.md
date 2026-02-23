
# VPC
How to create VPC and subnets: [Link](https://www.youtube.com/watch?v=TUTqYEZZUdc) <br>
First, create a VPC
<br><img width="1907" height="785" alt="Screenshot 2026-01-26 141933" src="https://github.com/user-attachments/assets/743cdf86-2b0d-49c7-92a2-47168c59429a" />

Create public subnet & Private subnet:
<br><img width="1604" height="480" alt="Screenshot 2026-01-26 142732" src="https://github.com/user-attachments/assets/a207405e-e9fd-4647-b4e0-a0185146838f" />

# Important Note: This is our goal.
The Internet gateway or IGW should be inside the public subnet. Anything that is inside the public subnet that has the IGW has a public IP that ANYONE can see and access.
Moreover, for a private subnet, a private instance, sometimes you need to download stuff from the Internet, but do not want to expose your own IP because you only have one IP, and it is private. Therefore, you need a NAT gateway. 
The NAT gateway alone cannot access the Internet if placed in the private subnet; thus, the NAT gateway has to have access from the IGW routable back into NAT and back into the private instance.
```
Internet > IGW > NAT > Private Subnet/Instance
Analogy: Chef > Waiter > Customer
```
- Both the public subnet & public route table have an IGW.
- While both the private subnet & private route table have a NAT gateway. 
<br> In simple terms, a NAT gateway stays in the public subnet because the public subnet also has IGW or Internet access. The private subnet and its instances only take the NAT IP and its ID to use, since that is NAT’s responsibility, to provide data on behalf of the private client.

# Internet gateway
Initially, both public and private instances cannot connect to the Internet. So we need the Internet Gateway & Network Address Translation Gateway. 
<br><img width="1917" height="614" alt="Screenshot 2026-01-26 145836" src="https://github.com/user-attachments/assets/d2ba015a-c832-41e5-baa4-cba9d0c79863" />

Here are the steps:
<br><img width="1578" height="525" alt="Screenshot 2026-01-26 144944" src="https://github.com/user-attachments/assets/59a0232c-cbbe-414c-b643-76f9c66fad66" />

Need a route table that manages where the traffic goes:
<br><img width="1614" height="358" alt="Screenshot 2026-01-26 145135" src="https://github.com/user-attachments/assets/d74ae26b-ee60-4457-9797-9cdbd2d72432" />

From the public subnet, there’s already a route table to the private network. But now we need a new routing table to connect to the Internet. 
<br><img width="1911" height="756" alt="Screenshot 2026-01-26 145310" src="https://github.com/user-attachments/assets/e273d414-a7c8-475b-9dff-299fe2807b06" />

By default, it will connect to the private VPC IP. Now, add and connect to the Internet gateway for Internet access.
<br><img width="1919" height="515" alt="Screenshot 2026-01-26 145431" src="https://github.com/user-attachments/assets/5b48c677-4388-4255-b016-6a0f164d6c0e" />

Next, go to Public subnet and edit routable:
<br><img width="1919" height="662" alt="Screenshot 2026-01-26 145608" src="https://github.com/user-attachments/assets/01bcfcdc-84ab-4acc-8c29-bab94cd5a246" />

Now, it should work.
<br><img width="1613" height="896" alt="Screenshot 2026-01-26 145706" src="https://github.com/user-attachments/assets/736af4b1-1ea4-4752-933e-b13f368bbcb0" />

Now, the public subnet is public on the Internet, and the private subnet is still private.
Next, on the reverse proxy CLI (public instance), install nginx.
```
sudo apt update && sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx
sudo systemctl status nginx
```
