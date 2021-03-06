FROM node:12.9-alpine as builder

WORKDIR /build

COPY package*json ./

RUN npm i --no-optional --no-audit --silent

COPY . .

RUN npm run build

RUN ls -A | grep -v dist | xargs rm -rf &&  find dist -type d -name '__*' -exec rm -r {} +;

##

FROM node:12.9-alpine

WORKDIR /app

COPY package*json ./
RUN npm i --production --no-optional --no-audit --silent

COPY --from=builder /build/dist/src ./src

ENV USER=normal-user
RUN adduser --disabled-password --gecos "" $USER
USER $USER

CMD npm run start:compiled
