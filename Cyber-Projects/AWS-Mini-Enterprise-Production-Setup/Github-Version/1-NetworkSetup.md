
# 1. VPC
How to create VPC and subnets: [Link](https://www.youtube.com/watch?v=TUTqYEZZUdc) <br>
First, create a VPC
<br><img width="1907" height="785" alt="Screenshot 2026-01-26 141933" src="https://github.com/user-attachments/assets/743cdf86-2b0d-49c7-92a2-47168c59429a" />

Create public subnet & Private subnet:
<br><img width="1604" height="480" alt="Screenshot 2026-01-26 142732" src="https://github.com/user-attachments/assets/a207405e-e9fd-4647-b4e0-a0185146838f" />

# 2. Important Note: This is our goal.
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

# 3. Internet gateway
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

# 4. Private Subnet
Creating a private subnet
Create an AMI image and launch it.
Make sure:
- Company's VPC
- No public IP, since it’s a private subnet
<br><img width="1641" height="720" alt="Screenshot 2026-01-26 165612" src="https://github.com/user-attachments/assets/10e4608e-2a68-4d7c-be97-06e2aa0e1d1d" />

Port and the IP range should be the same as the VPC or ONLY to the public subnet IP. In this case, it is the same as the VPC.
<br><img width="1254" height="660" alt="Screenshot 2026-01-26 163001" src="https://github.com/user-attachments/assets/8c2402c9-6b36-4357-a247-bf1959934c20" />

### Result:
As you can see, it does not have a public IP, but a private IP that can only be used within the VPC.
<br><img width="1283" height="294" alt="Screenshot 2026-01-26 163127" src="https://github.com/user-attachments/assets/945f5edb-2a0f-4906-b6be-e0ceef87597a" />

Only the reverse proxy instance machine that is within the same VPC can communicate with this private server or app. 

## 4.1. Connect from the public instance to the private instance
_(from Public instance)_
Inbound rule: 
- HTTP, Custom, 0.0.0.0/0
- The SSH IP range is your router's public IP. It is safer.
Example: 32.34.390.0/24 for your router's public IP

Outbound: 
- leave it as default (0.0.0.0/0)

_(from Private instance)_
<br><img width="1917" height="727" alt="Screenshot 2026-01-26 203021" src="https://github.com/user-attachments/assets/304f34ff-b8d5-49b9-bb3a-36bb0c24d508" />

Next, from your laptop, copy the .pem SSH key from your laptop to the public instance so that the public instance can talk to the private instance via SSH. Your personal laptop cannot SSH to the private instance because you are not in the same VPC.
_(from your Windows Terminal)_
<br><img width="1171" height="172" alt="Screenshot 2026-01-26 202838" src="https://github.com/user-attachments/assets/04680bcf-6cd8-42f1-bd8e-7d4515cde98b" />

Next, from your laptop, open Tabby (or install Tabby first) and connect to the public instance:
_(from your Tabby)_
<br><img width="976" height="451" alt="Screenshot 2026-01-26 202913" src="https://github.com/user-attachments/assets/a21e981f-55a8-49e6-ade0-3c50abfc5e17" />

Next, open a tabby terminal in a folder that contains the private-key.pem and the load-balancer.pem
Next, use this command.** Just change the name of the .pem file:**
```
scp -i \.load-balancer.pem private-key.pem ubuntu@{public-IP-from-public-instance}:/home/ubuntu
```

This should upload the private-key.pem to the public instance because ONLY the public instance can communicate with the private subnet/instance because both are within the same VPC.
Inside the public instance CLI, type these commands:
```
ls 
chmod 400 private-key.pem
ssh -i private-key.pem ubuntu@{private-IP-from-private-instance}
```

If you don’t follow, you get these errors:
<br><img width="734" height="401" alt="Screenshot 2026-01-26 194445" src="https://github.com/user-attachments/assets/96a3253b-18df-45da-8eed-6aa35659368b" />

After you enter the private instance CLI, you cannot have access to the internet; thus, you cannot download or update the system. That’s why we need to configure a NAT gateway ontop of the Internet gateway. Without the NAT gateway, you will experience this:
<br> <img width="1920" height="1080" alt="Screenshot (503)" src="https://github.com/user-attachments/assets/c83a5d14-ddf1-4635-bb20-b44c83ce1209" />

# 5. NAT Gateway Configuration
Set up NAT Gateway: [Link](https://www.youtube.com/watch?v=Iqzgu5UEDKo)
- Create NAT Gateway
- In the Private Subnet, & routable: add the NAT gateway IP and its ID
- Just watch the video or refer to the Important Note at the top of this documentation.

Then, restart the private instance and update again. It should work and have access to the internet. 

**On the private instance:**
Next, ``` sudo apt install apache2 -y ```
(Yes, the public instance uses nginx and the private uses Apache. It is normal.) 
Then, configure the private instance and its html files. 
```
sudo apt update
sudo apt install -y apache2
echo "<h1>Project Success: I am the Private Server</h1>" | sudo tee /var/www/html/index.html
```

**Back to the public instance (connect the public instance to open/display publicly):**
```
sudo nano /etc/nginx/sites-available/default
```
Change the original to this (or ignore the comments): 
```
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    root /var/www/html;
    index index.html index.htm;

    server_name _;

    # 1. THE REVERSE PROXY LOGIC
    location / {
        # Replace 10.0.2.XXX with your Private Instance's ACTUAL Private IP
        proxy_pass http://10.0.2.XXX; 
        
        # Standard Proxy Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        # 2. THE "FAIL" LOGIC
        # This tells Nginx: if the private server gives an error, use our custom page
        proxy_intercept_errors on;
    }

    # 3. CUSTOM ERROR MESSAGE
    # If the private server is down (502) or timed out (504), show this page
    error_page 404 500 502 503 504 /custom_error.html;
    location = /custom_error.html {
        root /var/www/html;
        internal;
    }
}
```
Save and exit.

**Create an error-handling file:**
```
sudo nano /var/www/html/custom_error.html
```
Add this:
```
<html>
<body style="text-align: center; font-family: sans-serif; padding-top: 50px;">
    <h1>⚠️ Something is Wrong at the Public Instance</h1>
    <p>I am the Reverse Proxy. I am working, but I cannot reach the Private Web Server. Check /var/www/html/</p>
</body>
</html>
```
Save and exit.

Check typos: ```sudo nginx -t```
Restart: ```sudo systemctl restart nginx ```

Lastly, get the public IP from the public instance and enter it in the search browser. You should see the text that says, ``` “Project Success: I am the Private Server” ```
<br><img width="826" height="210" alt="Screenshot 2026-01-26 202209" src="https://github.com/user-attachments/assets/a445960d-7d91-4666-be95-540a70635464" />

**Note: DO NOT OPEN THE WEBSITE USING “open address”. Instead, copy the blue-highlighted IP or copy it. Else the website won’t open or work. **
<br><img width="918" height="245" alt="Screenshot 2026-02-09 191032" src="https://github.com/user-attachments/assets/6c456db7-81c6-41e2-8dc3-e257889c04a7" />

# Verdicts:
- The IP is a public IP. This IP and its machine act as a reverse proxy
- The text is from the private instance/subnet
  - Uses a NAT gateway on top of the Internet gateway
  - Can access the internet, but the Internet cannot access back or is unable to see


# END
