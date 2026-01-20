FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
# EXPOSE 3004 (adjust port if needed)
CMD ["npm", "start"]
