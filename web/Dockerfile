FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build
EXPOSE 3000
ENV NEXT_TELEMETRY_DISABLED=1
CMD ["npm","run","start"]
