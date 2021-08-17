source .env
sudo docker build -t memery-server-$NODE_ENV .
sudo docker 2>/dev/null stop memery-server-$NODE_ENV-container | true
sudo docker 2>/dev/null rm memery-server-$NODE_ENV-container | true
sudo docker run -d -p $PORT:$PORT --name memery-server-$NODE_ENV-container memery-server-$NODE_ENV
sudo docker 2>/dev/null rmi `sudo docker images --filter dangling=true -q` | true