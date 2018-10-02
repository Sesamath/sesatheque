# cf https://github.com/docker-library/official-images/blob/master/library/node
FROM node:10

# cf https://github.com/nodejs/docker-node/blob/master/docs/BestPractices.md#upgradingdowngrading-yarn
ENV YARN_VERSION 1.10.1

RUN curl -fSLO --compressed "https://yarnpkg.com/downloads/$YARN_VERSION/yarn-v$YARN_VERSION.tar.gz" \
    && tar -xzf yarn-v$YARN_VERSION.tar.gz -C /opt/ \
    && ln -snf /opt/yarn-v$YARN_VERSION/bin/yarn /usr/local/bin/yarn \
    && ln -snf /opt/yarn-v$YARN_VERSION/bin/yarnpkg /usr/local/bin/yarnpkg \
    && rm yarn-v$YARN_VERSION.tar.gz

RUN userdel node

ARG UID=1000
RUN useradd --uid $UID --create-home app
USER app

WORKDIR /home/app/sesatheque

# le reste est fait au runtime, cf docker-compose.yml
