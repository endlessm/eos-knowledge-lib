const EosKnowledge = imports.EosKnowledge.EosKnowledge;

describe('Sample C test', function () {
    it('returns an appropriate greeting', function () {
        expect(EosKnowledge.hello_c_provider_get_greeting()).toMatch('C');
    });
});
