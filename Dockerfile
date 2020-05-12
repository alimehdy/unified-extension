# # Stage 1
# FROM node:latest as node
# WORKDIR /app
# COPY . .
# RUN npm install
# RUN npm run build --prod

# # Stage 2
# FROM nginx:alpine
# COPY --from=node /app/dist/odk-import /usr/share/nginx/html

FROM node:13.13.0-alpine3.10 as build-step
WORKDIR /app
COPY package*.json /app/
# RUN npm install
COPY . /app/
RUN npm run build

FROM nginx:1.17.10-alpine as prod-step
COPY --from=build-step /app/dist/odk-import /usr/share/nginx/html
# COPY /dist/odk-import /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]