project('org.example.CreativeCommonsBlog', version: '0.0.0', license: 'CC0-1.0',
    meson_version: '>= 0.40.0')
app_id = meson.project_name()
subscription_id = run_command('python3', '-c',
    'import hashlib; h = hashlib.sha256(); h.update("@0@".encode()); print(h.hexdigest())'
    .format(app_id)).stdout().strip()

gnome = import('gnome')

pkg_config = find_program('pkg-config')
sassc = find_program('sassc')
autobahn = find_program('autobahn')
basin = find_program('basin')

subscription_dir = join_paths(get_option('datadir'), 'ekn', 'data', app_id,
    'com.endlessm.subscriptions', subscription_id)
pkgdatadir = join_paths(get_option('datadir'), app_id)
theme_path = run_command(pkg_config, '--variable', 'eos_theme_path',
    'eos-knowledge-0').stdout().strip()
preset_path = run_command(pkg_config, '--variable', 'eos_preset_path',
    'eos-knowledge-0').stdout().strip()

overrides_css = custom_target('sass', input: 'overrides.scss',
    output: 'overrides.css',
    command: [sassc, '-I', theme_path, '@INPUT@', '@OUTPUT@'])

app_json = custom_target('autobahn', input: 'app.yaml', output: 'app.json',
    command: [autobahn, '@INPUT@', '-o', '@OUTPUT@', '-I', preset_path])

sets_shard = custom_target('sets', input: 'sets.json', output: 'sets.shard',
    build_by_default: true, install: true, install_dir: subscription_dir,
    command: [basin, '@INPUT@', '@OUTPUT@'])

resource = gnome.compile_resources('app', 'app.gresource.xml',
    gresource_bundle: true, install: true, install_dir: pkgdatadir,
    dependencies: [app_json, overrides_css])

install_data('output.shard', install_dir: subscription_dir)

meson.add_install_script('database_manifest.py')
