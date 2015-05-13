const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;

describe('Sample C test', function () {
    it('returns an appropriate greeting', function () {
        expect(EosKnowledgePrivate.hello_c_provider_get_greeting()).toMatch('C');
    });
});
