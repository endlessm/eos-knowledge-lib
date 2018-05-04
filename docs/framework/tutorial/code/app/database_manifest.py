#!/usr/bin/env python3

import hashlib
import json
import os
import subprocess

meson_introspect = os.getenv('MESONINTROSPECT')
prefix = os.getenv('MESON_INSTALL_DESTDIR_PREFIX')

project_info = subprocess.check_output(meson_introspect.split() +
                                       ['--projectinfo'],
                                       universal_newlines=True)
app_id = json.loads(project_info)['name']
hasher = hashlib.sha256()
hasher.update(app_id.encode())
subscription_id = hasher.hexdigest()
subscription_dir = os.path.join(prefix, 'share', 'ekn', 'data', app_id,
                                'com.endlessm.subscriptions', subscription_id)

subprocess.check_call(['eminem', 'regenerate', subscription_dir])
