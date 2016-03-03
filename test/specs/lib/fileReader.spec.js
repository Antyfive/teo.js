/*!
 * fileReader spec
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 3/2/16
 */
/* global define, describe, beforeEach, afterEach, it, assert, sinon, teoBase  */

"use strict";

const fs = require("fs"),
    fileReader = require(`${teoLibDir}/fileReader`),
    EventEmitter = require("events").EventEmitter,
    util = require("util");

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

    describe("fileReader.readFile", () => {

        let fsStatStub, isFileStub, errorStub, path, readFileStub, readFileErrorStub, readFileDataBufferStub;

        beforeEach(() => {

            path = "/test";
            errorStub = sinon.stub();
            errorStub.returns(null);

            isFileStub = sinon.stub();
            isFileStub.returns(true);

            fsStatStub = sinon.stub(fs, "stat", (file, callback) => {
                callback(errorStub(), {isFile: isFileStub});
            });

            readFileErrorStub = sinon.stub();
            readFileErrorStub.returns(null);

            readFileDataBufferStub = sinon.stub();
            readFileDataBufferStub.returns(new Buffer("test"));

            readFileStub = sinon.stub(fileReader, "readFile", (path, callback) => {
                callback(readFileErrorStub(), readFileDataBufferStub());
            });

        });

        afterEach(() => {

            fsStatStub.restore();
            isFileStub = null;
            errorStub = null;
            path = null;
            readFileStub.restore();

        });

        it("Should return error immediately if read file callback returned with an error", (done) => {

            let error = new Error("my error");
            readFileErrorStub.returns(error);


            fileReader.readFileSafely(path, (err) => {

                assert.isTrue(isFileStub.calledOnce);
                assert.isTrue(readFileStub.calledOnce);
                assert.equal(err, error, "Error should be returned");

                done();

            });

        });

        it("Should return data buffer if file was read without an error", (done) => {

            fileReader.readFileSafely(path, (err, dataBuffer) => {

                assert.isTrue(isFileStub.calledOnce);
                assert.isTrue(readFileStub.calledOnce);
                assert.isNull(err, "Error should null");

                assert.isTrue(Buffer.isBuffer(dataBuffer), "Buffer should be returned");

                done();


            });

        });

    });

    describe("readFile", () => {

        let path, readStub, readStreamStubInstance;

        beforeEach(() => {

            readStub = sinon.stub();
            readStub.returns(new Buffer(123));

            let StubClass = function () {readStreamStubInstance = this;};

            util.inherits(StubClass, EventEmitter);

            StubClass.prototype.read = readStub;

            sinon.stub(fs, "ReadStream", StubClass);

            path = "/123";

        });

        afterEach(() => {

            fs.ReadStream.restore();
            readStub = null;
            path = null;
            readStreamStubInstance = null;

        });

        it("Should read and push chunk on readable event", (done) => {

            fileReader.readFile(path, (err, dataBuffer) => {

                assert.isTrue(readStub.calledOnce);
                assert.isNull(err, "Error should be null");
                assert.isTrue(Buffer.isBuffer(dataBuffer), "Buffer should be returned after read");
                done();

            });

            readStreamStubInstance.emit("readable");
            readStreamStubInstance.emit("end");

        });

        it("Should handle error event", (done) => {

            let error = new Error("my error");
            fileReader.readFile(path, (err, dataBuffer) => {

                assert.isFalse(readStub.called);
                assert.equal(err, error, "Emitted error should be passed");

                done();

            });

            readStreamStubInstance.emit("error", error);

        });

    });
});