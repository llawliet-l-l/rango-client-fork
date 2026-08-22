$packages = @(
    "@arthur2079/logging-console"
    "@arthur2079/logging-core"
    "@arthur2079/logging-sentry"
    "@arthur2079/logging-subscriber"
    "@arthur2079/logging-types"
    "@arthur2079/queue-manager-core"
    "@arthur2079/queue-manager-rango-preset"
    "@arthur2079/queue-manager-react"
    "@arthur2079/signer-cosmos"
    "@arthur2079/signer-evm"
    "@arthur2079/signer-solana"
    "@arthur2079/signer-starknet"
    "@arthur2079/signer-sui"
    "@arthur2079/signer-ton"
    "@arthur2079/signer-tron"
    "@arthur2079/wallets-core"
    "@arthur2079/provider-all"
    "@arthur2079/provider-binance"
    "@arthur2079/provider-bitget"
    "@arthur2079/provider-braavos"
    "@arthur2079/provider-brave"
    "@arthur2079/provider-coin98"
    "@arthur2079/provider-coinbase"
    "@arthur2079/provider-cosmostation"
    "@arthur2079/provider-default"
    "@arthur2079/provider-enkrypt"
    "@arthur2079/provider-exodus"
    "@arthur2079/provider-freighter"
    "@arthur2079/provider-gemwallet"
    "@arthur2079/provider-keplr"
    "@arthur2079/provider-leap-cosmos"
    "@arthur2079/provider-ledger"
    "@arthur2079/provider-math-wallet"
    "@arthur2079/provider-metamask"
    "@arthur2079/provider-okx"
    "@arthur2079/provider-phantom"
    "@arthur2079/provider-rabby"
    "@arthur2079/provider-ready"
    "@arthur2079/provider-safe"
    "@arthur2079/provider-safepal"
    "@arthur2079/provider-slush"
    "@arthur2079/provider-solflare"
    "@arthur2079/provider-taho"
    "@arthur2079/provider-tokenpocket"
    "@arthur2079/provider-tomo"
    "@arthur2079/provider-tonconnect"
    "@arthur2079/provider-trezor"
    "@arthur2079/provider-tron-link"
    "@arthur2079/provider-trustwallet"
    "@arthur2079/provider-unisat"
    "@arthur2079/provider-vultisig"
    "@arthur2079/provider-walletconnect-2"
    "@arthur2079/provider-xdefi"
    "@arthur2079/provider-xverse"
    "@arthur2079/wallets-react"
    "@arthur2079/wallets-shared"
    "@arthur2079/charts"
    "@arthur2079/widget-embedded"
    "@arthur2079/ui"
)

# Authenticate upfront. npm trust list exits immediately with EOTP when stdout
# is captured (non-TTY), so auth cannot be triggered mid-loop.
$null = npm whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Not logged in. Running npm login ..."
    npm login
    if ($LASTEXITCODE -ne 0) { Write-Error "npm login failed. Exiting."; exit 1 }
}

foreach ($package in $packages) {
    Write-Host "Revoking trusted publishing for $package ..."

    $policyId = $null
    $raw = npm trust list $package
    $idLine = $raw | Where-Object { $_ -match '^id:\s+\S+' } | Select-Object -First 1
    if ($idLine) {
        $policyId = ($idLine -split '\s+', 2)[1].Trim()
    } else {
        Write-Host "Warning: Could not find trust policy id for $package"
        Write-Host "  Raw output: $raw"
    }

    if ($policyId) {
        npm trust revoke $package --id=$policyId
    } else {
        Write-Host "No trust policy found for $package, skipping."
    }

    Write-Host "Done. Waiting 2 seconds ..."
    Start-Sleep -Seconds 2
}

Write-Host "Done."
