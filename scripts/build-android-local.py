"""Build and verify a signed, self-contained Android APK on Linux/macOS.

Requires the Android SDK, JDK 17, and a generated android/ project.
Signing material stays outside the checkout and is reused for future updates.
"""
import hashlib
import json
import os
from pathlib import Path
import secrets
import shutil
import shlex
import subprocess
import sys
import urllib.parse
import urllib.request
import zipfile

root = Path(__file__).resolve().parent.parent
sdk = Path(os.environ.get('ANDROID_HOME', os.environ.get('ANDROID_SDK_ROOT', '')))
if not sdk.is_dir() or not (sdk / 'build-tools' / '37.0.0').is_dir():
    raise SystemExit('Set ANDROID_HOME to an SDK with build-tools 37.0.0 and platform 37.0.')
if not (root / 'android' / 'gradlew').exists():
    raise SystemExit('First run: npx expo prebuild --platform android --no-install')
signing = Path(os.environ.get('FITNESS_SIGNING_DIR', str(Path.home() / '.fitness-signing'))).resolve()
try:
    signing.relative_to(root)
except ValueError:
    pass
else:
    raise SystemExit('Signing directory must be outside the Git checkout.')
signing.mkdir(parents=True, exist_ok=True, mode=0o700)
credentials = signing / 'credentials.json'
key = signing / 'release.keystore'
if key.exists() and not credentials.exists():
    raise SystemExit('Existing keystore has no credentials file. Restore the original credentials; do not replace the key.')
if not credentials.exists():
    credentials.write_text(json.dumps({'password': secrets.token_urlsafe(32)}))
    credentials.chmod(0o600)
password = json.loads(credentials.read_text())['password']
env = {**os.environ, 'ANDROID_HOME': str(sdk.resolve()), 'FITNESS_STORE_PASS': password}
if not key.exists():
    subprocess.run(['keytool', '-genkeypair', '-keystore', str(key), '-storetype', 'PKCS12', '-alias', 'fitness', '-keyalg', 'RSA', '-keysize', '3072', '-validity', '10000', '-dname', 'CN=Fitness Journal', '-storepass:env', 'FITNESS_STORE_PASS', '-keypass:env', 'FITNESS_STORE_PASS'], env=env, check=True)
    key.chmod(0o600)
def quote_groovy(value):
    return "'" + str(value).replace('\\', '\\\\').replace("'", "\\'") + "'"
init = signing / 'signing.init.gradle'
init.write_text('''import groovy.json.JsonSlurper
    gradle.beforeProject { project ->
      project.plugins.withId('com.android.application') {
        project.extensions.getByName('androidComponents').finalizeDsl { android ->
          def credentials = new JsonSlurper().parse(new File(CREDENTIALS))
          def signing = android.signingConfigs.maybeCreate('fitnessLocalRelease')
          signing.storeFile = new File(KEYSTORE)
          signing.storePassword = credentials.password
          signing.keyAlias = 'fitness'
          signing.keyPassword = credentials.password
          android.buildTypes.getByName('release').signingConfig = signing
        }
      }
    }
'''.replace('CREDENTIALS', quote_groovy(credentials)).replace('KEYSTORE', quote_groovy(key)))
init.chmod(0o600)
wrapper = root / 'android/gradle/wrapper/gradle-wrapper.properties'
properties = wrapper.read_text()
if 'distributionSha256Sum=' not in properties:
    url = next(line.split('=', 1)[1].replace('\\:', ':') for line in properties.splitlines() if line.startswith('distributionUrl='))
    if not url.startswith('https://services.gradle.org/distributions/'):
        raise SystemExit('Unexpected Gradle distribution; verify it before building.')
    checksum = urllib.request.urlopen(url + '.sha256', timeout=30).read().decode().strip()
    if len(checksum) != 64 or any(c not in '0123456789abcdef' for c in checksum):
        raise SystemExit('Invalid official Gradle checksum response.')
    wrapper.write_text(properties + '\ndistributionSha256Sum=' + checksum + '\n')
options = []
if os.environ.get('FITNESS_JAVA_TRUST_STORE'):
    trust = Path(os.environ['FITNESS_JAVA_TRUST_STORE'])
    if not trust.is_file():
        raise SystemExit('Configured Java trust store is missing.')
    options += ['-Djavax.net.ssl.trustStore=' + str(trust), '-Djavax.net.ssl.trustStorePassword=changeit']
if os.environ.get('FITNESS_JAVA17_HOME'):
    options.append('-Dorg.gradle.java.installations.paths=' + os.environ['FITNESS_JAVA17_HOME'])
proxy = urllib.parse.urlsplit(os.environ.get('HTTPS_PROXY', os.environ.get('https_proxy', '')))
if proxy.hostname:
    if proxy.username or proxy.password:
        raise SystemExit('Authenticated proxies require separate supported Gradle configuration.')
    for protocol in ['http', 'https']:
        options += ['-D' + protocol + '.proxyHost=' + proxy.hostname, '-D' + protocol + '.proxyPort=' + str(proxy.port or 80)]
env['JAVA_OPTS'] = shlex.join(options)
subprocess.run(['./gradlew', ':app:assembleRelease', '--no-daemon', '--max-workers=' + os.environ.get('FITNESS_BUILD_WORKERS', '3'), '--console=plain', '-PreactNativeArchitectures=' + os.environ.get('FITNESS_ANDROID_ARCHITECTURES', 'arm64-v8a,armeabi-v7a'), '-Dorg.gradle.jvmargs=-Xmx6g -XX:MaxMetaspaceSize=1g', '--init-script', str(init), *options], cwd=root / 'android', env=env, check=True)
apk = root / 'android/app/build/outputs/apk/release/app-release.apk'
subprocess.run([str(sdk / 'build-tools/37.0.0/apksigner'), 'verify', '--verbose', '--print-certs', str(apk)], check=True, env=env)
with zipfile.ZipFile(apk) as archive:
    assert 'assets/index.android.bundle' in archive.namelist(), 'APK is missing its offline JS bundle'
    assert any(p.startswith('lib/arm64-v8a/') for p in archive.namelist()), 'APK is missing ARM64 libraries'
output = root / 'artifacts'
output.mkdir(exist_ok=True)
shutil.copyfile(apk, output / 'fitness-android.apk')
digest = hashlib.sha256(apk.read_bytes()).hexdigest()
(output / 'fitness-android.apk.sha256').write_text(digest + '  fitness-android.apk\n')
print('Verified self-contained signed APK:', output / 'fitness-android.apk')
print('Signing files were kept outside the checkout. Keep a secure backup for future updates.')
