FROM node:6
LABEL maintainer "Clout Technologies <git-gatekeeper@clout.tech>"

# Keep upto date
RUN apt-get update

# Tools
RUN npm install -g nodemon

# Provides cached layer for node_modules
ADD package.json /tmp/package.json
RUN cd /tmp && npm install
RUN mkdir -p /src && cp -a /tmp/node_modules /src/

# Copy Files
WORKDIR /src
ADD . /src

ENV PORT=80
ENV HOSTNAME=0.0.0.0

EXPOSE 80
