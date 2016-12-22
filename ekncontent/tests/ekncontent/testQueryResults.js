const Eknc = imports.gi.EosKnowledgeContent;

const EXPECTED_EKN_IDS = ['ekn:///12345678', 'ekn:///87654321'];

describe('Query results', function () {
    let results;
    beforeEach(function () {
        let models = EXPECTED_EKN_IDS.map(id =>
            new Eknc.ContentObjectModel({ ekn_id: id }));
        results = Eknc.QueryResults.new_for_testing(models);
    });

    it('can access its upper bound by getter', function () {
        expect(results.get_upper_bound()).toEqual(42);
    });

    it('can access its upper bound by property', function () {
        expect(results.upper_bound).toEqual(42);
    });

    it('can access its results list by getter', function () {
        let list = results.get_models();
        expect(list.map(model => model.ekn_id)).toEqual(EXPECTED_EKN_IDS);
    });

    it('can access its results list by property', function () {
        let list = results.models;
        expect(list.map(model => model.ekn_id)).toEqual(EXPECTED_EKN_IDS);
    });
});
