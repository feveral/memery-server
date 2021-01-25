FROM node:14

WORKDIR /usr/src/app

COPY package*.json ./

# install node package dependencies
RUN npm ci --only=production

# app source
COPY . .

EXPOSE 3000

RUN npm install pm2 -g
CMD ["pm2-runtime", "start", "npm", "--name", "memery-server", "--", "start"]
