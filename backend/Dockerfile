FROM node:20-slim

WORKDIR /app

# Install dependencies first for better caching
COPY package*.json ./
RUN npm install --production

# Copy application source code
COPY . .

# Expose Cloud Run default port
EXPOSE 8080

# Start the Express server
CMD ["npm", "start"]
