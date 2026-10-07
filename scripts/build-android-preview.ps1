param(
    [string]$ApiUrl = '',
    [ValidateSet('armeabi-v7a', 'arm64-v8a', 'armeabi-v7a,arm64-v8a', 'x86_64', 'arm64-v8a,x86_64')]
    [string]$Architectures = 'armeabi-v7a,arm64-v8a',
    [switch]$SkipPrebuild
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectRoot

if (-not $env:ANDROID_HOME) {
    $env:ANDROID_HOME = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
}
if (-not (Test-Path -LiteralPath $env:ANDROID_HOME)) {
    throw 'Android SDK topilmadi. ANDROID_HOME ni sozlang.'
}
if (-not $env:JAVA_HOME) {
    $javaCandidates = @(
        (Join-Path $env:ProgramFiles 'Android\Android Studio\jbr')
    )
    $adoptiumRoot = Join-Path $env:ProgramFiles 'Eclipse Adoptium'
    if (Test-Path -LiteralPath $adoptiumRoot) {
        $javaCandidates += Get-ChildItem -LiteralPath $adoptiumRoot -Directory |
            Sort-Object Name -Descending | ForEach-Object FullName
    }
    $env:JAVA_HOME = $javaCandidates | Where-Object {
        Test-Path -LiteralPath (Join-Path $_ 'bin\java.exe')
    } | Select-Object -First 1
}
if (-not $env:JAVA_HOME -or -not (Test-Path -LiteralPath (Join-Path $env:JAVA_HOME 'bin\java.exe'))) {
    throw 'Java JDK topilmadi. JAVA_HOME ni JDK katalogiga sozlang.'
}
if ($ApiUrl -and $ApiUrl -notmatch '^https://') {
    throw 'APK uchun HTTPS API manzilini kiriting. LAN sinov manzilini ilovaning Profil bolimida sozlash mumkin.'
}

# A separate package protects data in an existing BlockChat installation.
$env:RAVOQ_ANDROID_PREVIEW = '1'
$env:EXPO_PUBLIC_API_URL = $ApiUrl
$env:EXPO_NO_DOTENV = '1'
$env:NODE_ENV = 'production'

if (-not $SkipPrebuild) {
    & npx.cmd expo prebuild --platform android --no-install
    if ($LASTEXITCODE -ne 0) { throw 'Expo Android prebuild bajarilmadi.' }
}
if (-not (Test-Path 'android/gradlew.bat')) { throw 'Avval Android prebuild ni bajaring.' }
if (-not (Select-String -LiteralPath 'android/app/build.gradle' -SimpleMatch 'com.rawshanbek.blockchat.preview' -Quiet)) {
    throw 'Native loyiha preview package bilan yaratilmagan. SkipPrebuild parametrini olib tashlang.'
}

# Allow slow connections enough time to download the Gradle distribution.
$wrapperPath = Join-Path $projectRoot 'android/gradle/wrapper/gradle-wrapper.properties'
$wrapper = [System.IO.File]::ReadAllText($wrapperPath)
$wrapper = $wrapper -replace '(?m)^networkTimeout=\d+', 'networkTimeout=120000'
[System.IO.File]::WriteAllText($wrapperPath, $wrapper)

$sdkPath = $env:ANDROID_HOME.Replace('\', '/')
[System.IO.File]::WriteAllText((Join-Path $projectRoot 'android/local.properties'), "sdk.dir=$sdkPath`n")
Push-Location android
try {
    # Kotlin and Android Lint need more metaspace than the generated 384 MB limit.
    & .\gradlew.bat :app:assembleRelease "-PreactNativeArchitectures=$Architectures" '-Dorg.gradle.jvmargs=-Xmx1536m -XX:MaxMetaspaceSize=768m' --no-daemon --max-workers=2 --console=plain
    if ($LASTEXITCODE -ne 0) { throw 'Android APK yigilmadi.' }
} finally { Pop-Location }

$artifactRoot = Join-Path $projectRoot 'artifacts/android'
New-Item -ItemType Directory -Force -Path $artifactRoot | Out-Null
$apkPath = Join-Path $artifactRoot 'ravoq-preview.apk'
Copy-Item -LiteralPath 'android/app/build/outputs/apk/release/app-release.apk' -Destination $apkPath -Force
Get-FileHash -LiteralPath $apkPath -Algorithm SHA256
Write-Output "APK: $apkPath"
