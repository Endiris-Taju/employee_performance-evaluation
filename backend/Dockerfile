FROM node:22

WORKDIR /app

# Copy package files
COPY package*.json ./

# ✅ npm retry-safe setup + bcryptjs
RUN npm config set registry https://registry.npmjs.org/ \
    && npm config set fetch-retries 5 \
    && npm config set fetch-retry-factor 2 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000 \
    && npm install --legacy-peer-deps bcryptjs

# Copy backend source
COPY . .

EXPOSE 5000
CMD ["npm", "run", "dev"]
