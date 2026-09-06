# Serpent Plugin Pool

Official directory for Serpent community plugins.

Host 从本仓库 `main` 上的 `catalog.v1.json`（及同名 `.sha256`）拉取目录。目录里的每一条都视为**已认证**：目前只有仓库所有者能合并。

Serpent reads `catalog.v1.json` and `catalog.v1.json.sha256` from `main`. Every listed plugin is certified because only the repository owner can merge.

## Layout

```text
plugins/<pluginId>.json   # one file per listed plugin
removed.json              # withdrawn ids (not uninstalled automatically)
catalog.v1.json           # generated snapshot Host downloads
catalog.v1.json.sha256    # SHA-256 of catalog.v1.json (digest only)
```

## Pinning

Each entry pins `releaseTag`, `version`, and per-platform `fileName` + `sha256`.
Serpent downloads that exact GitHub Release ZIP and refuses the bytes if the hash does not match. Changing a published asset without updating this catalog makes installation fail.

## Add or update a plugin

1. Publish a GitHub Release whose assets are named `{pluginId}-{version}-{platform}.zip` (or `-any.zip`).
2. Add or edit `plugins/<pluginId>.json`.
3. Run `node scripts/generate-catalog.mjs`.
4. Open a pull request. Merging to `main` is the certification step.

Do not preinstall plugins inside Serpent. The Host only fetches this directory when the user opens the plugin community.
