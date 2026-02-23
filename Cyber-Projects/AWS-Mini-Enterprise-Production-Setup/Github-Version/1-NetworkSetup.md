
# VPC
How to create VPC and subnets: [Link](https://www.youtube.com/watch?v=TUTqYEZZUdc) <br>
First, create a VPC

Create public subnet & Private subnet:




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
