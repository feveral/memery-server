FROM node:14

WORKDIR /app

COPY . .

RUN npm install -g typescript
RUN npm install

CMD ["npm", "start"]
