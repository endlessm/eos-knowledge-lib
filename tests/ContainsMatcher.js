const customMatchers = {
    toContain: function (util, customEqualityTesters) {
        return {
            compare: function (haystack, needle) {
                if (needle === undefined || haystack === undefined)
                    return { pass: false };

                let result = {
                    pass: (haystack.indexOf(needle) !== -1)
                };
                if (result.pass)
                    result.message = 'Expected ' + haystack + ' not to contain ' + needle + ', but it did';
                else
                    result.message = 'Expected ' + haystack + ' to contain ' + needle + ', but it did not';
                return result;
            }
        };
    }
};
