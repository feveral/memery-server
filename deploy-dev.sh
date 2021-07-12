source .env
sudo docker build -t memery-server-dev .
sudo docker 2>/dev/null stop memery-server-dev-container | true
sudo docker 2>/dev/null rm memery-server-dev-container | true
sudo docker run -d -p $PORT:$PORT --name memery-server-dev-container memery-server-dev
sudo docker 2>/dev/null rmi `sudo docker images --filter dangling=true -q` | true