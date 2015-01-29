const InstanceOfMatcher = imports.InstanceOfMatcher;

const EosKnowledgeSearch = imports.EosKnowledgeSearch;

describe('Cache', () => {
    let cache;

    beforeEach(() => {
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);
        cache = new EosKnowledgeSearch.Cache();
    });

    it('should be constructable', () => {
        expect(cache).toBeA(EosKnowledgeSearch.Cache);
    });

    it('should return null on cache miss', () => {
        expect(cache.get('foo')).toEqual(null);
    });

    it('should return a value on cache hit', () => {
        cache.set('foo', 10);
        cache.set('bar', 20);
        expect(cache.get('foo')).toEqual(10);
        expect(cache.get('bar')).toEqual(20);
    });

    it('should perform LRU invalidation based on its size property', () => {
        cache.size = 5;
        let keys = ['a', 'b', 'c', 'd', 'e', 'f'];
        keys.forEach((key) => cache.set(key, 10));

        // at this point, 'a' was the least recently used, so it should be culled
        let a = keys.shift();
        expect(cache.get(a)).toEqual(null);

        // keys == ['b', 'c', ..., 'f']
        keys.forEach((key) => expect(cache.get(key)).toEqual(10));

        cache.set('g', 10);

        // now 'b' is the least recently used, so it should be culled next
        let b = keys.shift();
        expect(cache.get(b)).toEqual(null);

        // keys == ['c', 'd', ..., 'g']
        keys.forEach((key) => expect(cache.get(key)).toEqual(10));
    });
});
