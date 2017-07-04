var customMatchers = {
    toBeA: function (util, customEqualityTesters) {
        return {
            compare: function (widget, expectedType) {
                let result = {
                    pass: function () {
                        return widget instanceof expectedType;
                    }()
                }

                let widgetTypeName;
                if (typeof widget === 'object')
                    widgetTypeName = widget.constructor.name;
                else
                    widgetTypeName = typeof widget;

                let expectedTypeName;
                if (typeof expectedType.$gtype !== 'undefined')
                    expectedTypeName = expectedType.$gtype.name;
                else
                    expectedTypeName = expectedType;

                if (result.pass) {
                    result.message = 'Expected ' + widget + ' not to be a ' + expectedTypeName + ', but it was';
                } else {
                    result.message = 'Expected ' + widget + ' to be a ' + expectedTypeName + ', but instead it had type ' + widgetTypeName;
                }
                return result;
            }
        }
    }
}
