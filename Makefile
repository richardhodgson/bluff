SHELL = /bin/bash

./node_modules:
	npm install

test: ./node_modules
	./node_modules/.bin/litmus tests/suite.js

deploy:
	@ if [ -z "$(shell git remote | grep rhc-preview)" ]; then \
		git remote add rhc-preview ssh://529a1f7b4382ec44eb000276@preview-bluff.rhcloud.com/~/git/preview.git; \
	fi
	git push rhc-preview circles:master

deploy-live:
	@ if [ -z "$(shell git remote | grep rhc-live)" ]; then \
		git remote add rhc-live ssh://0a0e49b9001141e5b2faa428d2cd22a6@live-bluff.rhcloud.com/~/git/live.git; \
	fi
	git push rhc-live master

server: ./node_modules
	@ export BLUFF_DB_NAME=bluff; \
	echo "Starting bluff on 0.0.0.0:8090"; \
	node server.js