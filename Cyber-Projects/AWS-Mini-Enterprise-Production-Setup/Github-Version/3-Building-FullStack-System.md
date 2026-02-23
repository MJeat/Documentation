# Goal:
We can test 2 approaches:
- HTML & CSS (Frontend), Node.js (Backend)
- React.js (Frontend) & Node.js (Backend) – (Abandon)

We test the first approach first, then we can swap the approach 1 frontend with the approach 2 frontend (React.js).

==================================================================

# Review System Info
- Nginx acts as a Reverse Proxy in the Public Subnet to handle incoming traffic, while Apache2 runs the Backend API in the Private Subnet. The backend communicates with RDS MySQL and uses a NAT Gateway for outbound updates.
Proxy Typesf

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

