FROM python:3.10-slim

WORKDIR /app

# Install Node.js (v18) and system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    gnupg \
    build-essential \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy python dependencies and install them
COPY engine/requirements.txt ./engine/requirements.txt
RUN pip install --no-cache-dir -r engine/requirements.txt

# Copy server dependency configuration and install
COPY server/package*.json ./server/
RUN cd server && npm ci

# Copy client dependency configuration and install
COPY client/package*.json ./client/
RUN cd client && npm ci

# Copy the rest of the application files
COPY . .

# Build the frontend React app
RUN npm run build:client

# Expose port 3000
EXPOSE 3000

# Set environment variable to specify python3 usage
ENV PYTHON_PATH=python3
ENV PORT=3000

# Run the backend server
CMD ["node", "server/server.js"]
