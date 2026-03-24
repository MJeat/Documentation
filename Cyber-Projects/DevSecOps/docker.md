# Instructions & Guides
This is a sample ONLY.
```
mkdir docker-app
cd docker-app/
mkdir frontend backend
```

### Frontend:
Location: `./docker-app/frontend/index.html`

```
<!DOCTYPE html>
<html>
<head>
    <title>Docker App</title>
</head>
<body>
    <h1>Docker Full-Stack Test</h1>
    <div id="response">Waiting for backend...</div>

    <script>
        // Use the public IP of your AWS instance here
        fetch('http://YOUR_AWS_PUBLIC_IP:5001/api/data')
            .then(res => res.json())
            .then(data => {
                document.getElementById('response').innerText = data.message;
            })
            .catch(err => console.error("Error:", err));
    </script>
</body>
</html>
```

### Frontend Dockerfile
Location: `./docker-app/frontend/Dockerfile`

```
FROM nginx:alpine
COPY index.html /usr/share/nginx/html/index.html
EXPOSE 80
```

### Backend:
Location: `./docker-app/backend/server.js`
```
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 5000;

app.use(cors()); // Allow frontend to talk to us

app.get('/api/data', (req, res) => {
    res.json({ message: "Hello from the Dockerized Backend!", status: "Success" });
});

app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
});
```

### Backend Dockerfile
Location: `./docker-app/backend/`
Run:
```
sudo apt npm install -y
sudo npm init -y && npm install express cors
```

Then:
```
FROM node
WORKDIR /app
COPY ./package*.json .
RUN npm install
COPY . .
EXPOSE 5000
CMD ["node","server.js"]
```

### YAMAL File
Location: `./docker-app/docker-compose.yml`
```
version: '3.8'
services:
  backend:
    build: ./backend
    container_name: backend-system
    ports:
      - "5001:5000"

  frontend:
    build: ./frontend
    container_name: frontend-system
    ports:
      - "8080:80"
```
- Port 5001 is the host port, while 5000 is the container port. It means port 5001 forwards the info/request to port 5000. Both bind together.
- Port 8080 is the host port, while 80 is the container port. 

Next, in the same location:
```
docker compose up -d
```

After building the images from the Dockerfile:

<img width="1916" height="801" alt="image" src="https://github.com/user-attachments/assets/9194f8e8-59a3-48fb-be21-2e23011b8498" />


### In Browser
1. In AWS or DigitalOcean
You need to configure 2 inbound rules in your firewall:
- Custom TCP
- Range: 8080
- 0.0.0.0/0 (Anywhere)
- 
Another rule: 
- Custom TCP
- Range: 5001
- 0.0.0.0/0 (Anywhere)
Then, go to browser > type: `{YOUR-PUBLIC-IP}:8080`

2. In your local computer
Go to browser > Type: `localhost:8080`










