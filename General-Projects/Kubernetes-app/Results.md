# Web is working

<img width="562" height="270" alt="image" src="https://github.com/user-attachments/assets/f2524718-7691-43ef-97e5-6d3ac9b9e795" />


# Testing Autoscaling
Using this command to stress the server to creating more traffic: 
```
kubectl delete pod load-generator --ignore-not-found
kubectl run -i --tty load-generator --rm --image=busybox:1.28 --restart=Never -- /bin/sh -c "for i in 1 2 3 4 5 6 7 8 9 10; do (while true; do wget -q -O- http://webapp-service.default.svc.cluster.local:5000 > /dev/null; done) & done; wait"
```

<img width="847" height="597" alt="image" src="https://github.com/user-attachments/assets/9af079c3-f092-43b1-a90c-5209377e2285" />

As shown in the image, it took 10 minutes to drop back down to 1 container. But we can modify how long it takes to drop down in the `webapp-hpa.yaml` file.



