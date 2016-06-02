const Utils = imports.search.utils;

describe('components_from_ekn_id', function () {
    it('can parse EKN IDs without resources', function () {
        let components = Utils.components_from_ekn_id('ekn://domain/hash');
        expect(components).toEqual(['hash']);
    });

    it('can parse EKN IDs with resources', function () {
        let components = Utils.components_from_ekn_id('ekn://domain/hash/resource');
        expect(components).toEqual(['hash', 'resource']);
    });

    it('ignores domains', function () {
        let components = Utils.components_from_ekn_id('ekn:///hash/resource');
        expect(components).toEqual(['hash', 'resource']);
    });
});
