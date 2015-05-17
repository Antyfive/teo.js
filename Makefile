TESTS = test/specs/*.js
REPORTER = spec

test:
	@NODE_ENV=test NODE_TLS_REJECT_UNAUTHORIZED=0 ./node_modules/.bin/mocha \
	--require ./test/common.js \
        --compilers js:babel/register \
        --reporter $(REPORTER) \
        --ui bdd \
        --recursive \
        --colors \
        --timeout 5000 \
        --slow 300 \

test-w:
	@NODE_ENV=test NODE_TLS_REJECT_UNAUTHORIZED=0 ./node_modules/.bin/mocha \
	--require ./test/common.js \
        --compilers js:babel/register \
        --reporter min \
        --ui bdd \
        --recursive \
        --colors \
        --timeout 5000 \
        --slow 300 \
        --watch
test-cov:
	 @NODE_ENV=test NODE_TLS_REJECT_UNAUTHORIZED=0 ./node_modules/.bin/mocha \
	 -R spec test/**/* --reporter html-cov > coverage.html

define release
        VERSION=`node -pe "require('./package.json').version"` && \
        NEXT_VERSION=`node -pe "require('semver').inc(\"$$VERSION\", '$(1)')"` && \
        node -e "\
        var j = require('./package.json');\
        j.version = \"$$NEXT_VERSION\";\
        var s = JSON.stringify(j, null, 2);\
        require('fs').writeFileSync('./package.json', s);" && \
        git commit -m "release $$NEXT_VERSION" -- package.json && \
        git tag "$$NEXT_VERSION" -m "release $$NEXT_VERSION"
endef

release-patch: test
	@$(call release,patch)

release-minor: test
	@$(call release,minor)

release-major: build test
	@$(call release,major)

publish:
	git push --tags origin HEAD:master
	npm publish

.PHONY: test test-w test-cov