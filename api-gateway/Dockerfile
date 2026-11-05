# Use Node.js 20, which includes the built-in fetch API used by the Gateway.
FROM node:20-alpine

# Set the working directory inside the container.
WORKDIR /app

# Install the shared Express dependency from the project root.
COPY package*.json ./
RUN npm install --omit=dev

# Copy the API Gateway JavaScript file.
COPY lib ./lib
COPY api-gateway/server.js ./api-gateway/server.js

# Expose the Gateway port.
EXPOSE 3000

# Start the Gateway.
CMD ["node", "api-gateway/server.js"]
