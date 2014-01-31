SHELL = /bin/bash

import-and-patch-impress:
	curl --progress-bar https://raw.github.com/bartaz/impress.js/master/js/impress.js \
	| sed -e 's/document.body/document.documentElement/' \
	> ./static/script/vendor/impress.js \
	#see https://github.com/bartaz/impress.js/issues/113

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
	@ if [ -z "$(shell git remote | grep rhc-production)" ]; then \
		git remote add rhc-production ssh://52e82eae5973ca7a8b00005e@production-bluff.rhcloud.com/~/git/production.git; \
	fi
	git push rhc-production master

server: ./node_modules
	@ export BLUFF_DB_NAME=bluff; \
	echo "Starting bluff on 0.0.0.0:8090"; \
	node server.js

dev: ./node_modules
	@ export BLUFF_DB_NAME=bluff; \
	echo "Starting bluff for development on 0.0.0.0:8090"; \
	./node_modules/.bin/proton --reload --port 8090

openshift-db-backup: -backup-path
	@ mongoexport --host "$OPENSHIFT_MONGODB_DB_HOST" --port "$OPENSHIFT_MONGODB_DB_PORT" --db bluff -o "$(BACKUP_PATH)" --collection presentations

openshift-db-restore: -backup-path
	@ mongoimport -d "$BLUFF_DB_NAME" -c presentation --file "$(BACKUP_PATH)" --host "$OPENSHIFT_MONGODB_DB_HOST" --port "$OPENSHIFT_MONGODB_DB_PORT" --username "$OPENSHIFT_MONGODB_DB_USERNAME" --password "$OPENSHIFT_MONGODB_DB_PASSWORD"

-backup-path:
	@ if [ -z "$(BACKUP_PATH)" ]; then \
		echo "BACKUP_PATH parameter not defined" >&2; \
		exit 1; \
	fi

.PHONY: test deploy deploy-live server dev openshift-db-backup openshift-db-restore -backup-path