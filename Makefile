
./node_modules/.bin/litmus:
	npm install litmus

test: ./node_modules/.bin/litmus
	./node_modules/.bin/litmus tests/suite.js
