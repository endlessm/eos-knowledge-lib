const Eknc = imports.gi.EosKnowledgeContent;

describe('QueryObject', function () {
    const IDS = ['ekn://busters-es/0123456789012345',
        'ekn://busters-es/fabaffacabacbafa'];
    const EXCLUDED_IDS = ['ekn://busters-es/abcdefabcdef1234',
        'ekn://busters-es/fedcba9876543210']
    const TAGS_MATCH_ANY = ['Spengler', 'Stantz', 'Venkman', 'Zeddemore'];
    const TAGS_MATCH_ALL = ['Gilbert', 'Holtzmann', 'Tolan', 'Yates'];
    const EXCLUDED_TAGS = ['Zuul'];

    it('sets tags and ids objects properly', function () {
        let query_obj = new Eknc.QueryObject({
            ids: IDS,
            excluded_ids: EXCLUDED_IDS,
            tags_match_any: TAGS_MATCH_ANY,
            tags_match_all: TAGS_MATCH_ALL,
            excluded_tags: EXCLUDED_TAGS,
        });
        expect(query_obj.ids).toEqual(IDS);
        expect(query_obj.excluded_ids).toEqual(EXCLUDED_IDS);
        expect(query_obj.tags_match_any).toEqual(TAGS_MATCH_ANY);
        expect(query_obj.tags_match_all).toEqual(TAGS_MATCH_ALL);
        expect(query_obj.excluded_tags).toEqual(EXCLUDED_TAGS);
    });

    it('makes a deep copy of arrays passed into it', function () {
        let mutable_ids = ['ekn://busters-es/0123456789012345',
                           'ekn://busters-es/fabaffacabacbafa'];
        let mutable_tags = ['Venkman', 'Stantz'];
        let query_obj = new Eknc.QueryObject({
            ids: mutable_ids,
            tags_match_any: mutable_tags,
        });
        mutable_ids = mutable_ids.concat(['ekn://busters-es/0123456789abcdef']);
        delete mutable_tags[1];
        expect(query_obj.ids).not.toEqual(mutable_ids);
        expect(query_obj.tags_match_any).not.toEqual(mutable_tags);
    });

    describe('new_from_object constructor', function () {
        const TERMS = 'keymaster';
        const QUERY_OBJ = new Eknc.QueryObject({
            tags_match_any: TAGS_MATCH_ANY,
            search_terms: TERMS,
        });

        it('duplicates properties from source object', function () {
            let query_obj_copy = Eknc.QueryObject.new_from_object(QUERY_OBJ);
            expect(query_obj_copy.tags_match_any).toEqual(TAGS_MATCH_ANY);
            expect(query_obj_copy.search_terms).toEqual(TERMS);
        });

        it('allows properties to be overridden', function () {
            let new_terms = 'gatekeeper';
            let new_query_object = Eknc.QueryObject.new_from_object(QUERY_OBJ, {
                search_terms: new_terms,
            });
            expect(new_query_object.tags_match_any).toEqual(TAGS_MATCH_ANY);
            expect(new_query_object.search_terms).toEqual(new_terms);
        });

        it('properly marshals arrays from the override object', function () {
            let new_query_object = Eknc.QueryObject.new_from_object(QUERY_OBJ, {
                ids: IDS,
                excluded_ids: EXCLUDED_IDS,
                tags_match_all: TAGS_MATCH_ALL,
                tags_match_any: TAGS_MATCH_ANY,
                excluded_tags: EXCLUDED_TAGS,
            });
            expect(new_query_object.ids).toEqual(IDS);
            expect(new_query_object.excluded_ids).toEqual(EXCLUDED_IDS);
            expect(new_query_object.tags_match_all).toEqual(TAGS_MATCH_ALL);
            expect(new_query_object.tags_match_any).toEqual(TAGS_MATCH_ANY);
            expect(new_query_object.excluded_tags).toEqual(EXCLUDED_TAGS);
        });
    });

    it('should map sort property to xapian sort value', function () {
        let query_obj = new Eknc.QueryObject({
            search_terms: 'tyrion wins',
            sort: Eknc.QueryObjectSort.SEQUENCE_NUMBER,
        });
        let result = query_obj.get_sort_value();
        expect(result).toBe(0);

        query_obj = new Eknc.QueryObject({
            search_terms: 'tyrion wins',
        });
        let undefined_result = query_obj.get_sort_value();
        expect(undefined_result).toBe(-1);
    });

    it('should map match type to xapian cutoff value', () => {
        let query_obj = new Eknc.QueryObject({
            search_terms: 'tyrion wins',
            match: Eknc.QueryObjectMatch.TITLE_SYNOPSIS,
        });
        let result = query_obj.get_cutoff();
        expect(result).toBe(20);

        query_obj = new Eknc.QueryObject({
            search_terms: 'tyrion wins',
            match: Eknc.QueryObjectMatch.ONLY_TITLE,
        });
        result = query_obj.get_cutoff();
        expect(result).toBe(10);
    });
});
