/*!
 * fileReader spec
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 3/2/16
 */
/* global define, describe, beforeEach, afterEach, it, assert, sinon, teoBase  */

"use strict";

const fs = require("fs"),
    fileReader = require(`${teoLibDir}/fileReader`);

describe("Testing fileReader", () => {

    beforeEach(() => {

    });

    afterEach(() => {

    });

    it("Should catch an error whilst decodeURIComponent and return it", (done) => {

        let notAllowedCharacter = "%91%92"; // quotes characters

        fileReader.readFileSafely(`${notAllowedCharacter}/myFile`, (err) => {
            assert.instanceOf(err, Error, "Should be instance of error");

            done();
        });

    });

    it("Should catch zero byte", (done) => {

        let path = "\0/my/file";


        fileReader.readFileSafely(path, (err) => {
            assert.instanceOf(err, Error, "Should be instance of error");
            done();
        });
    });

    describe("Read file error", () => {

        let fsStatStub, isFileStub, errorStub, path;

        beforeEach(() => {

            path = "/test";
            errorStub = sinon.stub();
            errorStub.returns(null);

            isFileStub = sinon.stub();
            isFileStub.returns(true);

            fsStatStub = sinon.stub(fs, "stat", (file, callback) => {
                callback(errorStub(), {isFile: isFileStub});
            });

        });

        afterEach(() => {

            fsStatStub.restore();
            isFileStub = null;
            errorStub = null;
            path = null;

        });

        it("Should return error if fs.stat ended with error", (done) => {

            let error = new Error("my error");
            errorStub.returns(error);

            fileReader.readFileSafely(path, (err) => {

                assert.isFalse(isFileStub.called);
                assert.equal(err, error, "Error should be returned");

                done();

            });

        });

        it("Should return error if not a file", (done) => {

            isFileStub.returns(false);

            fileReader.readFileSafely(path, (err) => {

                assert.isTrue(isFileStub.calledOnce);
                assert.instanceOf(err, Error, "Should be instance of Error");

                done();

            });
        });

    });
});