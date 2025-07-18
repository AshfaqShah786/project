# Use official Node.js LTS image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first to install dependencies (leveraging Docker cache)
COPY package*.json ./

# Install dependencies (production only)
RUN npm install --production

# Copy app source code
COPY . .

# Expose app port (3000 or your app's port)
EXPOSE 3000

# Start the app
CMD ["node", "index.js"]
