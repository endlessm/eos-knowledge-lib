const Eknc = imports.gi.EosKnowledgeContent;
const Xapian = imports.gi.Xapian;

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

    describe('Created Xapian queries', function () {
        let qp;
        beforeEach(function () {
            qp = new Xapian.QueryParser();

            qp.add_prefix('title', 'S');
            qp.add_prefix('exact_title', 'XEXACTS');
            qp.add_boolean_prefix('tag', 'K', false);
            qp.add_boolean_prefix('id', 'Q', false);
        });

        it('parses the literal query directly', function () {
            let query_obj = new Eknc.QueryObject({
                literal_query: 'parse me',
            });
            expect(query_obj.get_query(qp).get_description())
                .toEqual('Query((parse@1 OR me@2))');
        });

        it('creates a match-all query for an empty query object', function () {
            let query_obj = new Eknc.QueryObject();
            expect(query_obj.get_query(qp).get_description())
                .toEqual('Query(<alldocuments>)');
        });

        // Skip: this seems to be adding a wildcard anyway
        xit('queries only the exact title if only one letter in the search terms', function () {
            let query_obj = new Eknc.QueryObject({
                search_terms: 'a',
                mode: Eknc.QueryObjectMode.DELIMITED,
            });
            expect(query_obj.get_query(qp).get_description())
                .toEqual('Query(XEXACTSa@1)');
        });

        it('queries the title and exact title', function () {
            let query_obj = new Eknc.QueryObject({
                search_terms: 'tyrion wins',
                mode: Eknc.QueryObjectMode.DELIMITED,
            });
            expect(query_obj.get_query(qp).get_description())
                .toEqual('Query((XEXACTStyrion_wins@1 OR (Styrion@2 OR ((SYNONYM WILDCARD OR Swins) OR Swins@3))))');
        });

        // Skip: this seems to not add a wildcard but instead add a second copy
        // of the exact title clause
        xit('adds a wildcard to the exact title in incremental search mode', function () {
            let query_obj = new Eknc.QueryObject({
                search_terms: 'tyrion wins',
            });
            expect(query_obj.get_query(qp).get_description())
                .toEqual('Query(((XEXACTStyrion_wins@1 OR (SYNONYM WILDCARD OR XEXACTStyrion_wins)) OR (Styrion@2 OR ((SYNONYM WILDCARD OR Swins) OR Swins@3)))');
        });

        it('queries the exact title exactly but uses both corrected and uncorrected terms for the title', function () {
            let query_obj = new Eknc.QueryObject({
                search_terms: 'happy nwe year',
                corrected_terms: 'happy new year',
                mode: Eknc.QueryObjectMode.DELIMITED,
            });
            expect(query_obj.get_query(qp).get_description())
                .toEqual('Query((XEXACTShappy_nwe_year@1 OR ((Shappy@2 OR (Snwe@3 OR Snew@4)) OR ((SYNONYM WILDCARD OR Syear) OR Syear@5))))');
        });

        it('filters requested IDs and tags', function () {
            let query_obj = new Eknc.QueryObject({
                ids: ['ekn:///0123456789abcdef01230123456789abcdef0123', 'ekn:///c0ffeec0ffeec0ffeec0c0ffeec0ffeec0ffeec0'],
                tags_match_any: ['jazz', 'blues'],
                tags_match_all: ['music', 'records'],
            });
            expect(query_obj.get_query(qp).get_description())
                .toEqual('Query((((0 * Kjazz OR 0 * Kblues) AND (0 * Kmusic AND 0 * Krecords)) AND (0 * Q0123456789abcdef01230123456789abcdef0123 OR 0 * Qc0ffeec0ffeec0ffeec0c0ffeec0ffeec0ffeec0)))');
        });

        it('filters out undesired IDs and tags', function () {
            let query_obj = new Eknc.QueryObject({
                excluded_ids: ['ekn:///0123456789abcdef01230123456789abcdef0123', 'ekn:///c0ffeec0ffeec0ffeec0c0ffeec0ffeec0ffeec0'],
                excluded_tags: ['jazz', 'blues'],
            });
            expect(query_obj.get_query(qp).get_description())
                .toEqual('Query((<alldocuments> AND_NOT ((0 * Kjazz OR 0 * Kblues) AND (0 * Q0123456789abcdef01230123456789abcdef0123 OR 0 * Qc0ffeec0ffeec0ffeec0c0ffeec0ffeec0ffeec0))))');
        });

        it('combines filter and filter-out clauses', function () {
            let query_obj = new Eknc.QueryObject({
                tags_match_any: ['rock'],
                excluded_tags: ['hair-metal'],
            });
            expect(query_obj.get_query(qp).get_description())
                .toEqual('Query((0 * Krock AND_NOT 0 * Khair-metal))');
        });

        it('combines filter clause with search terms', function () {
            let query_obj = new Eknc.QueryObject({
                search_terms: 'steely dan',
                mode: Eknc.QueryObjectMode.DELIMITED,
                tags_match_any: ['jazz'],
            });
            expect(query_obj.get_query(qp).get_description())
                .toEqual('Query(((XEXACTSsteely_dan@1 OR (Ssteely@2 OR ((SYNONYM WILDCARD OR Sdan) OR Sdan@3))) FILTER 0 * Kjazz))');
        });

        it('searches title and synopsis if requested', function () {
            let query_obj = new Eknc.QueryObject({
                search_terms: 'beatles',
                corrected_terms: 'beetles',
                mode: Eknc.QueryObjectMode.DELIMITED,
                match: Eknc.QueryObjectMatch.TITLE_SYNOPSIS,
            });
            expect(query_obj.get_query(qp).get_description())
                .toEqual('Query((((XEXACTSbeatles@1 OR (Sbeatles@2 OR Sbeetles@3)) OR beatles@4) OR ((SYNONYM WILDCARD OR beetles) OR beetles@5)))')
        });

        it('stems terms if a stemmer is added to the query parser', function () {
            let stemmer = Xapian.Stem.new_for_language('english');
            qp.set_stemmer(stemmer);
            qp.set_stemming_strategy(Xapian.StemStrategy.STEM_SOME);
            let query_obj = new Eknc.QueryObject({
                search_terms: 'revolution',
                mode: Eknc.QueryObjectMode.DELIMITED,
                match: Eknc.QueryObjectMatch.TITLE_SYNOPSIS,
            });
            expect(query_obj.get_query(qp).get_description())
                .toEqual('Query(((ZXEXACTSrevolut@1 OR ZSrevolut@2) OR ((SYNONYM WILDCARD OR revolution) OR Zrevolut@3)))');
        });
    });
});
