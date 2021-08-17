FROM node:14

WORKDIR /app

COPY package.json .

RUN npm install
RUN npm install -g typescript

COPY . .

CMD ["npm", "start"]
