# Security and privacy

Never commit or print into project files:
- API keys
- access tokens
- passwords
- private keys
- provider credentials
- cloud/service secrets
- copied temporary secrets
- real `.env` secrets

Do not send raw order contents, SKUs, item names, customer data, dimensions, saved product catalogs, or carton inventories to analytics by default.

Provider/model credentials used by Cline or any VS Code extension are local tooling configuration and must never become Packmetry source code.

Before any configuration-related commit, inspect the staged diff for accidental secrets.
