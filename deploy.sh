source .env
sudo docker build -t memery-server .
sudo docker stop memery-server-container
sudo docker rm memery-server-container
sudo docker run -d -p $PORT:$PORT --name memery-server-container memery-server
sudo docker 2>/dev/null rmi `sudo docker images --filter dangling=true -q` | true