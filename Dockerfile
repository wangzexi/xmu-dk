FROM mcr.microsoft.com/playwright:bionic

RUN ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime \
  && echo 'Asia/Shanghai' >/etc/timezone

RUN apt-get update \
  && apt-get install -y ttf-wqy-zenhei \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json ./
RUN npm install --registry=https://registry.npmmirror.com --disturl=https://npmmirror.com/mirrors/node \
  && npm cache clean --force

COPY index.js ./

ENTRYPOINT ["npm", "start", "--"]
