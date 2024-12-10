FROM node:18
WORKDIR /app

# Install wait-for-it
RUN apt-get update && apt-get install -y wget
RUN wget https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh -O /wait-for-it.sh
RUN chmod +x /wait-for-it.sh

COPY package*.json ./
RUN npm install
RUN npm install jsonwebtoken
RUN npm install bcryptjs

COPY . .
EXPOSE 3000

CMD ["/wait-for-it.sh", "db_SCS390:3306", "--", "node", "index.js"]