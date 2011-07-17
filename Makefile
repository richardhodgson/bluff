
./node_modules:
	npm install

test: ./node_modules
	./node_modules/.bin/litmus tests/suite.js

../joyent:
	git clone ssh://richard@september.mine.nu/repos/joyent ../joyent

deploy : ../joyent
	make -f ../joyent/Makefile site=bluff deploy
