FROM ubuntu:22.04

# Prevent interactive prompts
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    make \
    cron \
    ca-certificates \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# -------------------------
# Install Node.js 18
# -------------------------
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs

# -------------------------
# Install Go 1.22
# -------------------------
RUN curl -LO https://go.dev/dl/go1.22.0.linux-amd64.tar.gz \
    && rm -rf /usr/local/go \
    && tar -C /usr/local -xzf go1.22.0.linux-amd64.tar.gz \
    && rm go1.22.0.linux-amd64.tar.gz

ENV PATH="/usr/local/go/bin:${PATH}"

# -------------------------
# Working directory
# -------------------------
WORKDIR /app

# -------------------------
# Clone repository
# -------------------------
# You can also COPY instead if you prefer
COPY . /app/

# -------------------------
# Git identity
# -------------------------
RUN git config --global user.name "Mohammed Arab" \
    && git config --global user.email "mohammed.arab.1881@gmail.com"



RUN chmod +x /app/pipelines/cron.sh


# -------------------------
# Cron job definition
# -------------------------
# Runs every Sunday at 00:00
RUN echo 'PATH=/usr/local/go/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin' > /etc/cron.d/weekly-job \
    && echo "0 0 * * 0 /app/pipelines/cron.sh >> /var/log/cron.log 2>&1" >> /etc/cron.d/weekly-job \
    && chmod 0644 /etc/cron.d/weekly-job \
    && crontab /etc/cron.d/weekly-job

# -------------------------
# Environment variables (runtime-provided)
# -------------------------
ENV WEBAPP_URL=""
ENV MONGODB_URI=""
ENV GEMINI_API_KEY=""

# -------------------------
# Start cron
# -------------------------
CMD ["cron", "-f"]
