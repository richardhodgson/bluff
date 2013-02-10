SHELL = /bin/bash
MONGO_CHECK = $(shell ps -ef | grep mongodb | grep -v grep)

mongo-check:
	@ if [ -z "$(MONGO_CHECK)" ]; then \
		echo "Cannot find mongo on default port 27017"; \
		exit 1; \
	else \
		echo "Using Mongo running on port 27017..."; \
	fi

./node_modules:
	npm install

test: ./node_modules
	./node_modules/.bin/litmus tests/suite.js

deploy:
	@ if [ -z "$(shell git remote | grep rhc)" ]; then \
		git remote add rhc ssh://0a0e49b9001141e5b2faa428d2cd22a6@live-bluff.rhcloud.com/~/git/live.git; \
	fi
	git push rhc master

server: ./node_modules
	@ export BLUFF_DB_NAME=bluff; \
	echo "Starting bluff on 0.0.0.0:8090"; \
	node server.js