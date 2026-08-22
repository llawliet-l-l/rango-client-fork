<#
.SYNOPSIS
    Repoints the npm trusted publisher of every public workspace package at a
    different GitHub Actions workflow file.

.DESCRIPTION
    Reads each public package's trusted publisher from npm and, for those still
    pointing at the old workflow, revokes that configuration and recreates it
    against the new one. Repository, environment and permission claims are
    carried over untouched -- only the workflow filename changes.

    npm allows just one trusted publisher per package, so there is no atomic
    edit: the old configuration must be revoked before the new one is created.
    If the create then fails, that package is briefly left with NO trusted
    publisher. The script stops immediately in that case, leaving the remaining
    packages untouched, and prints the exact command to restore the original.

    The run is idempotent -- packages already on the target workflow are
    reported and skipped -- so it is safe to re-run after an interruption.

    Requires npm 11.15.0 or newer and an `npm login` session. These calls are
    gated on two-factor auth. Rather than asking you to type a code, the script
    opens npm's approval page in your browser and waits for you to approve.
    Approving elevates the npm session, so in practice one approval near the
    start covers the whole run, with another only if npm lets the session
    lapse. Accounts using an authenticator app instead fall back to entering a
    code. Must be run in an interactive console.

.PARAMETER File
    Workflow file to point the trusted publishers at. Default: publish.yml

.PARAMETER From
    Only touch packages currently pointing at this workflow. Pass '*' to migrate
    regardless of the current value. Default: delivery.yml

.PARAMETER Repository
    Override the repository claim (owner/repo) instead of keeping the existing
    one.

.PARAMETER Only
    Limit the run to these package names.

.PARAMETER Otp
    Initial one-time password. More are requested interactively as needed.

.PARAMETER Registry
    Registry to talk to. Default: https://registry.npmjs.org/

.PARAMETER ApprovalTimeoutSeconds
    How long to wait for a browser approval before giving up. Default: 300

.PARAMETER Login
    Run `npm login` first, which opens a browser to sign in. Use this if your
    saved npm credentials are stale.

.PARAMETER DryRun
    Report what would change without changing anything.

.PARAMETER Yes
    Skip the confirmation prompt.

.EXAMPLE
    .\scripts\Update-NpmTrustedPublisher.ps1 -DryRun

.EXAMPLE
    .\scripts\Update-NpmTrustedPublisher.ps1

.EXAMPLE
    .\scripts\Update-NpmTrustedPublisher.ps1 -Only '@arthur2079/wallets-core'
#>
[CmdletBinding()]
param(
    [string]$File = 'publish.yml',
    [string]$From = 'delivery.yml',
    [string]$Repository,
    [string[]]$Only,
    [string]$Otp,
    [string]$Registry = 'https://registry.npmjs.org/',
    [int]$ApprovalTimeoutSeconds = 300,
    [switch]$Login,
    [switch]$DryRun,
    [switch]$Yes
)

Set-StrictMode -Version 2.0
$ErrorActionPreference = 'Stop'

# Surface failures as a plain message. Nothing here is worth a stack trace, and
# the run is resumable, so say so rather than dumping PowerShell internals.
trap {
    Write-Host ''
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host 'Re-run to pick up where this left off -- packages already moved are skipped.' -ForegroundColor Yellow
    exit 1
}

# npm permission claims mapped to the `npm trust github` flag that recreates them.
$script:PermissionFlags = @{
    'createPackage'       = '--allow-publish'
    'createStagedPackage' = '--allow-stage-publish'
}

# How many times a single npm call may be retried with a freshly entered OTP.
$script:MaxOtpAttempts = 3

$script:Otp = $Otp
$script:Registry = $Registry
$script:ApprovalTimeoutSeconds = $ApprovalTimeoutSeconds
$script:RepoRoot = Split-Path -Parent $PSScriptRoot

function Get-JsonObjectFromText {
    <#
        Pulls every top-level {...} out of a string and parses each one.

        npm writes its notices and errors to stderr and its payload to stdout;
        both land in one captured blob here. `npm trust --json` also prints one
        object per configuration rather than an array, and prints nothing at all
        when a package has no configuration. Scanning for balanced braces copes
        with all of that.
    #>
    param([string]$Text)

    $objects = @()
    $depth = 0
    $start = -1
    $inString = $false
    $escaped = $false

    for ($i = 0; $i -lt $Text.Length; $i++) {
        $character = $Text[$i]

        if ($inString) {
            if ($escaped) { $escaped = $false }
            elseif ($character -eq '\') { $escaped = $true }
            elseif ($character -eq '"') { $inString = $false }
            continue
        }

        if ($character -eq '"') {
            $inString = $true
        }
        elseif ($character -eq '{') {
            if ($depth -eq 0) { $start = $i }
            $depth++
        }
        elseif ($character -eq '}') {
            $depth--
            if ($depth -eq 0 -and $start -ge 0) {
                $slice = $Text.Substring($start, $i - $start + 1)
                try { $objects += (ConvertFrom-Json $slice) } catch { }
                $start = -1
            }
        }
    }

    # Emitted as individual objects: callers pipe this into Where-Object.
    return $objects
}

function Test-JsonProperty {
    param([psobject]$Object, [string]$Name)
    if ($null -eq $Object) { return $false }
    return ($Object.PSObject.Properties.Name -contains $Name)
}

function Get-PublicPackage {
    <# Every workspace package that actually gets published to the public registry. #>
    $rootManifest = Get-Content -Raw -Path (Join-Path $script:RepoRoot 'package.json') | ConvertFrom-Json

    $patterns = $rootManifest.workspaces
    if (Test-JsonProperty $rootManifest.workspaces 'packages') {
        $patterns = $rootManifest.workspaces.packages
    }

    $names = @()
    foreach ($pattern in $patterns) {
        # Every pattern in this repo is of the form "<dir>/*".
        $parent = Join-Path $script:RepoRoot ($pattern -replace '[\\/]\*$', '')
        if (-not (Test-Path $parent)) { continue }

        foreach ($directory in Get-ChildItem -Path $parent -Directory) {
            $manifestPath = Join-Path $directory.FullName 'package.json'
            if (-not (Test-Path $manifestPath)) { continue }

            $manifest = Get-Content -Raw -Path $manifestPath | ConvertFrom-Json

            if ((Test-JsonProperty $manifest 'private') -and $manifest.private -eq $true) { continue }
            if (-not (Test-JsonProperty $manifest 'publishConfig')) { continue }
            if ($manifest.publishConfig.access -ne 'public') { continue }

            $names += $manifest.name
        }
    }

    return ($names | Sort-Object)
}

function Test-OtpError {
    param([string]$Text)
    return ($Text -match 'EOTP|one-time pass')
}

function Get-FailureReason {
    <#
        Prefers the structured error npm emits under --json, then its `npm error`
        lines. The first line of output is not good enough on its own: npm also
        writes notices and warnings there, which would be reported as the cause.
    #>
    param([psobject]$Result)

    $payload = @(Get-JsonObjectFromText $Result.Text) | Where-Object { Test-JsonProperty $_ 'error' } | Select-Object -First 1
    if ($null -ne $payload) {
        $code = $null
        if (Test-JsonProperty $payload.error 'code') { $code = $payload.error.code }

        $message = $null
        foreach ($field in @('summary', 'detail')) {
            if ((Test-JsonProperty $payload.error $field) -and $payload.error.$field.Trim()) {
                $message = $payload.error.$field
                break
            }
        }

        if ($message) {
            $firstLine = ($message -split "`n")[0].Trim()
            if ($code) { return "${code}: $firstLine" }
            return $firstLine
        }
    }

    $errorLines = @($Result.Text -split "`n" |
        Where-Object { $_ -match '^npm error' } |
        ForEach-Object { ($_ -replace '^npm error\s*', '').Trim() } |
        Where-Object { $_ -and $_ -notmatch '^A complete log of this run' })

    if ($errorLines.Count -gt 0) {
        # The first line is usually just `code EXXX`; pair it with the description.
        return (($errorLines | Select-Object -First 2) -join ' - ')
    }

    return "npm exited with code $($Result.ExitCode)"
}

function Wait-NpmWebApproval {
    <#
        Polls the "done" URL npm hands out alongside its browser approval link
        until the approval lands, and returns the one-time token it yields.

        npm answers 202 while the request is still pending (with a Retry-After
        hint) and 200 with the token once approved. The poll needs no
        credentials of its own -- the random authId in the URL is the secret.
    #>
    param(
        [string]$DoneUrl,
        [int]$TimeoutSeconds = 300
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)

    while ((Get-Date) -lt $deadline) {
        try {
            $response = Invoke-WebRequest -Uri $DoneUrl -UseBasicParsing -TimeoutSec 30
        }
        catch {
            throw "Could not reach npm to check the approval status: $($_.Exception.Message)"
        }

        if ($response.StatusCode -eq 200) {
            $payload = $response.Content | ConvertFrom-Json
            if (Test-JsonProperty $payload 'token') { return $payload.token }
            throw 'npm approved the request but returned no token.'
        }

        $retryAfter = 3
        $header = $response.Headers.GetEnumerator() |
            Where-Object { $_.Key -ieq 'retry-after' } |
            Select-Object -First 1
        if ($header) {
            $parsed = 0
            if ([int]::TryParse((@($header.Value)[0]), [ref]$parsed) -and $parsed -gt 0) {
                $retryAfter = $parsed
            }
        }

        Start-Sleep -Seconds $retryAfter
    }

    throw "Timed out after $TimeoutSeconds seconds waiting for approval in the browser."
}

function Get-ApprovalUrl {
    <# Pulls npm's browser-approval URL pair out of an EOTP response. #>
    param([string]$Text)

    $approvalUrl = [regex]::Match($Text, 'https://[^\s"]+/auth/cli/[0-9a-fA-F-]+').Value
    $doneUrl = [regex]::Match($Text, 'https://[^\s"]+/-/v1/done\?authId=[0-9a-fA-F-]+').Value

    if (-not $approvalUrl -or -not $doneUrl) { return $null }
    return [pscustomobject]@{ ApprovalUrl = $approvalUrl; DoneUrl = $doneUrl }
}

function Get-NpmAuthorization {
    <#
        Obtains a fresh one-time token from npm.

        Preferred path is npm's browser approval: the EOTP response carries an
        approval URL and a matching "done" URL, so the link is opened and the
        approval waited on -- nothing to type.

        npm's approval tokens are single use, and the registry only opens a new
        web session when no token is offered -- so a spent token comes back as
        an EOTP carrying no links. When the response has no links, ask for a
        clean challenge with a read-only `trust list` and no token, either to be
        handed a fresh pair or to discover that no approval is needed.

        Accounts on authenticator-app 2FA are never offered links, and fall back
        to entering a code.
    #>
    param([string]$Text, [string]$Label, [string]$ProbePackage)

    $urls = Get-ApprovalUrl -Text $Text

    if (-not $urls -and $ProbePackage) {
        $challenge = Invoke-NpmTrustOnce -Arguments @('list', $ProbePackage) -OtpToken $null

        # The probe going through means the session is already elevated and
        # nothing needs approving; the caller just has to retry without a token.
        if ($challenge.ExitCode -eq 0) { return $null }

        $urls = Get-ApprovalUrl -Text $challenge.Text
    }

    if ($urls) {
        $approvalUrl = $urls.ApprovalUrl
        $doneUrl = $urls.DoneUrl
        Write-Host ''
        Write-Host "  npm needs you to approve this ($Label)." -ForegroundColor Yellow
        Write-Host "  Opening your browser to:" -ForegroundColor Yellow
        Write-Host "    $approvalUrl" -ForegroundColor Cyan

        try {
            Start-Process $approvalUrl | Out-Null
        }
        catch {
            Write-Host '  (could not open a browser -- open the link above yourself)' -ForegroundColor DarkGray
        }

        Write-Host '  Waiting for approval...' -ForegroundColor Yellow
        $token = Wait-NpmWebApproval -DoneUrl $doneUrl -TimeoutSeconds $script:ApprovalTimeoutSeconds
        Write-Host '  Approved.' -ForegroundColor Green
        return $token
    }

    Write-Host ''
    Write-Host "  npm needs a one-time password ($Label)." -ForegroundColor Yellow
    return (Read-Host '  Enter OTP').Trim()
}

function Invoke-NpmTrustOnce {
    <#
        One `npm trust ...` invocation, with no retry or authorisation handling.

        The registry is always passed explicitly. yarn exports
        npm_config_registry to the processes it spawns, so if this script is
        ever launched from a yarn script npm would otherwise talk to
        registry.yarnpkg.com -- a read-only mirror that 401s on these calls.
    #>
    param(
        [string[]]$Arguments,
        [string]$OtpToken
    )

    # --json on every call, including revoke, which does not advertise it:
    # npm redacts the approval URLs to *** in its plain-text error output,
    # so the structured payload is the only place they survive intact.
    $callArguments = @('trust') + $Arguments + @('--json', "--registry=$script:Registry")
    if ($OtpToken) { $callArguments += "--otp=$OtpToken" }

    # npm writes notices to stderr; merge the streams and stringify each
    # record so nothing is lost and long JSON lines are never wrapped.
    $previous = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        $lines = & npm @callArguments 2>&1 | ForEach-Object { $_.ToString() }
        $exitCode = $LASTEXITCODE
    }
    finally {
        $ErrorActionPreference = $previous
    }

    return [pscustomobject]@{
        Text     = ($lines -join "`n")
        ExitCode = $exitCode
    }
}

function Invoke-NpmTrust {
    <#
        Runs `npm trust ...`, re-authorising through the browser whenever npm
        rejects the current one-time token, and never throwing so the caller can
        inspect the failure.
    #>
    param(
        [string[]]$Arguments,
        [string]$Label
    )

    for ($attempt = 1; $attempt -le $script:MaxOtpAttempts; $attempt++) {
        # Spend the token on exactly one call. npm's approval tokens are single
        # use, and approving once elevates the whole npm session -- so later
        # calls succeed with no token, while re-sending a spent one is rejected
        # and would turn a working call into a failure.
        $otpForThisCall = $script:Otp
        $script:Otp = $null

        $result = Invoke-NpmTrustOnce -Arguments $Arguments -OtpToken $otpForThisCall

        if ($result.ExitCode -eq 0) { return $result }
        if (-not (Test-OtpError $result.Text)) { return $result }
        if ($attempt -eq $script:MaxOtpAttempts) { return $result }

        # $Arguments is always <subcommand> <package> ...
        $script:Otp = Get-NpmAuthorization -Text $result.Text -Label $Label -ProbePackage $Arguments[1]
    }
}

function Get-TrustConfig {
    <# Reads the single trusted publisher npm allows per package. #>
    param([string]$Package)

    $result = Invoke-NpmTrust -Arguments @('list', $Package, '--json') -Label "reading $Package"

    if ($result.ExitCode -ne 0) {
        return [pscustomobject]@{ Status = 'error'; Reason = (Get-FailureReason $result); Config = $null }
    }

    $config = @(Get-JsonObjectFromText $result.Text) | Where-Object { Test-JsonProperty $_ 'id' } | Select-Object -First 1

    if ($null -eq $config) {
        return [pscustomobject]@{ Status = 'unconfigured'; Reason = $null; Config = $null }
    }

    return [pscustomobject]@{ Status = 'ok'; Reason = $null; Config = $config }
}

function Get-MigrationPlan {
    <# Decides what should happen to one package, without touching anything. #>
    param([string]$Package, [string]$FromFile, [string]$TargetFile)

    $lookup = Get-TrustConfig -Package $Package

    if ($lookup.Status -eq 'error') {
        return [pscustomobject]@{ Package = $Package; Action = 'error'; Detail = $lookup.Reason; Config = $null }
    }
    if ($lookup.Status -eq 'unconfigured') {
        return [pscustomobject]@{ Package = $Package; Action = 'skip'; Detail = 'no trusted publisher configured'; Config = $null }
    }

    $config = $lookup.Config

    if ($config.type -ne 'github') {
        return [pscustomobject]@{ Package = $Package; Action = 'skip'; Detail = "provider is `"$($config.type)`", not github"; Config = $config }
    }
    if ($config.file -eq $TargetFile) {
        return [pscustomobject]@{ Package = $Package; Action = 'done'; Detail = "already on $TargetFile"; Config = $config }
    }
    if ($FromFile -ne '*' -and $config.file -ne $FromFile) {
        return [pscustomobject]@{ Package = $Package; Action = 'skip'; Detail = "points at $($config.file), not $FromFile"; Config = $config }
    }

    return [pscustomobject]@{ Package = $Package; Action = 'migrate'; Detail = "$($config.file) -> $TargetFile"; Config = $config }
}

function New-TrustArgument {
    <# Rebuilds the `npm trust github` flags that recreate a configuration verbatim. #>
    param([string]$Package, [psobject]$Config, [string]$TargetFile, [string]$RepositoryOverride)

    $permissionFlags = @()
    if (Test-JsonProperty $Config 'permissions') {
        foreach ($permission in $Config.permissions) {
            if ($script:PermissionFlags.ContainsKey($permission)) {
                $permissionFlags += $script:PermissionFlags[$permission]
            }
        }
    }
    if ($permissionFlags.Count -eq 0) {
        # npm rejects a configuration with no permissions, and publishing is the
        # only permission this repo's workflow needs.
        $permissionFlags += '--allow-publish'
    }

    $repository = $Config.repository
    if ($RepositoryOverride) { $repository = $RepositoryOverride }

    $arguments = @('github', $Package, "--file=$TargetFile", "--repo=$repository")
    if ((Test-JsonProperty $Config 'environment') -and $Config.environment) {
        $arguments += "--env=$($Config.environment)"
    }

    return ($arguments + $permissionFlags + @('--yes'))
}

function Get-RestoreCommand {
    <# The command that puts a package back exactly as it was. #>
    param([string]$Package, [psobject]$Config)

    $arguments = @(New-TrustArgument -Package $Package -Config $Config -TargetFile $Config.file)

    return (@('npm', 'trust') + $arguments) -join ' '
}

function Invoke-Migration {
    param([psobject]$Plan, [string]$TargetFile, [string]$RepositoryOverride)

    $package = $Plan.Package
    $config = $Plan.Config

    $revoked = Invoke-NpmTrust -Arguments @('revoke', $package, "--id=$($config.id)") -Label "revoking $package"
    if ($revoked.ExitCode -ne 0) {
        return [pscustomobject]@{ Package = $package; Result = 'failed'; Detail = (Get-FailureReason $revoked); Restore = $null }
    }

    $createArguments = @(New-TrustArgument -Package $package -Config $config -TargetFile $TargetFile -RepositoryOverride $RepositoryOverride)
    $created = Invoke-NpmTrust -Arguments $createArguments -Label "updating $package"
    if ($created.ExitCode -ne 0) {
        return [pscustomobject]@{
            Package = $package
            Result  = 'orphaned'
            Detail  = (Get-FailureReason $created)
            Restore = (Get-RestoreCommand -Package $package -Config $config)
        }
    }

    return [pscustomobject]@{ Package = $package; Result = 'updated'; Detail = "$($config.file) -> $TargetFile"; Restore = $null }
}

# --- main -------------------------------------------------------------------

if ($File -ne (Split-Path $File -Leaf)) {
    throw "-File must be a bare workflow filename, got `"$File`"."
}
if ($File -notmatch '\.ya?ml$') {
    throw "-File must end in .yml or .yaml, got `"$File`"."
}

$workflowPath = Join-Path $script:RepoRoot (Join-Path '.github/workflows' $File)
if (-not (Test-Path $workflowPath)) {
    Write-Host "[!] .github/workflows/$File does not exist in this checkout." -ForegroundColor Yellow
    Write-Host '    npm does not verify the workflow exists, so a typo here silently breaks publishing.' -ForegroundColor Yellow
    Write-Host ''
}

if ($Login) {
    Write-Host 'Signing in to npm -- a browser window will open...'
    # Deliberately uncaptured: npm drives its own browser flow when it owns the
    # terminal, and there is nothing here worth parsing.
    & npm login "--registry=$Registry" --auth-type=web
    if ($LASTEXITCODE -ne 0) { throw 'npm login failed.' }
    Write-Host ''
}

$allPackages = @(Get-PublicPackage)

if ($Only) {
    $unknown = $Only | Where-Object { $allPackages -notcontains $_ }
    if ($unknown) {
        throw "Not public packages in this workspace: $($unknown -join ', ')"
    }
    $packages = @($allPackages | Where-Object { $Only -contains $_ })
}
else {
    $packages = @($allPackages)
}

if (-not $packages) {
    Write-Host 'No matching public packages found.'
    return
}

$fromLabel = $From
if ($From -eq '*') { $fromLabel = 'any workflow' }

Write-Host "Checking the trusted publisher of $($packages.Count) public package(s) on npm..."
Write-Host "   $fromLabel -> $File"
Write-Host ''

$plans = @()
foreach ($package in $packages) {
    $plan = Get-MigrationPlan -Package $package -FromFile $From -TargetFile $File
    $plans += $plan

    switch ($plan.Action) {
        'migrate' { Write-Host "  [>] $package - $($plan.Detail)" -ForegroundColor Cyan }
        'done' { Write-Host "  [=] $package - $($plan.Detail)" -ForegroundColor Green }
        'skip' { Write-Host "  [-] $package - $($plan.Detail)" -ForegroundColor DarkGray }
        'error' { Write-Host "  [x] $package - $($plan.Detail)" -ForegroundColor Red }
    }
}

$toMigrate = @($plans | Where-Object { $_.Action -eq 'migrate' })
$errored = @($plans | Where-Object { $_.Action -eq 'error' })

Write-Host ''
if ($errored.Count -gt 0) {
    Write-Host "[!] $($errored.Count) package(s) could not be read; they will be left alone." -ForegroundColor Yellow
}

if ($toMigrate.Count -eq 0) {
    Write-Host 'Nothing to change.'
    if ($errored.Count -gt 0) { exit 1 }
    return
}

Write-Host "$($toMigrate.Count) package(s) will be moved to ${File}:"
$toMigrate | ForEach-Object {
    $repository = $_.Config.repository
    if ($Repository) { $repository = $Repository }
    [pscustomobject]@{
        Package    = $_.Package
        Repository = $repository
        From       = $_.Config.file
        To         = $File
    }
} | Format-Table -AutoSize | Out-String -Width 4096 | Write-Host

if ($DryRun) {
    Write-Host '-DryRun: no changes made.'
    return
}

Write-Host 'Each package is revoked and re-created, because npm allows only one trusted publisher per package.'

if (-not $Yes) {
    $answer = (Read-Host 'Proceed? (y/N)').Trim().ToLower()
    if ($answer -ne 'y' -and $answer -ne 'yes') {
        Write-Host 'Aborted.'
        return
    }
}

Write-Host ''
$results = @()
foreach ($plan in $toMigrate) {
    $outcome = Invoke-Migration -Plan $plan -TargetFile $File -RepositoryOverride $Repository
    $results += $outcome

    if ($outcome.Result -eq 'updated') {
        Write-Host "  [=] $($outcome.Package) - $($outcome.Detail)" -ForegroundColor Green
        continue
    }

    if ($outcome.Result -eq 'orphaned') {
        Write-Host ''
        Write-Host "  [x] $($outcome.Package) - revoked, but creating the new config failed:" -ForegroundColor Red
        Write-Host "      $($outcome.Detail)" -ForegroundColor Red
        Write-Host ''
        Write-Host "      $($outcome.Package) now has NO trusted publisher. Restore it with:" -ForegroundColor Yellow
        Write-Host "        $($outcome.Restore)" -ForegroundColor Yellow
        Write-Host ''
    }
    else {
        Write-Host "  [x] $($outcome.Package) - $($outcome.Detail) (left unchanged)" -ForegroundColor Red
    }

    Write-Host 'Stopping so the remaining packages are untouched. Re-run to continue.' -ForegroundColor Yellow
    break
}

$updated = @($results | Where-Object { $_.Result -eq 'updated' })
Write-Host ''
Write-Host "Updated $($updated.Count)/$($toMigrate.Count) package(s) to $File."

$failed = @($results | Where-Object { $_.Result -ne 'updated' })
if ($failed.Count -gt 0 -or $errored.Count -gt 0) {
    exit 1
}
