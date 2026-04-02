FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate && npm run build
EXPOSE 8080
ENV PORT=8080
CMD ["node", "dist/index.js"]
