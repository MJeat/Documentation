# Goal:
We can test 2 approaches:
- HTML & CSS (Frontend), Node.js (Backend)
- React.js (Frontend) & Node.js (Backend) – (Abandon)

We test the first approach first, then we can swap the approach 1 frontend with the approach 2 frohttps://github.com/MJeat/Documentation/blob/main/Cyber-Projects/AWS-Mini-Enterprise-Production-Setup/Github-Version/3-Building-FullStack-System.mdntend (React.js).

==================================================================

# Review System Info
- Nginx acts as a Reverse Proxy in the Public Subnet to handle incoming traffic, while Apache2 runs the Backend API in the Private Subnet. The backend communicates with RDS MySQL and uses a NAT Gateway for outbound updates.
## Proxy Types

In my setup, I actually have two different types of proxies working for different reasons:
- The Reverse Proxy (Nginx/Apache): * Likely sitting on your Backend EC2 instance.
  - Purpose: It "fronts" your Node.js app. When a user hits your IP on port 80 (HTTP), Nginx receives the request and "proxies" it to your backend app running on a different port (like 3000 or 5000).
  - Why? It handles security, SSL, and buffering better than Node.js does directly.
- The NAT Gateway (Forward Proxy Behavior): * Sitting in your Public Subnet.
  - Purpose: It allows your Private Instance (like your Database or a private Backend) to go out to the internet to download updates or talk to Elastic Fleet without letting the internet come in.

# Programming Language
- In my frontend, I used HTML, CSS, and JS.
- In my backend, I used Node.js and Express.js. 
<br> We used Express, AWS SDK, and MySQL2. Reasons can be found at the bottom of this documentation called Reason Approach #1. 
==================================================================
# Approach #1
- HTML & CSS (Frontend), Node.js (Backend)
## Frontend (Public Instance / Reverse Proxy)
```
<!DOCTYPE html>
<html>
<head>
    <title>Company Cloud Drive</title>
    <style>
        body { font-family: sans-serif; background: #f0f2f5; padding: 50px; }
        .box { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
        input, button { padding: 10px; margin: 5px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
    </style>
</head>
<body>
    <div class="box">
        <h2>🚀 Company File Manager</h2>
        
        <input type="file" id="fileInput">
        <button onclick="uploadFile()">Upload</button>

        <hr>
        <input type="text" id="searchBox" placeholder="Search files..." oninput="loadFiles()">
        
        <table id="fileTable">
            <thead><tr><th>File</th><th>Link</th><th>Action</th></tr></thead>
            <tbody></tbody>
        </table>
    </div>

    <script>
        const API_URL = "http://[PRIVATE-INSTANCE-INTERNAL-IP]:3000/api";  <!-- EC2 Service > Instances > Click your Private Instance > Look for Private IPv4 address (usually starts with 10.x.x.x or 172.x.x.x). -->

        async function loadFiles() {
            const search = document.getElementById('searchBox').value;
            const res = await fetch(`${API_URL}/files?search=${search}`);
            const files = await res.json();
            const tbody = document.querySelector('#fileTable tbody');
            tbody.innerHTML = files.map(f => `
                <tr>
                    <td>${f.filename}</td>
                    <td><a href="${f.s3_url}" target="_blank">View</a></td>
                    <td><button onclick="deleteFile(${f.id})" style="color:red">Delete</button></td>
                </tr>
            `).join('');
        }

        async function uploadFile() {
            const file = document.getElementById('fileInput').files[0];
            const formData = new FormData();
            formData.append('file', file);
            await fetch(`${API_URL}/upload`, { method: 'POST', body: formData });
            loadFiles();
        }

        async function deleteFile(id) {
            await fetch(`${API_URL}/delete/${id}`, { method: 'DELETE' });
            loadFiles();
        }

        loadFiles(); // Initial load
    </script>
</body>
</html>

```

## Backend (Private Instance/Server)
```
mkdir company-api && cd company-api
sudo apt install npm -y
npm init -y
npm install express mysql2 @aws-sdk/client-s3 multer
```

Then,
```
node -v (check version)
ls
```
You should see these files:
<br> <img width="450" height="122" alt="Screenshot 2026-02-09 194509" src="https://github.com/user-attachments/assets/cc2fb884-31b6-422c-8e3a-a97d543c81d7" />

Next, create
```
vi server.js
```
==(Click i to start editing)==>

```
const express = require('express');                                                                                                                                                                                                     
const mysql = require('mysql2');                                                                                                                                                                                                        
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');                                                                                                                                              
const multer = require('multer');                                                                                                                                                                                                       
                                                                                                                                                                                                                                       
const app = express();                                                                                                                                                                                                                  
const upload = multer({ storage: multer.memoryStorage() });                                                                                                                                                                             
                                                                                                                                                                                                                                       
// =============================                                                                                                                                                                                                        
// CONFIG                                                                                                                                                                                                                               
// =============================                                                                                                                                                                                                        
                                                                                                                                                                                                                                       
const BUCKET = "company-storage-network-project";                                                                                                                                                                                       
                                                                                                                                                                                                                                       
const s3 = new S3Client({                                                                                                                                                                                                               
   region: "{INSERT-YOUR-REGION}"                                                                                                                                                                                                                 
   // Using IAM Role on the EC2 instance — do NOT hardcode keys.Go to Amazon S3 > General Purpose Buckets > Your-bucket > AWS Region                                                                                                                                                                        
});                                                                                                                                                                                                                                     
                                                                                                                                                                                                                                       
const db = mysql.createConnection({                                                                                                                                                                                                     
   host: '{INSERT-DB-ENDPOINT}', // RDS Service > Databases > Click your DB > Connectivity & Security tab (e.g., company-db.xyz.us-east-1.rds.amazonaws.com)                                                                                                                                                                        
   user: 'admin',                                                                                                                                                                                                                      
   password: '{INSERT-DB-PASSWORD}',                                                                                                                                                                                                      
   database: '{INSERT-DB-NAME}' // You can find this after login via private instance CLI and type: “show databases;” It is located at the first row.                                                                                                                                                                                                       
});                                                                                                                                                                                                                                     
                                                                                                                                                                                                                                       
db.connect(err => {                                                                                                                                                                                                                     
   if (err) {                                                                                                                                                                                                                          
       console.error("DB connection failed:", err);                                                                                                                                                                                    
       process.exit(1);                                                                                                                                                                                                                
   }                                                                                                                                                                                                                                   
   console.log("✅ Database connected");                                                                                                                                                                                               
});                                                                                                                                                                                                                                     
                                                                                                                                                                                                                                       
app.use(express.json());                                                                                                                                                                                                                
                                                                                                                                                                                                                                       
// Logger                                                                                                                                                                                                                               
app.use((req, res, next) => {                                                                                                                                                                                                           
   console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);                                                                                                                                                              
   next();                                                                                                                                                                                                                             
});                                                                                                                                                                                                                                     
                                                                                                                                                                                                                                       
// =============================                                                                                                                                                                                                        
// ROUTES                                                                                                                                                                                                                               
// =============================                                                                                                                                                                                                        
                                                                                                                                                                                                                                       
// GET FILES (Search)                                                                                                                                                                                                                   
app.get('/api/files', (req, res) => {                                                                                                                                                                                                   
   const search = req.query.search || '';                                                                                                                                                                                              
   const sql = `                                                                                                                                                                                                                       
       SELECT id, filename, s3_url, upload_date                                                                                                                                                                                        
       FROM uploads                                                                                                                                                                                                                    
       WHERE filename LIKE ?                                                                                                                                                                                                           
       ORDER BY upload_date DESC                                                                                                                                                                                                       
   `;                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                       
   db.query(sql, [`%${search}%`], (err, results) => {                                                                                                                                                                                  
       if (err) return res.status(500).json({ error: err.message });                                                                                                                                                                   
       res.json(results);                                                                                                                                                                                                              
   });                                                                                                                                                                                                                                 
});                                                                                                                                                                                                                                     
                                                                                                                                                                                                                                       
// UPLOAD FILE                                                                                                                                                                                                                          
app.post('/api/upload', upload.single('file'), async (req, res) => {                                                                                                                                                                    
   if (!req.file) return res.status(400).json({ error: "No file uploaded" });                                                                                                                                                          
                                                                                                                                                                                                                                       
   const file = req.file;                                                                                                                                                                                                              
   // Make S3 key unique to avoid overwriting                                                                                                                                                                                          
   const key = `${Date.now()}-${file.originalname}`;                                                                                                                                                                                   
                                                                                                                                                                                                                                       
   try {                                                                                                                                                                                                                               
       // Upload to S3                                                                                                                                                                                                                 
       await s3.send(new PutObjectCommand({                                                                                                                                                                                            
           Bucket: BUCKET,                                                                                                                                                                                                             
           Key: key,                                                                                                                                                                                                                   
           Body: file.buffer,                                                                                                                                                                                                          
           ContentType: file.mimetype                                                                                                                                                                                                  
       }));                                                                                                                                                                                                                            
                                                                                                                                                                                                                                       
       const s3Url = `https://${BUCKET}.s3.amazonaws.com/${key}`;                                                                                                                                                                      
                                                                                                                                                                                                                                       
       // Save metadata in DB (only columns we have)                                                                                                                                                                                   
       const sql = "INSERT INTO uploads (filename, s3_url) VALUES (?, ?)";                                                                                                                                                             
       db.query(sql, [file.originalname, s3Url], (err) => {                                                                                                                                                                            
           if (err) return res.status(500).json({ error: err.message });                                                                                                                                                               
           res.json({ message: "Upload successful", file: { filename: file.originalname, s3_url: s3Url } });                                                                                                                           
       });                                                                                                                                                                                                                             
                                                                                                                                                                                                                                       
   } catch (err) {                                                                                                                                                                                                                     
       console.error(err);                                                                                                                                                                                                             
       res.status(500).json({ error: err.message });                                                                                                                                                                                   
   }                                                                                                                                                                                                                                   
});                                                                                                                                                                                                                                     
                                                                                                                                                                                                                                       
// DELETE FILE                                                                                                                                                                                                                          
app.delete('/api/files/:id', (req, res) => {                                                                                                                                                                                            
   const id = req.params.id;                                                                                                                                                                                                           
                                                                                                                                                                                                                                       
   db.query("SELECT s3_url FROM uploads WHERE id = ?", [id], async (err, results) => {                                                                                                                                                 
       if (err) return res.status(500).json({ error: err.message });                                                                                                                                                                   
       if (results.length === 0)                                                                                                                                                                                                       
           return res.status(404).json({ error: "File not found" });                                                                                                                                                                   
                                                                                                                                                                                                                                       
       const s3Url = results[0].s3_url;                                                                                                                                                                                                
       const key = s3Url.split('.com/')[1];                                                                                                                                                                                            
                                                                                                                                                                                                                                       
       try {                                                                                                                                                                                                                           
           // Delete from S3                                                                                                                                                                                                           
           await s3.send(new DeleteObjectCommand({                                                                                                                                                                                     
               Bucket: BUCKET,                                                                                                                                                                                                         
               Key: key                                                                                                                                                                                                                
           }));                                                                                                                                                                                                                        
                                                                                                                                                                                                                                       
           // Delete from DB                                                                                                                                                                                                           
           db.query("DELETE FROM uploads WHERE id = ?", [id], (err) => {                                                                                                                                                               
               if (err) return res.status(500).json({ error: err.message });                                                                                                                                                           
               res.json({ message: "Deleted successfully" });                                                                                                                                                                          
           });                                                                                                                                                                                                                         
                                                                                                                                                                                                                                       
       } catch (err) {                                                                                                                                                                                                                 
           res.status(500).json({ error: err.message });                                                                                                                                                                               
       }                                                                                                                                                                                                                               
   });                                                                                                                                                                                                                                 
});                                                                                                                                                                                                                                     
                                                                                                                                                                                                                                       
// =============================                                                                                                                                                                                                        
                                                                                                                                                                                                                                       
app.listen(3000, '0.0.0.0', () => {                                                                                                                                                                                                     
   console.log("✅ API running on port 3000");                                                                                                                                                                                         
});
```

**Note:** <br>
For the database name, this is where you should get it from:
<br> <img width="277" height="313" alt="Screenshot 2026-02-10 210242" src="https://github.com/user-attachments/assets/53a74ddc-dcd2-4cc2-948e-17223626f622" />

It is the first one appear when you first enter mysql console. After editing server.js, exit by typing (Esc > :x)

After copy-pasting codes, run this on ur Private Instance:
```
node server.js
```
You should see this:
<br> <img width="806" height="310" alt="Screenshot 2026-02-10 205953" src="https://github.com/user-attachments/assets/ae4c1b28-f6bf-45c4-bf42-0c52871c1ca5" />

## Back on the Public Instance:
We need to configure the nginx system to talk to the private instance web server.
```
sudo nano /etc/nginx/sites-available/default
```
===>
```
server_name _;

        # 1. THE FRONTEND (Serve index.html from this Public Instance)
        location / {
                root /var/www/html;
                index index.html;
                try_files $uri $uri/ =404;
        }

        # 2. THE BACKEND (Send /api calls to the Private Instance)
        location /api/ {
                proxy_pass http://10.0.2.37:3000/api/;
                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }
```
Save & exit. Then:

Follow by:
```
sudo chown www-data:www-data /var/www/html/index.html
sudo chmod 644 /var/www/html/index.html
```
Then, open the public instance IP. 
**Result:**

<br><img width="1410" height="634" alt="Screenshot 2026-02-10 210822" src="https://github.com/user-attachments/assets/949e681d-a774-4e58-9c68-278f61e41f15" />

# Reasons Approach #1:
**Why are we using express, aws sdk, and mysql2 here?**
When you're building a professional application, you don't want to "reinvent the wheel." These three libraries are the industry-standard "tools" that allow your Node.js code to talk to the outside world. Think of Node.js as the engine of a car. It provides the power, but it doesn't have a steering wheel, seats, or a GPS. These libraries provide those parts:

**1. Express (The "Steering Wheel" & "Dashboard")**
- Why? Pure Node.js is very difficult to use for web servers. If you used pure Node, you would have to manually write code to figure out if a user is visiting /upload or /delete, and manually parse every chunk of data they send.
- What it does: It provides Routing. It allows you to simply say app.get('/search', ...) or app.post('/upload', ...). It makes your code readable and organized.

**2. AWS SDK (The "Universal Key")**
- Why? S3 is a secure, complex storage system. You can't just "send" a file to it like a regular folder. It requires specific encryption, headers, and authentication protocols (SigV4).
- What it does: It’s the official library built by Amazon. It handles the Authentication (using your IAM Role automatically) and the Communication logic. Instead of writing 100 lines of code to send a file, you just use s3.send(new PutObjectCommand(...)).

**3. MySQL2 (The "Translator")**
- Why? Databases speak SQL, and Node.js speaks JavaScript. You need a driver to bridge that gap.
- Why mysql2 instead of the older mysql?
  - Promises: It supports async/await, which makes your code look clean and modern (instead of "callback hell").
  - Security: It has built-in support for Prepared Statements. This is critical because it prevents "SQL Injection" (where a hacker types a command into your search bar to delete your whole database).
  - Performance: It is faster and uses less memory than the original version.

# Issue – Nginx Configuration
<br> There was a time when these issues appeared. It was miserable. It took me about 3 days + 1 day of building the MySQL service to use it locally, mimicking this project, which is on the cloud. The issue has to do with the nginx configuration.

<br> <img width="893" height="329" alt="Screenshot 2026-02-10 214257" src="https://github.com/user-attachments/assets/dcedb129-534b-4968-bec0-28e4ef368e5e" />
<img width="732" height="211" alt="Screenshot 2026-02-10 214725" src="https://github.com/user-attachments/assets/aef28793-2b2a-4659-8240-74426c4208f0" />

## Solve:
The issue was with the nginx configuration. In the public instance, check the nginx configuration file. Go to this CLI: sudo nano /etc/nginx/sites-available/default. This is how the nginx config file should look: 
```
# Default server configuration                                                                                                                                                                                                                                                                                                                                                                                                                                     
server {                                                                                                                                                                                                                                
      listen 80 default_server;                                                                                                                                                                                                       
      listen [::]:80 default_server;        
                                                                                                                                                                                                                                                                                                                                                                                                                
      root /var/www/html;                                                                                                                                                                                                             
                                                                                                                                                                                                                                                                                                                                                                          
      index index.html index.htm index.nginx-debian.html;                                                                                                                                                                             
                                                                                                                                                                                                                                       
      server_name _;                                                                                                                                                                                                                  
                                                                                                                                                                                                                                       
      # Serve the HTML                                                                                                                                                                                                                
      location / {                                                                                                                                                                                                                    
              #root /var/www/html;                                                                                                                                                                                                    
              #index index.html;                                                                                                                                                                                                      
              try_files $uri /index.html;                                                                                                                                                                                             
      }                                                                                                                                                                                                                               
                                                                                                                                                                                                                                       
      # 1. THE REVERSE PROXY LOGIC | Proxy the API calls                                                                                                                                                                              
       location /api/ {                                                                                                                                                                                                                
      # Replace 10.0.2.XXX with your Private Instance's ACTUAL Private                                                                                                                                                               
              proxy_pass http://10.0.2.37:3000;
# Standard Proxy Headers                                                                                                                                                                                                        
              proxy_set_header Host $host;                                                                                                                                                                                            
              proxy_set_header X-Real-IP $remote_addr;                                                                                                                                                                                
      }
```

**In the public instance**
```
curl http://10.0.2.37:3000/api/files
```
If it shows “[]”, it means:
- ✅ Backend is working
- ✅ Private EC2 reachable
- ✅ Node is running
- ✅ Security group is already allowing traffic

So your infrastructure is fine. Your problem is 100% NGINX config.

Make sure that these two are correctly communicating and programmed. 
- server.js
- index.html
Make sure the Private Instance inbound rule is set to:
- Custom TCP
- Range port: 3000
- Source: Public Instance EC2 SG (Reverse Proxy)

<br><img width="1914" height="747" alt="Screenshot 2026-02-14 113818" src="https://github.com/user-attachments/assets/ac5237a7-5038-41bc-9123-fa213ab4f909" />

Without this security group, no logs or error logs will appear in S3, server.js, and the browser developer console. This is the fixed result.

<br> <img width="1652" height="661" alt="Screenshot 2026-02-14 113548" src="https://github.com/user-attachments/assets/e8fc119c-eed6-4615-8136-f643aad1b1b9" />


# Result #1:
- Status: Success
After uploading a file:
<br> <img width="1919" height="1025" alt="Screenshot 2026-02-14 114529" src="https://github.com/user-attachments/assets/0783bc9b-d1a9-481b-a009-28e355e27c33" />
<img width="376" height="181" alt="Screenshot 2026-02-14 114550" src="https://github.com/user-attachments/assets/48f58cce-f072-42da-9351-d5fd9bbc173b" />

## Check with S3:
Before
<br><img width="1831" height="463" alt="Screenshot 2026-02-14 114618" src="https://github.com/user-attachments/assets/d1daed65-e1ab-467e-8e1d-9baa75d350df" />

After:
<br><img width="1708" height="482" alt="Screenshot 2026-02-14 114642" src="https://github.com/user-attachments/assets/8fd96be6-8087-4770-94a0-f30b244c55c7" />

## Check with Database:
<br><img width="1198" height="340" alt="Screenshot 2026-02-14 114725" src="https://github.com/user-attachments/assets/acfc336d-fc1d-4f79-85d9-589398c6cd8b" />


# Suggestion #1: Run server.js onboot
Make server.js run on boot so you don’t have to type it repeatedly. This is for a simple server.
```
cd /home/ubuntu
mkdir company-api/
cd company-api/
sudo nano server.js
```
Copy-paste JS code:
```
{Your-javascript-codes-from-the-top}
```
Save & Exist: 
```
chmod +x server.js
```
Continue with:
```
sudo nano /etc/systemd/system/myscript.service
```
Next, copy-paste this code:

```
[Unit]                                                                                                                                                                                                        
Description=Company API Server                                                                                                                                                                                
After=network.target                                                                                                                                                                                          
                                                                                                                                                                                                             
[Service]                                                                                                                                                                                                     
# Ensure /usr/bin/node is the correct path (check with 'which node')                                                                                                                                          
ExecStart=/usr/bin/node /home/ubuntu/company-api/server.js                                                                                                                                                    
WorkingDirectory=/home/ubuntu/company-api/                                                                                                                                                                    
Restart=always                                                                                                                                                                                                
# Crucial: waits 5s before restarting to prevent the "start-limit-hit" error you saw earlier                                                                                                                  
RestartSec=5                                                                                                                                                                                                  
User=ubuntu                                                                                                                                                                                                   
Environment=NODE_ENV=production                                                                                                                                                                               
                                                                                                                                                                                                             
[Install]                                                                                                                                                                                                     
WantedBy=multi-user.target     
```
<br> <img width="1387" height="509" alt="Screenshot 2026-02-16 124622" src="https://github.com/user-attachments/assets/b33cfc63-2bfd-4f35-8671-b2c254da5f9d" />

Save & Exist, then:
```
sudo systemctl daemon-reload
sudo systemctl start myscript.service
sudo systemctl status myscript.service
```
<br> <img width="1153" height="562" alt="Screenshot 2026-02-16 125339" src="https://github.com/user-attachments/assets/8d82ce84-a209-48eb-8611-06b06c869257" />


In real production, you should save the script files and their modules in the /opt directory. This directory is for hosting servers. Make sure you create another directory to store the server files. In this case, we created a server/ directory. <br>
**Note: You may need to do your own research, as this might flag errors.**

You can create a new server.js or move it into the /opt directory. 

**Moving Method:**
```
sudo mv ~/company-api/package.json /opt/server/
sudo mv ~/company-api/package-lock.json /opt/server/
cd /opt/server
sudo chown -R ubuntu:ubuntu /opt/server
npm install

```

Continue with:
```
sudo nano /etc/systemd/system/myscript.service
```
Copy-paste this code:
```
[Unit]                                                                                                                                                                                                        
Description=Company API Server                                                                                                                                                                                
After=network.target                                                                                                                                                                                          
                                                                                                                                                                                                             
[Service]                                                                                                                                                                                                     
# Ensure /usr/bin/node is the correct path (check with 'which node')                                                                                                                                          
ExecStart=/usr/bin/node /opt/server/server.js                                                                                                                                                    
WorkingDirectory=/opt/server/                                                                                                                                                          
Restart=always                                                                                                                                                                                                
# Crucial: waits 5s before restarting to prevent the "start-limit-hit" error you saw earlier                                                                                                                  
RestartSec=5                                                                                                                                                                                                  
User=ubuntu                                                                                                                                                                                                   
Environment=NODE_ENV=production                                                                                                                                                                               
                                                                                                                                                                                                             
[Install]                                                                                                                                                                                                     
WantedBy=multi-user.target     
```
<br> <img width="1193" height="428" alt="Screenshot 2026-02-16 125212" src="https://github.com/user-attachments/assets/c16c799a-9fe3-498c-80d2-c0113612cb60" />
<br> **Note: Careful. There are changes at ExecStart and WorkingDirectory**

Then, 
```
sudo systemctl daemon-reload
sudo systemctl start myscript.service
sudo systemctl status myscript.service
```
Troubleshooting or watching logs:
```
journalctl -u myscript.service -f
```

Now, the server.js will run forever. Real web server. You can test this by closing Tabby or PuTTY. Then, refresh your web page and try uploading or interacting with the features. It should work just fine. 

# END
