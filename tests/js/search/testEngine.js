// Copyright (C) 2016 Endless Mobile, Inc.

const ContentObjectModel = imports.search.contentObjectModel;
const Engine = imports.search.engine;
const InstanceOfMatcher = imports.tests.InstanceOfMatcher;
const MockShard = imports.tests.mockShard;
const QueryObject = imports.search.queryObject;
const Utils = imports.search.utils;

describe('Engine', function () {
    let engine;

    beforeEach(function () {
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);
        engine = new Engine.Engine();
        engine.default_domain = 'foo';

        spyOn(Utils, 'get_ekn_version_for_domain').and.returnValue(1);
        let domain = engine._get_domain('foo');

        // Don't hit the disk.
        domain._content_path = '/foo';
        engine._mock_domain = domain;
    });

    function mock_ekn_shard(shard_file) {
        engine._mock_domain._shard_file = shard_file;
    }

    describe('domain wrap behavior', function (done) {
        it('calls get_domain_by_id correctly', function () {
            let domain = engine._mock_domain;

            spyOn(domain, 'get_object_by_id').and.callFake(function (id, cancellable, callback) {
                return 'testing whether this was called';
            });
            spyOn(domain, 'get_object_by_id_finish').and.callFake(function (task) {
                return task;
            });

            engine.get_object_by_id('ekn://foo/1234567890abcdef', null, function (task) {
                let res = domain.get_object_by_id_finish(task);
                expect(res).toEqual('testing whether this was called');
                expect(domain.get_object_by_id).toHaveBeenCalled();
                done();
            });
        });
    });

    describe('runtime objects', function () {
        let model;
        let mock_shard_file, mock_shard_record, mock_metadata;

        beforeEach(function () {
            model = new ContentObjectModel.ContentObjectModel({
                title: 'a',
            });
            engine.add_runtime_object('ekn://foo/1234567890abcdef', model);
            mock_shard_file = new MockShard.MockShardFile();
            mock_shard_record = new MockShard.MockShardRecord();

            mock_metadata = new MockShard.MockShardBlob();
            mock_shard_record.metadata = mock_metadata;

            mock_ekn_shard(mock_shard_file);
        });

        it('can be added', function (done) {
            engine.get_object_by_id('ekn://foo/1234567890abcdef', null, function (source, res) {
                let retrieved_model = engine.get_object_by_id_finish(res);
                expect(retrieved_model).toBe(model);
                done();
            });
        });

        it('are all returned when querying the "home page" tag', function (done) {
            let model2 = new ContentObjectModel.ContentObjectModel({
                title: 'b',
            });
            engine.add_runtime_object('ekn://foo/fedcba0987654321', model2);
            let query = new QueryObject.QueryObject({
                tags: [ Engine.HOME_PAGE_TAG ],
            });
            engine.get_objects_by_query(query, null, function (source, res) {
                let [models, get_more] = engine.get_objects_by_query_finish(res);
                expect(models).toContain(model);
                expect(models).toContain(model2);
                expect(models.length).toBe(2);
                expect(get_more).toBeNull();
                done();
            });
        });

        it('do not hit the database', function (done) {
            engine.get_object_by_id('ekn://foo/1234567890abcdef', null, function (source, res) {
                engine.get_object_by_id_finish(res);
                expect(mock_shard_file.find_record_by_hex_name).not.toHaveBeenCalled();
                done();
            });
        });

        it('mask existing objects with the same ID', function (done) {
            let json_stream = Utils.string_to_stream(JSON.stringify({
                '@id': 'ekn://foo/1234567890abcdef',
                '@type': 'ekn://_vocab/ArticleObject',
            }));
            mock_metadata.get_stream.and.returnValue(json_stream);
            mock_shard_file.find_record_by_hex_name.and.returnValue(mock_shard_record);
            engine.get_object_by_id('ekn://foo/1234567890abcdef', null, function (source, res) {
                let retrieved_model = engine.get_object_by_id_finish(res);
                expect(retrieved_model).toBe(model);
                done();
            });
        });
    });
});
