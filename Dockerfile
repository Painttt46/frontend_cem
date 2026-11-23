FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# ระบุเวอร์ชันตรง ๆ: nginx:alpine ที่ค้างในเครื่อง server ไม่อัปเดตเอง (prod เคยค้าง 1.31.6 ที่มีช่องโหว่ HTTP/2 — แก้ใน 1.31.9)
FROM nginx:1.31.9-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY nginx-security-headers.conf /etc/nginx/snippets/security-headers.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
