/* exported SpinnerReplacement */

const {GObject, Gtk} = imports.gi;

var SpinnerReplacement = GObject.registerClass({
    GTypeName: 'EknSpinnerReplacement',
}, class SpinnerReplacement extends Gtk.Revealer {
    _init(props={}) {
        props.transition_duration = 200;
        props.transition_type = Gtk.RevealerTransitionType.CROSSFADE;
        super._init(props);

        const fake_spinner = Gtk.Image.new_from_icon_name('content-loading-symbolic',
            Gtk.IconSize.DIALOG);
        fake_spinner.show();
        this.add(fake_spinner);
    }

    get active() {
        return this.reveal_child;
    }

    set active(v) {
        this.reveal_child = v;
    }
});
