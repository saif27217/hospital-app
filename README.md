# hospital-app

Offline insurance-network hospital explorer for Hyderabad (Expo SDK 53, file-based routing, zero runtime network calls).

## Data

- 618 hospitals = 307 HDFC Ergo + 311 Care Supreme (`src/data/hospitals.json`).
- 86 hospitals appear under **both** networks: evidence-mapped pairs (shared phone / unit-of-parent chain, audited 2026-11-08). Both sides of a pair carry the counterpart's name; 172 records are `insurance: "both"`-paired.
- Pair provenance: `scripts/insurance_overlap.json` — `{"confirmed": [[hdfcName, careName], ×86], "chain": [×31]}`, names verbatim.

## Screens

- **Home** — network counters, recommended chips.
- **/search** — full list; insurance filter chip cycles `all (618) → hdfc (307) → care (311) → both (172)`; ⚑ marks dual-network rows; detail card prints `Also listed as: <counterpart>`.
- **/contact** — phone/address cards.

## Run

```bash
npm install
node_modules/.bin/expo start --port 8081   # no login; Ctrl-C to stop
```

## Ship checklist

```bash
npm test                                   # node:test assertions
node_modules/.bin/expo export --platform android --no-optimization
node_modules/.bin/expo export --platform ios
EXPO_TOKEN=<token> EAS_SKIP_AUTO_FINGERPRINT=1 npx eas-cli@latest update -p android -m "msg" --environment production --branch production --non-interactive
# same for -p ios
```

- `EXPO_TOKEN` (not `EAS_ACCESS_TOKEN`); CI token is publish-scoped — GraphQL read commands reject it.
- `EAS_SKIP_AUTO_FINGERPRINT=1` required (Android fingerprint step crashes on `adaptiveIcon` in app.json).
- `appVersion` must equal the OTA `--branch` label (currently `production`, version `1.2.0`).

## Versions

- **1.2.0** (2026-11-08): dual-network mapping, `both` chip, counterpart lines. EAS groups: android `f0bba6d9-62f7-4500-81e4-34d0807a9138`, ios `401f4f3a-d37e-450a-ac55-7c35b9cb8227`.
- **1.1.0** (2026-11-07): enriched data, contacts screen. EAS groups: android `320823d9-5a77-4185-9806-8f72d9d1301c`, ios `2c16b41e-c660-4d31-9146-7d42a96c3778`.

## Related

- CLI/data repo: `saif27217/hospital-search-hdfc-care` (same 86-pair mapping, `dual` field).
- Hermes skill: `hospital-search` (canonical `~/.hermes/skills/hospital-search/`, mirrored in `hermes-skills`).
