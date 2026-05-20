FROM node:22

WORKDIR /app

# Copy dependency files
COPY package*.json ./

# ✅ Use npmmirror.com instead of npmjs.org to avoid ECONNRESET
RUN npm config set registry https://registry.npmmirror.com/ \
    && npm config set fetch-retries 5 \
    && npm config set fetch-retry-factor 2 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000 \
    && if [ -f package-lock.json ]; then npm ci --prefer-offline; else npm install --legacy-peer-deps --prefer-offline; fi

# Copy frontend code
COPY . .

EXPOSE 5173
CMD ["npm", "run", "dev"]

