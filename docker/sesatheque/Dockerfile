# cf https://github.com/docker-library/official-images/blob/master/library/node
FROM node:10

# cf https://github.com/nodejs/docker-node/blob/master/docs/BestPractices.md#upgradingdowngrading-yarn
ENV YARN_VERSION 1.10.1

RUN curl -fSLO --compressed "https://yarnpkg.com/downloads/$YARN_VERSION/yarn-v$YARN_VERSION.tar.gz" \
    && tar -xzf yarn-v$YARN_VERSION.tar.gz -C /opt/ \
    && ln -snf /opt/yarn-v$YARN_VERSION/bin/yarn /usr/local/bin/yarn \
    && ln -snf /opt/yarn-v$YARN_VERSION/bin/yarnpkg /usr/local/bin/yarnpkg \
    && rm yarn-v$YARN_VERSION.tar.gz

WORKDIR /sesatheque

RUN yarn config set cache-folder /sesatheque/.cache/yarn

# le reste est fait au runtime, cf docker-compose.yml
