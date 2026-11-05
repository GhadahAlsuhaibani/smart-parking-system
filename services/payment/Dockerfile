# Use Node.js 20, which includes the built-in fetch API used by the services.
FROM node:20-alpine

# Set the working directory inside the container.
WORKDIR /app

# Install the shared Express dependency from the project root.
COPY package*.json ./
RUN npm install --omit=dev

# Copy this microservice's JavaScript file.
COPY lib/metrics.js ./lib/metrics.js
COPY services/payment/server.js ./services/payment/server.js

# Expose the port used by this service.
EXPOSE 3004

# Start the service.
CMD ["node", "services/payment/server.js"]
