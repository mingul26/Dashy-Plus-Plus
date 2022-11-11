FROM node

WORKDIR /src

ADD package.json /src

RUN npm i --silent

ADD . /src

RUN npm run start

CMD npm start