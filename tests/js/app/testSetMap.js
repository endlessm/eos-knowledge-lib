const {DModel} = imports.gi;

const SetMap = imports.app.setMap;

describe('Set Map', function () {
    let sets, articles;
    beforeEach(function () {
        let data = [
            {
                id: '1',
                tags: ['EknHomePage'],
                title: 'Republicans',
                child_tags: ['Conservatives', 'Traditionalists'],
            },
            {
                id: '2',
                tags: ['EknHomePage'],
                title: 'Democrats',
                child_tags: ['Liberals', 'Progressives'],
            },
            {
                id: '3',
                tags: ['Conservatives'],
                title: 'Evangelicals',
                child_tags: [],
            },
            {
                id: '4',
                tags: ['Progressives'],
                title: 'Radicals',
                child_tags: [],
            },
        ];
        sets = data.map(props => new DModel.Set(props));
        SetMap.init_map_with_models(sets);

        let article_data = [
            {
                id: '5',
                tags: ['Conservatives'],
                title: 'Donald Trump',
            },
            {
                id: '6',
                tags: ['Progressives'],
                title: 'Bernie Sanders',
            },
        ];

        articles = article_data.map(props => new DModel.Article(props));
    });

    describe('tag map', function () {
        it('can retrieve a set by its child tags', function () {
            let set = SetMap.get_set_for_tag(articles[0].tags[0]);
            expect(set.title).toBe('Republicans');
        });

        it('returns undefined if given non-existent tag', function () {
            let set = SetMap.get_set_for_tag('MakeJavaScriptGreatAgain');
            expect(set).toBe(undefined);
        });
    });

    describe('parent map', function () {
        it('can retrieve the parent set of a subset', function () {
            let set = SetMap.get_parent_set(sets[3]);
            expect(set.id).toBe('2');
        });
    });
});
