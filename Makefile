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

test: ./node_modules mongo-check
	./node_modules/.bin/litmus tests/suite.js

../joyent:
	git clone ssh://richard@september.mine.nu/repos/joyent ../joyent

deploy : test ../joyent
	make -f ../joyent/Makefile site=bluff deploy
